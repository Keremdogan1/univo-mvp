import { NextResponse } from 'next/server';
import getSupabaseAdmin from '@/lib/supabase-admin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

        const supabase = getSupabaseAdmin();
        const { data: authUser } = await supabase.auth.admin.listUsers();
        const targetUser = authUser.users.find(u => u.email === email);

        if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { data: notifications, error } = await supabase
            .from('notifications')
            .select(`
                *,
                actor:profiles!notifications_actor_id_fkey (id, full_name)
            `)
            .eq('user_id', targetUser.id);

        return NextResponse.json({ 
            userId: targetUser.id,
            notifications,
            error
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
