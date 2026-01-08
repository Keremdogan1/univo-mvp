import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: friendshipId } = await params;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json(); // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const currentUserId = user.id;

    // Get the friendship request
    const { data: friendship, error: fetchError } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .single();

    if (fetchError || !friendship) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Verify permission (only receiver can accept/reject)
    if (friendship.receiver_id !== currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (friendship.status !== 'pending') {
      return NextResponse.json({ error: 'Request is not pending' }, { status: 400 });
    }

    if (action === 'reject') {
      const { error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (deleteError) {
        return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 });
      }

      // Cleanup notification for the receiver (me)
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', currentUserId)
        .eq('actor_id', friendship.requester_id)
        .eq('type', 'friend_request');

      return NextResponse.json({ message: 'Friend request rejected' });
    }

    // Action is accept
    const { error: updateError } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);

    if (updateError) {
      console.error('Accept error:', updateError);
      return NextResponse.json({ error: 'Failed to accept request' }, { status: 500 });
    }

    // Cleanup friend_request notification for the receiver (me)
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', currentUserId)
      .eq('actor_id', friendship.requester_id)
      .eq('type', 'friend_request');

    // Get current user profile for notification
    const { data: receiverProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', currentUserId)
      .single();

    // Create notification for the requester
    await supabase
      .from('notifications')
      .insert({
        user_id: friendship.requester_id,
        type: 'friend_request_accepted',
        actor_id: currentUserId,
        message: `${receiverProfile?.full_name || 'Bir kullanıcı'} arkadaşlık isteğini kabul etti`
      });

    return NextResponse.json({ message: 'Friend request accepted' });

  } catch (error) {
    console.error('Friend request response API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
