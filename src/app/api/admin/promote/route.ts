import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SUPER_ADMIN_NAMES } from '@/lib/constants';
import getSupabaseAdmin from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
    try {
        const { fullName } = await req.json();

        if (!fullName || !SUPER_ADMIN_NAMES.includes(fullName)) {
            return NextResponse.json(
                { success: false, error: 'Yetkisiz erişim.' },
                { status: 403 }
            );
        }

        const supabase = getSupabaseAdmin();
        
        // Find or create admin identity for logging consistency
        const { data: admin } = await supabase
            .from('admin_identities')
            .select('id')
            .eq('admin_name', fullName)
            .single();

        let adminId = admin?.id;
        
        if (!adminId) {
            const { data: newAdmin } = await supabase
                .from('admin_identities')
                .insert({ admin_name: fullName })
                .select('id')
                .single();
            adminId = newAdmin?.id;
        }

        const sessionData = JSON.stringify({
            id: adminId || 'generic-admin',
            name: fullName,
            timestamp: Date.now()
        });

        const cookieStore = await cookies();
        cookieStore.set('univo_admin_session', sessionData, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Admin promotion error:', err);
        return NextResponse.json(
            { success: false, error: 'Sunucu hatası.' },
            { status: 500 }
        );
    }
}
