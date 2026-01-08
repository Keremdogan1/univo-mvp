import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: receiverId } = await params;
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

    const requesterId = user.id;

    if (requesterId === receiverId) {
      return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 });
    }

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('id, status, requester_id, receiver_id')
      .or(`and(requester_id.eq.${requesterId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${requesterId})`)
      .single();

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json({ error: 'Already friends' }, { status: 400 });
      }
      if (existing.status === 'pending') {
        return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 });
      }
    }

    // Create friend request
    const { error: requestError } = await supabase
      .from('friendships')
      .insert({
        requester_id: requesterId,
        receiver_id: receiverId,
        status: 'pending'
      });

    if (requestError) {
      console.error('Friend request error:', requestError);
      return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 });
    }

    // Deduplicate notifications: Delete any existing friend_request notification from this requester to this receiver
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', receiverId)
      .eq('actor_id', requesterId)
      .eq('type', 'friend_request');

    // Get requester's name for notification
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', requesterId)
      .single();

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: receiverId,
        type: 'friend_request',
        actor_id: requesterId,
        message: `${requesterProfile?.full_name || 'Bir kullanıcı'} sana arkadaşlık isteği gönderdi`
      });

    return NextResponse.json({ 
      message: 'Friend request sent successfully',
      status: 'pending'
    });

  } catch (error) {
    console.error('Friend request API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: otherUserId } = await params;
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

    const currentUserId = user.id;

    // Delete friendship (works for both pending and accepted)
    const { error: deleteError } = await supabase
      .from('friendships')
      .delete()
      .or(`and(requester_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`);

    if (deleteError) {
      console.error('Unfriend error:', deleteError);
      return NextResponse.json({ error: 'Failed to remove friendship' }, { status: 500 });
    }

    // Cleanup: Remove associated friend_request notification
    await supabase
      .from('notifications')
      .delete()
      .or(`and(user_id.eq.${otherUserId},actor_id.eq.${currentUserId}),and(user_id.eq.${currentUserId},actor_id.eq.${otherUserId})`)
      .eq('type', 'friend_request');

    // Also cleanup accepted notifications
    await supabase
      .from('notifications')
      .delete()
      .or(`and(user_id.eq.${otherUserId},actor_id.eq.${currentUserId}),and(user_id.eq.${currentUserId},actor_id.eq.${otherUserId})`)
      .eq('type', 'friend_request_accepted');

    return NextResponse.json({ 
      message: 'Friendship removed successfully'
    });

  } catch (error) {
    console.error('Unfriend API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: otherUserId } = await params;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json({ status: 'none' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ status: 'none' });
    }

    const currentUserId = user.id;

    // Get friendship status
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id, status, requester_id, receiver_id')
      .or(`and(requester_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .single();

    if (!friendship) {
      return NextResponse.json({ status: 'none' });
    }

    // Determine the perspective
    const isSentByMe = friendship.requester_id === currentUserId;
    
    return NextResponse.json({ 
      status: friendship.status,
      isSentByMe,
      friendshipId: friendship.id
    });

  } catch (error) {
    console.error('Friendship status API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
