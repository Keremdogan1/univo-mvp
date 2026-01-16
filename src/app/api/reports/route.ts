import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/admin-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST - Create a new report
export async function POST(req: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Get user from auth cookie
        const cookieStore = await cookies();
        const authCookie = cookieStore.get('sb-oqgdnywowtfjenjmrmwi-auth-token');
        
        if (!authCookie) {
            return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        // Parse auth token to get user id
        let userId: string | null = null;
        try {
            const tokenData = JSON.parse(authCookie.value);
            const { data: { user } } = await supabase.auth.getUser(tokenData.access_token);
            userId = user?.id || null;
        } catch {
            return NextResponse.json({ error: 'Geçersiz oturum.' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 401 });
        }

        const body = await req.json();
        const { contentType, contentId, category, reason } = body;

        if (!contentType || !contentId || !category) {
            return NextResponse.json({ error: 'Eksik bilgi.' }, { status: 400 });
        }

        // Check if user already reported this content
        const { data: existingReport } = await supabase
            .from('content_reports')
            .select('id')
            .eq('reporter_id', userId)
            .eq('content_id', contentId)
            .single();

        if (existingReport) {
            return NextResponse.json({ error: 'Bu içeriği zaten şikayet ettiniz.' }, { status: 400 });
        }

        // Create report
        const { error } = await supabase
            .from('content_reports')
            .insert({
                reporter_id: userId,
                content_type: contentType,
                content_id: contentId,
                category,
                reason: reason || null,
                status: 'pending'
            });

        if (error) {
            console.error('Report insert error:', error);
            throw error;
        }

        return NextResponse.json({ success: true, message: 'Şikayet alındı.' });
    } catch (err: any) {
        console.error('Report API error:', err);
        return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
    }
}

// GET - List all reports (Admin only)
export async function GET(req: NextRequest) {
    const session = await verifyAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data, error } = await supabase
            .from('content_reports')
            .select(`
                *,
                reporter:profiles!reporter_id(full_name, avatar_url)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (err: any) {
        console.error('Reports list error:', err);
        return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
    }
}
