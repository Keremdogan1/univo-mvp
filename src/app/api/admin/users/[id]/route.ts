import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import getSupabaseAdmin from '@/lib/supabase-admin';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await verifyAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const userId = params.id;

    try {
        // 1. Fetch Profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

        // 2. Fetch Communities (Member or Admin via separate calls or joins)
        // Check communities where user is 'admin_id'
        const { data: adminCommunities } = await supabase
            .from('communities')
            .select('id, name, created_at')
            .eq('admin_id', userId);

        // Check communities where user is a follower
        const { data: followingCommunities } = await supabase
            .from('community_followers')
            .select('community_id, joined_at, communities(name)')
            .eq('user_id', userId);


        // 3. Fetch Recent Posts
        const { data: recentPosts } = await supabase
            .from('posts')
            .select('id, content, created_at, community_id, communities(name)')
            .eq('author_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        // 4. Fetch Audit Logs for this user (logs where target_user_id is this user)
        const { data: userLogs } = await supabase
            .from('admin_audit_logs')
            .select('*')
            .eq('target_user_id', userId)
            .order('created_at', { ascending: false });

        return NextResponse.json({
            profile,
            communities: {
                admin: adminCommunities || [],
                following: followingCommunities?.map(f => ({
                    id: f.community_id,
                    name: (f.communities as any)?.name,
                    joined_at: f.joined_at
                })) || []
            },
            posts: recentPosts || [],
            logs: userLogs || []
        });

    } catch (err: any) {
        console.error('Admin user detail fetch error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
