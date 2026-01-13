import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import getSupabaseAdmin from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
    const session = await verifyAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    try {
        const body = await req.json();
        const { action } = body;

        // Action: Toggle Ban
        if (action === 'toggle_ban') {
            const { userId, isBanned, reason } = body;

            // 1. Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    is_banned: isBanned,
                    ban_reason: isBanned ? reason : null, // Clear reason if unbanning
                    banned_by: isBanned ? session.adminName : null
                })
                .eq('id', userId);

            if (updateError) throw updateError;

            // 2. Create Audit Log
            const { error: logError } = await supabase
                .from('admin_audit_logs')
                .insert({
                    admin_name: session.adminName,
                    action: isBanned ? 'USER_BAN' : 'USER_UNBAN',
                    target_user_id: userId,
                    details: isBanned ? `Sebep: ${reason}` : 'Yasak kaldırıldı.'
                });

            if (logError) console.error('Audit log error:', logError);

            return NextResponse.json({ success: true, message: isBanned ? 'Kullanıcı yasaklandı.' : 'Kullanıcı yasağı kaldırıldı.' });
        }

        // Action: Update Settings
        if (action === 'update_setting') {
            const { key, value } = body;

            const { error } = await supabase
                .from('system_settings')
                .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() });

            if (error) throw error;

            return NextResponse.json({ success: true, message: 'Ayarlar güncellendi.' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (err: any) {
        console.error('Admin action error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
