import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import getSupabaseAdmin from '@/lib/supabase-admin';
import { SUPER_ADMIN_NAMES } from '@/lib/constants';

// SECURITY: Credentials are now stored in environment variables
const SHARED_EMAIL = process.env.ADMIN_SHARED_EMAIL || '';
const SHARED_PASSWORD = process.env.ADMIN_SHARED_PASSWORD || '';

function hashPassword(password: string) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { step } = body;

        // Step 1: Shared Credentials
        if (step === 'verify-shared') {
            const { email, password } = body;

            if (email === SHARED_EMAIL && password === SHARED_PASSWORD) {
                return NextResponse.json({ success: true });
            } else {
                return NextResponse.json(
                    { success: false, error: 'E-posta veya şifre yanlış.' },
                    { status: 401 }
                );
            }
        }

        // Step 2: Personal Identity
        if (step === 'verify-personal') {
            const { name, password } = body;

            if (!name || !password) {
                return NextResponse.json(
                    { success: false, error: 'İsim ve şifre gereklidir.' },
                    { status: 400 }
                );
            }

            // SECURITY: Only approved admins can authenticate
            if (!SUPER_ADMIN_NAMES.includes(name)) {
                return NextResponse.json(
                    { success: false, error: 'Bu isim admin listesinde bulunmuyor. Yetkisiz erişim girişimi.' },
                    { status: 403 }
                );
            }

            const supabase = getSupabaseAdmin();
            const passwordHash = hashPassword(password);

            // Check if admin exists
            const { data: admin, error } = await supabase
                .from('admin_identities')
                .select('*')
                .eq('admin_name', name)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error('Admin lookup error:', error);
                return NextResponse.json(
                    { success: false, error: 'Veritabanı hatası.' },
                    { status: 500 }
                );
            }

            let adminId = admin?.id;
            let isNewAdmin = false;

            if (!admin) {
                // Register new admin
                const { data: newAdmin, error: createError } = await supabase
                    .from('admin_identities')
                    .insert({
                        admin_name: name,
                        password_hash: passwordHash
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('Create admin error:', createError);
                    return NextResponse.json(
                        { success: false, error: 'Admin oluşturulamadı.' },
                        { status: 500 }
                    );
                }
                adminId = newAdmin.id;
                isNewAdmin = true;
            } else {
                // Verify password
                if (admin.password_hash !== passwordHash) {
                    return NextResponse.json(
                        { success: false, error: 'Hatalı şifre.' },
                        { status: 401 }
                    );
                }

                // Update last login
                await supabase
                    .from('admin_identities')
                    .update({ last_login_at: new Date().toISOString() })
                    .eq('id', adminId);
            }

            // Create Session Cookie
            // We will sign a simple token or just store the admin ID signed.
            // For MVP without JWT lib, we will store a JSON object.
            // Ideally, use a signed JWT. Here we rely on httpOnly cookie.

            const sessionData = JSON.stringify({
                id: adminId,
                name: name,
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

            return NextResponse.json({
                success: true,
                message: isNewAdmin ? 'Admin hesabı oluşturuldu ve giriş yapıldı.' : 'Giriş başarılı.'
            });
        }

        return NextResponse.json({ success: false, error: 'Geçersiz adım.' }, { status: 400 });

    } catch (err: any) {
        console.error('Admin auth error:', err);
        return NextResponse.json(
            { success: false, error: 'Sunucu hatası.' },
            { status: 500 }
        );
    }
}
