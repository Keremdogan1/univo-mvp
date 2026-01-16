import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        
        // Clear the admin session cookie
        cookieStore.set('univo_admin_session', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0 // Expire immediately
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Admin logout error:', err);
        return NextResponse.json(
            { success: false, error: 'Sunucu hatası.' },
            { status: 500 }
        );
    }
}
