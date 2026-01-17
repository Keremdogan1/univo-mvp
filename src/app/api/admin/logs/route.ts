import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import getSupabaseAdmin from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
    const session = await verifyAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    try {
        const { data: logs, error } = await supabase
            .from('admin_audit_logs')
            .select(`
                *,
                admin:profiles!admin_id(full_name)
            `)
            .order('created_at', { ascending: false })
            .limit(500);

        if (error) throw error;

        // Parse details JSON and map admin name
        const enrichedLogs = logs?.map(log => {
            let targetUserName = null;
            let targetUserId = null;
            try {
                if (log.details) {
                    const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                    targetUserName = details.target_user_name || details.user_name || null;
                    targetUserId = details.target_user_id || details.user_id || null;
                }
            } catch (e) {}

            return {
                ...log,
                admin_name: (log as any).admin?.full_name || 'Bilinmeyen Admin',
                target_user_name: targetUserName,
                target_user_id: targetUserId
            };
        }) || [];

        return NextResponse.json(enrichedLogs);
    } catch (err: any) {
        console.error('Admin logs fetch error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
