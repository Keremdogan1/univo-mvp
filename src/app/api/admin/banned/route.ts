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
        const { data: bannedUsers, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_banned', true)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(bannedUsers);
    } catch (err: any) {
        console.error('Admin banned users fetch error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
