import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
    const { rating, comment } = json;

    if (!rating || rating < 1 || rating > 5) {
         return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }

    const { error } = await supabase
      .from('event_feedback')
      .upsert({
        event_id: id,
        user_id: user.id,
        rating,
        comment
      }, { onConflict: 'event_id, user_id' });

    if (error) {
      console.error('Feedback Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
