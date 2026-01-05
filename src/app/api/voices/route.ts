import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase Environment Variables');
        return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const sort = searchParams.get('sort');

  
    let query = supabase
      .from('campus_voices')
      .select(`
        *,
        profiles:user_id (full_name, department, avatar_url),
        voice_reactions (user_id, reaction_type),
        voice_comments (id, content, created_at, user:user_id (full_name))
      `)
      .eq('moderation_status', 'approved');

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (sort === 'popular') {
      query = query.order('created_at', { ascending: false }); 
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching voices:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedData = data.map((voice: any) => {
      const likes = voice.voice_reactions.filter((r: any) => r.reaction_type === 'like').length;
      const dislikes = voice.voice_reactions.filter((r: any) => r.reaction_type === 'dislike').length;
      
      return {
        id: voice.id,
        content: voice.content,
        created_at: voice.created_at,
        is_anonymous: voice.is_anonymous,
        is_editors_choice: voice.is_editors_choice,
        tags: voice.tags,
        user: voice.is_anonymous ? 
          { full_name: 'Rumuzu Öğrenci', department: 'Kampüs', avatar_url: null } : 
          voice.profiles,
        counts: {
          likes,
          dislikes,
          comments: voice.voice_comments.length
        },
        reactions: voice.voice_reactions,
        comments: voice.voice_comments.map((c: any) => ({
            id: c.id,
            content: c.content,
            created_at: c.created_at,
            user: c.user?.full_name || 'Kullanıcı'
        }))
      };
    });

    return NextResponse.json({ voices: formattedData });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase Environment Variables');
            return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
        }

        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized: Missing Auth Header' }, { status: 401 });
        }

        // Initialize Supabase with the user's token so RLS works
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } }
        });

        // We can still verify the user for our own logic
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('Auth Error:', authError);
            return NextResponse.json({ error: `Unauthorized: ${authError?.message || 'No User'}` }, { status: 401 });
        }

        const json = await request.json();
        const { content, is_anonymous, tags } = json;

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Daily Limit Check
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count, error: limitError } = await supabase
            .from('campus_voices')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', today.toISOString());

        if (limitError) {
             console.error('Limit check error:', limitError);
             return NextResponse.json({ error: 'Limit check failed' }, { status: 500 });
        }

        if (count && count >= 1) {
            return NextResponse.json({ error: 'Bugünlük paylaşım hakkınız doldu. Yarın tekrar bekleriz!' }, { status: 429 });
        }

        const { data, error } = await supabase
        .from('campus_voices')
        .insert({
            user_id: user.id,
            content: content.substring(0, 280),
            is_anonymous: is_anonymous || false,
            tags: tags || [],
            moderation_status: 'approved'
        })
        .select()
        .single();

        if (error) {
            console.error('Error creating voice:', error);
            // This error message will likely be "relation ... does not exist" if DB is missing
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ voice: data });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
