import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import getSupabaseAdmin from '@/lib/supabase-admin';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await verifyAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (await params).id;
    const supabase = getSupabaseAdmin();

    try {
        // 1. Fetch Profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

        // 2. Fetch Auth User (for Email)
        const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(userId);
        
        // 3. Activity Counts
        const { count: voiceCount } = await supabase
            .from('campus_voices')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        const { count: commentCount } = await supabase
            .from('campus_comments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        const { count: reactionCount } = await supabase
            .from('voice_reactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // 4. Recent Activity (Voices)
        const { data: recentVoices } = await supabase
            .from('campus_voices')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

        // 5. Audit logs related to this user (Bans, etc)
        const { data: auditLogs } = await supabase
            .from('admin_audit_logs')
            .select('*')
            .eq('target_user_id', userId)
            .order('created_at', { ascending: false });

        return NextResponse.json({
            user: {
                ...profile,
                email: authUser?.email,
                last_sign_in_at: authUser?.last_sign_in_at,
            },
            stats: {
                voiceCount: voiceCount || 0,
                commentCount: commentCount || 0,
                reactionCount: reactionCount || 0
            },
            recentVoices: recentVoices || [],
            auditLogs: auditLogs || []
        });

    } catch (err: any) {
        console.error('Admin user detail fetch error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
