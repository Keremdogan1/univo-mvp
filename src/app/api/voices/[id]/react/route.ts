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
    const { type } = json; 

    if (!['like', 'neutral', 'dislike'].includes(type)) {
         return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    const { error } = await supabase
      .from('voice_reactions')
      .upsert({
        voice_id: id,
        user_id: user.id,
        reaction_type: type
      }, { onConflict: 'voice_id, user_id' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // --- Notification Logic ---
    if (type === 'like') {
        try {
            // 1. Get Voice Owner
            const { data: voice } = await supabase
                .from('campus_voices')
                .select('user_id, content')
                .eq('id', id)
                .single();
            
            if (voice && voice.user_id !== user.id) {
                // 2. Check Target User's Notification Settings
                const { data: targetProfile } = await supabase
                    .from('profiles')
                    .select('notification_settings')
                    .eq('id', voice.user_id)
                    .single();
                
                const settings = targetProfile?.notification_settings as any;
                // Default to true if setting is missing (opt-out model is standard for likes, or follow schema default)
                // Our schema default is true.
                const shouldNotify = settings?.likes !== false; 

                if (shouldNotify) {
                    // 3. Create Notification
                    // Check if notification already exists to avoid spam (optional but good practice)
                    // For now, we will just insert. Univo UI handles grouping usually or we can rely on recentness.
                    // Ideally we might want to avoid duplicate notifications for the same like action if spammed.
                    // But 'upsert' on reaction helps.
                    
                    await supabase.from('notifications').insert({
                        user_id: voice.user_id,
                        actor_id: user.id,
                        type: 'voice_like',
                        message: 'Gönderinizi beğendi',
                        metadata: {
                            voice_id: id,
                            preview: voice.content?.substring(0, 50)
                        }
                    });
                }
            }
        } catch (notifyError) {
            console.error('Notification trigger failed:', notifyError);
            // Don't fail the reaction because notification failed
        }
    }
    // --------------------------

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
