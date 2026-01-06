import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const authHeader = request.headers.get('Authorization');
    
    let currentUserId: string | null = null;
    let supabase;
    
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

    if (sentError) {
      console.error('Sent friends fetch error:', sentError);
    }

    // Fetch confirmed friendships where user is receiver
    const { data: receivedFriendships, error: receivedError } = await supabase
      .from('friendships')
      .select('id, requester_id, receiver_id, created_at')
      .eq('status', 'accepted')
      .eq('receiver_id', userId);

    if (receivedError) {
      console.error('Received friends fetch error:', receivedError);
    }

    const friendships = [...(sentFriendships || []), ...(receivedFriendships || [])];

    if (!friendships || friendships.length === 0) {
      return NextResponse.json({ friends: [], count: 0 });
    }

    // Extract friend IDs
    const friendIds = friendships.map((f: any) => 
      f.requester_id === userId ? f.receiver_id : f.requester_id
    );

    // Fetch friend profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, department, university')
      .in('id', friendIds);
    
    if (profilesError) {
      console.error('Profiles fetch error:', profilesError);
       return NextResponse.json({ error: 'Failed to fetch friend profiles' }, { status: 500 });
    }

    // Combine data
    const friends = friendships.map((f: any) => {
      const isRequester = f.requester_id === userId;
      const friendId = isRequester ? f.receiver_id : f.requester_id;
      const profile = profiles?.find((p: any) => p.id === friendId);
      
      if (!profile) return null;

      return {
        ...profile,
        friendshipId: f.id,
        friendsSince: f.created_at
      };
    }).filter(Boolean);

    return NextResponse.json({ 
      friends,
      count: friends.length
    });

  } catch (error) {
    console.error('Friends list API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
