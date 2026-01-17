import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import getSupabaseAdmin from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await verifyAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    try {
        const { data, error } = await supabase
            .from('campus_voices')
            .select(`
                *,
                profiles:user_id (full_name, nickname, avatar_url)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedVoices = (data as any[]).map(voice => ({
            ...voice,
            profiles: Array.isArray(voice.profiles) ? voice.profiles[0] : voice.profiles
        }));

        return NextResponse.json({ voices: formattedVoices });
    } catch (err: any) {
        console.error('Admin voices fetch error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
