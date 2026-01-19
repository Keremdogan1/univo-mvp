import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const authHeader = request.headers.get('Authorization');
    
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Init with auth context
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { content, parent_id } = json;

    if (!content || !content.trim()) {
         return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('voice_comments')
      .insert({
        voice_id: id,
        user_id: user.id,
        content: content.trim(),
        parent_id: parent_id || null // Add parent_id
      })
      .select(`
        *,
        user:user_id (full_name)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // --- Notification Logic ---
    try {
        const actorId = user.id;
        
        // 1. Fetch Voice Owner
        const { data: voiceData } = await supabase
            .from('campus_voices')
            .select('user_id, content') // select content for potential preview
            .eq('id', id)
            .single();

        if (voiceData) {
            let targetUserId = voiceData.user_id;
            let notificationType = 'voice_comment';
            let message = 'Gönderinize yorum yaptı';

            // 2. If Reply, Notify Parent Comment Owner instead (or also? usually just parent logic for replies)
            if (parent_id) {
                const { data: parentComment } = await supabase
                    .from('voice_comments')
                    .select('user_id')
                    .eq('id', parent_id)
                    .single();
                
                if (parentComment) {
                    targetUserId = parentComment.user_id;
                    notificationType = 'voice_reply';
                    message = 'Yorumunuza yanıt verdi';
                }
            }

            // 3. Insert Notification (if not self-action)
            if (targetUserId !== actorId) {
                // Check Target User's Notification Settings
                const { data: targetProfile } = await supabase
                    .from('profiles')
                    .select('notification_settings')
                    .eq('id', targetUserId)
                    .single();

                const settings = targetProfile?.notification_settings as any;
                // Default to true. Logic: if it's a voice_comment check 'comments', if reply check 'comments' (or 'mentions' if we had that distinction, but usually comments covers replies)
                // Let's assume 'comments' covers both for now as per plan
                const shouldNotify = settings?.comments !== false;

                if (shouldNotify) {
                    await supabase.from('notifications').insert({
                        user_id: targetUserId,
                        actor_id: actorId,
                        type: notificationType,
                        message: message,
                        metadata: {
                            voice_id: id,
                            comment_id: data.id, // the new comment id
                            parent_id: parent_id
                        }
                    });
                }
            }
        }
    } catch (notifyError) {
        console.error('Notification trigger failed:', notifyError);
        // Don't fail the request if notification fails
    }
    // --------------------------

    return NextResponse.json({ comment: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
