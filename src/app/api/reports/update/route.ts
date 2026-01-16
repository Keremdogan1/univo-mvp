import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/lib/admin-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
    const session = await verifyAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const body = await req.json();
        const { reportId, status } = body;

        if (!reportId || !status) {
            return NextResponse.json({ error: 'Eksik bilgi.' }, { status: 400 });
        }

        const { error } = await supabase
            .from('content_reports')
            .update({ 
                status, 
                reviewed_by: session.adminName 
            })
            .eq('id', reportId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Report update error:', err);
        return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
    }
}
