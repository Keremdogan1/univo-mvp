import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import getSupabaseAdmin from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await verifyAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseAdmin();

    try {
        // 1. Fetch Community Details with Admin Profile
        const { data: community, error: communityError } = await supabase
            .from('communities')
            .select(`
                *,
                admin:admin_id (id, full_name, avatar_url, student_id, department)
            `)
            .eq('id', id)
            .single();

        if (communityError) throw communityError;

        // 2. Fetch Admin Email separately (since it's in auth.users, not profiles)
        let adminEmail = null;
        if (community.admin_id) {
            const { data: { user: authUser } } = await supabase.auth.admin.getUserById(community.admin_id);
            adminEmail = authUser?.email;
        }

        // 3. Fetch Follower Count
        const { count: followerCount, error: followersError } = await supabase
            .from('community_followers')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', id);

        if (followersError) throw followersError;

        // 3. Fetch Events
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .eq('community_id', id)
            .order('date', { ascending: false });

        if (eventsError) throw eventsError;

        return NextResponse.json({
            community: {
                ...community,
                follower_count: followerCount || 0,
                event_count: events?.length || 0
            },
            admin: {
                ...community.admin,
                email: adminEmail
            },
            events: events || []
        });

    } catch (err: any) {
        console.error('Admin community detail fetch error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
