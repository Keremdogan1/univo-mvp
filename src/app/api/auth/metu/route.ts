import { NextResponse } from 'next/server';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import getSupabaseAdmin from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Kullanıcı adı ve şifre gereklidir.' }, { status: 400 });
    }

    // 1. Setup Cookie Jar for Session Management
    const jar = new CookieJar();
    const client = wrapper(axios.create({ 
        jar,
        withCredentials: true,
        timeout: 15000, // Increased to 15 seconds for slower connections/devices
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        }
    }));

    // 2. Headless Login to ODTÜClass
    const baseUrl = 'https://odtuclass2025f.metu.edu.tr';
    const loginPageUrl = `${baseUrl}/login/index.php`;

    // A. Internal METU Login (Scraping)
    // First, verify credentials by trying to log in
    try {
        const initialRes = await client.get(loginPageUrl);
        const $ = cheerio.load(initialRes.data);
        const loginToken = $('input[name="logintoken"]').val();

        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('anchor', '');
        if (loginToken) formData.append('logintoken', loginToken as string);

        // Allow axios to follow redirects (cookie jar handles state)
        const loginRes = await client.post(loginPageUrl, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': loginPageUrl }
        });

        console.log('ODTÜ Login Final Status:', loginRes.status);
        console.log('ODTÜ Login Final URL:', loginRes.config.url);

        // Check if we ultimately landed on the dashboard (or my page)
        // Moodle dashboard usually has '/my/' in the URL
        const finalUrl = loginRes.config.url || '';
        const isDashboard = finalUrl.includes('/my/') || loginRes.data.includes('user/profile.php') || loginRes.data.includes('Log out');

        if (!isDashboard) {
             // Try to see if it's just a landing page that requires clicking "Continue"
             // But usually axios follows valid redirects.
             // If we are still on login page, it failed.
             const $fail = cheerio.load(loginRes.data);
             const errorMsg = $fail('.loginerrors').text();
             
             if (errorMsg) {
                 return NextResponse.json({ error: errorMsg }, { status: 401 });
             } else {
                 // Fallback: If we can't find specific error but url is login
                 if (finalUrl.includes('login')) {
                    return NextResponse.json({ error: 'Giriş yapılamadı. Kullanıcı adı veya şifre hatalı.' }, { status: 401 });
                 }
             }
        }
        
        // We are on the dashboard (or redirected page)
        // Use loginRes.data directly since we followed redirects
        const $dash = cheerio.load(loginRes.data);
        
        let fullName = $dash('.usertext').text() || $dash('.user-name').text() || $dash('#action-menu-toggle-1 span.userbutton span.usertext').text();
        if (fullName) fullName = fullName.replace('You are logged in as', '').trim();
        
        // --- ENHANCED SCRAPING: Get Department & Courses ---
        // Optimization: We scrape only name and courses, department is derived later
        let department = '';
        let courses: { name: string, url: string }[] = [];
        
        try {
            // First find the courses from the dashboard
            const courseLinks = $dash('a[href*="course/view.php?id="]');
            courseLinks.each((_, el) => {
                const name = $(el).text().trim();
                const url = $(el).attr('href');
                if (name && url && !courses.find(c => c.url === url)) {
                    courses.push({ name, url });
                }
            });

            // Try to get more courses from the profile page if limited on dashboard
            if (courses.length < 3) {
                const profileUrl = $dash('a[href*="user/profile.php"]').first().attr('href');
                if (profileUrl) {
                    const profileRes = await client.get(profileUrl);
                    const $prof = cheerio.load(profileRes.data);
                    const profCourseLinks = $prof('a[href*="course/view.php?id="]');
                    profCourseLinks.each((_, el) => {
                        const name = $prof(el).text().trim();
                        const url = $prof(el).attr('href');
                        if (name && url && !courses.find(c => c.url === url)) {
                            courses.push({ name, url });
                        }
                    });
                }
            }
        } catch (scrapeErr) {
            console.warn('Could not scrape courses:', scrapeErr);
        }

        // --- 3. UNIVO AUTHENTICATION (Proxy Strategy) ---
        
        const eduEmail = `${username}@metu.edu.tr`;
        const supabaseAdmin = getSupabaseAdmin();
        
        // A. Check if user already exists
        const { data: { users }, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();
        let user = users.find(u => u.email === eduEmail);

        if (!user) {
            // B. Create User (if new)
            // We set a random password because user will use ODTÜ Auth to login primarily.
            const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
            
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: eduEmail,
                password: randomPassword,
                email_confirm: true, // Auto-confirm since they verified via ODTÜ credentials
                user_metadata: {
                    full_name: fullName || username,
                    is_metu_verified: true,
                    student_username: username,
                    department: department,
                    odtu_courses: courses
                }
            });

            if (createError) throw createError;
            user = newUser.user;

            // Create Profile Record
            if (user) {
                await supabaseAdmin.from('profiles').insert({
                    id: user.id,
                    full_name: fullName || username,
                    student_id: username.replace('e', ''), // Simple heuristic
                    department: department || null,
                    is_metu_verified: true,
                    role: 'student'
                });
            }
        } 
        
        // C. Update Metadata if exists (re-verify & update department)
        if (user) {
             const updates: any = {};
             if (!user.user_metadata.is_metu_verified) updates.is_metu_verified = true;
             if (department && !user.user_metadata.department) updates.department = department;
             if (courses.length > 0) updates.odtu_courses = courses;
             
             if (Object.keys(updates).length > 0) {
                 await supabaseAdmin.auth.admin.updateUserById(user.id, {
                     user_metadata: { ...user.user_metadata, ...updates }
                 });
             }
             
             // Also update profile table if department was missing
             if (department) {
                 await supabaseAdmin.from('profiles').update({ department }).eq('id', user.id);
             }
        }

        // --- DIRECT SESSION CREATION (No Magic Link Redirect) ---
        // Generate a magic link token and immediately verify it server-side
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: eduEmail
        });

        if (linkError) throw linkError;

        // Extract the token from the action link
        const actionLink = linkData.properties.action_link;
        const tokenHash = linkData.properties.hashed_token;

        // Verify the OTP server-side to create a session immediately
        const { data: sessionData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'magiclink'
        });

        if (verifyError) {
            console.error('OTP Verify Error:', verifyError);
            throw verifyError;
        }

        console.log('ODTÜ Auth Success:', fullName, 'Dept:', department);

        // Return session tokens directly - no redirect needed!
        return NextResponse.json({
            success: true,
            studentInfo: {
                fullName: fullName?.trim(),
                username: username,
                department: department
            },
            session: sessionData.session ? {
                access_token: sessionData.session.access_token,
                refresh_token: sessionData.session.refresh_token,
                expires_at: sessionData.session.expires_at
            } : null
        });

    } catch (err: any) {
        console.error('Scraping Logic Error:', err.message);
        return NextResponse.json({ error: 'ODTÜ sistemine bağlanılamadı: ' + err.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error('ODTÜ Auth Error:', error);
    return NextResponse.json({ error: 'Sunucu hatası: ' + error.message }, { status: 500 });
  }
}
