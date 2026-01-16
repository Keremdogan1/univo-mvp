import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SUPER_ADMIN_NAMES } from '@/lib/constants';

// API to check if user has a valid admin session
export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('univo_admin_session');

        if (!sessionCookie?.value) {
            return NextResponse.json({ isAdmin: false });
        }

        try {
            const session = JSON.parse(sessionCookie.value);
            
            // Validate session has required fields and name is in approved list
            if (session.name && SUPER_ADMIN_NAMES.includes(session.name)) {
                // Check if session is not expired (24 hours)
                const sessionAge = Date.now() - session.timestamp;
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                
                if (sessionAge < maxAge) {
                    return NextResponse.json({ 
                        isAdmin: true, 
                        adminName: session.name 
                    });
                }
            }
        } catch (e) {
            // Invalid JSON in cookie
            console.error('Invalid admin session cookie:', e);
        }

        return NextResponse.json({ isAdmin: false });
    } catch (err) {
        console.error('Admin session check error:', err);
        return NextResponse.json({ isAdmin: false });
    }
}
