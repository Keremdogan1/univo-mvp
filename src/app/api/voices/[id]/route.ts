import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import getSupabaseAdmin from '@/lib/supabase-admin';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error('Auth error:', authError);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership using user's client
    const { data: voice, error: fetchError } = await supabase
        .from('campus_voices')
        .select('user_id')
        .eq('id', id)
        .single();

    if (fetchError || !voice) {
        console.error('Voice not found:', fetchError);
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (voice.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use admin client for deletion to bypass RLS
    let supabaseAdmin;
    try {
        supabaseAdmin = getSupabaseAdmin();
    } catch (adminError: any) {
        console.error('Admin client error:', adminError);
        // Fallback to soft delete using user's client
        const { error: softDeleteError } = await supabase
            .from('campus_voices')
            .update({ moderation_status: 'deleted' })
            .eq('id', id);
        
        if (softDeleteError) {
            console.error('Soft delete fallback error:', softDeleteError);
            return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    }

    // Delete related records first (cascade)
    await supabaseAdmin.from('voice_reactions').delete().eq('voice_id', id);
    await supabaseAdmin.from('voice_comments').delete().eq('voice_id', id);

    // Hard delete the voice post
    const { error: deleteError } = await supabaseAdmin
        .from('campus_voices')
        .delete()
        .eq('id', id);

    if (deleteError) {
        console.error('Delete error:', deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('DELETE API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(supabaseUrl!, supabaseKey!, {
        global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { content, tags } = body;

    if (!content || !content.trim()) {
        return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    // Verify ownership
    const { data: voice, error: fetchError } = await supabase
        .from('campus_voices')
        .select('user_id')
        .eq('id', id)
        .single();

    if (fetchError || !voice) {
        console.error('Update: Post not found or fetch error:', fetchError);
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (voice.user_id !== user.id) {
        console.error('Update: Forbidden. User:', user.id, 'Owner:', voice.user_id);
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update
    const { data: updatedVoice, error: updateError } = await supabase
        .from('campus_voices')
        .update({ 
            content: content.substring(0, 280),
            tags: tags || []
        })
        .eq('id', id)
        .select();

    if (updateError) {
        console.error('Update: Supabase error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const voiceData = updatedVoice && updatedVoice.length > 0 ? updatedVoice[0] : null;

    if (!voiceData) {
         return NextResponse.json({ error: 'Update successful but no data returned' }, { status: 500 });
    }

    return NextResponse.json({ success: true, voice: voiceData });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
