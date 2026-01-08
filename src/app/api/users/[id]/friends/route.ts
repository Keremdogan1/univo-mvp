import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const authHeader = request.headers.get('Authorization');
    
    let currentUserId: string | null = null;
    let supabase;
    
    // Initialize Supabase Client (Standard)
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await supabase.auth.getUser(token);
      currentUserId = user?.id || null;
    } else {
      supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    // Check privacy settings
    const { data: profile } = await supabase
      .from('profiles')
      .select('show_friends')
      .eq('id', userId)
      .single();

    if (!profile?.show_friends && currentUserId !== userId) {
      return NextResponse.json({ 
        error: 'Friends list is private',
        isPrivate: true 
      }, { status: 403 });
    }

    // Fetch confirmed friendships where user is requester
    const { data: sentFriendships, error: sentError } = await supabase
      .from('friendships')
      .select('id, requester_id, receiver_id, created_at')
      .eq('status', 'accepted')
      .eq('requester_id', userId);

    if (sentError) console.error('Sent friends fetch error:', sentError);

    // Fetch confirmed friendships where user is receiver
    const { data: receivedFriendships, error: receivedError } = await supabase
      .from('friendships')
      .select('id, requester_id, receiver_id, created_at')
      .eq('status', 'accepted')
      .eq('receiver_id', userId);

    if (receivedError) console.error('Received friends fetch error:', receivedError);

    const friendships = [...(sentFriendships || []), ...(receivedFriendships || [])];

    if (!friendships || friendships.length === 0) {
      return NextResponse.json({ friends: [], count: 0 });
    }

    // Extract friend IDs
    const friendIds = friendships.map((f: any) => 
      f.requester_id === userId ? f.receiver_id : f.requester_id
    ).filter(Boolean);

    if (friendIds.length === 0) {
       return NextResponse.json({ friends: [], count: 0 });
    }

    // Attempt to use Service Role Key for profiles to bypass RLS
    let profileClient = supabase;
    if (supabaseServiceKey) {
        // Use service key if available for profile fetching (Bypasses RLS)
        profileClient = createClient(supabaseUrl, supabaseServiceKey);
    }

    // Fetch friend profiles
    const { data: profiles, error: profilesError } = await profileClient
      .from('profiles')
      .select('id, full_name, avatar_url, department')
      .in('id', friendIds);
    
    if (profilesError) {
      console.error('Profiles fetch error:', profilesError);
       return NextResponse.json({ 
         error: `Profil Hatası: ${profilesError.message} (Code: ${profilesError.code})`,
         details: profilesError
       }, { status: 500 });
    }

    const toTitleCase = (str: string) => {
      if (!str) return str;
      return str.split(' ').map(word => {
        if (!word) return word;
        const trimmed = word.trim();
        if (!trimmed) return '';
        return trimmed.charAt(0).toLocaleUpperCase('tr-TR') + trimmed.slice(1).toLocaleLowerCase('tr-TR');
      }).filter(Boolean).join(' ');
    };

    // Combine data
    const friends = friendships.map((f: any) => {
      // Logic: if I am requester, friend is receiver.
      const friendId = f.requester_id === userId ? f.receiver_id : f.requester_id;
      
      const p = profiles?.find((p: any) => p.id === friendId);
      
      if (!p) return null;

      const cleanDept = (dept: string) => {
        if (!dept) return dept;
        return dept.replace(/\.base$/i, '').replace(/\s*BASE$/i, '').replace(/\s*DBE$/i, '').trim();
      };

      return {
        ...p,
        full_name: toTitleCase(p.full_name),
        department: cleanDept(p.department),
        friendshipId: f.id,
        friendsSince: f.created_at
      };
    }).filter(Boolean);

    return NextResponse.json({ 
      friends,
      count: friends.length
    });

  } catch (error: any) {
    console.error('Friends list API critical error:', error);
    return NextResponse.json({ 
        error: `Server Error: ${error?.message || 'Unknown error'}`,
        details: JSON.stringify(error) 
    }, { status: 500 });
  }
}
