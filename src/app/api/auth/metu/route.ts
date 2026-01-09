import { NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import getSupabaseAdmin from '@/lib/supabase-admin';
import { analyzeCourses } from '@/lib/course-analyzer';
import { toTitleCase } from '@/lib/utils';

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
        timeout: 30000, 
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        }
    }));

    // 2. Headless Login to ODTÜClass
    const baseUrl = 'https://odtuclass2025f.metu.edu.tr';
    const loginPageUrl = `${baseUrl}/login/index.php`;

    // A. Internal METU Login (Scraping)
    try {
        const initialRes = await client.get(loginPageUrl);
        const $ = cheerio.load(initialRes.data);
        const loginToken = $('input[name="logintoken"]').val();

        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('anchor', '');
        if (loginToken) formData.append('logintoken', loginToken as string);

        const loginRes = await client.post(loginPageUrl, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': loginPageUrl }
        });

        const finalUrl = loginRes.config.url || '';
        const isDashboard = finalUrl.includes('/my/') || loginRes.data.includes('user/profile.php') || loginRes.data.includes('Log out');

        if (!isDashboard) {
             const $fail = cheerio.load(loginRes.data);
             const errorMsg = $fail('.loginerrors').text();
             
             if (errorMsg) {
                 return NextResponse.json({ error: errorMsg }, { status: 401 });
             } else {
                 if (finalUrl.includes('login')) {
                    return NextResponse.json({ error: 'Giriş yapılamadı. Kullanıcı adı veya şifre hatalı.' }, { status: 401 });
                 }
             }
        }
        
        const $dash = cheerio.load(loginRes.data);
        let fullName = $dash('.usertext').text() || $dash('.user-name').text() || $dash('#action-menu-toggle-1 span.userbutton span.usertext').text();
        if (fullName) {
            fullName = fullName.replace('You are logged in as', '').trim();
            fullName = toTitleCase(fullName);
        }
        
        // --- SCRAPING & ANALYSIS ---
        let courses: { name: string, url: string }[] = [];
        try {
            const courseLinks = $dash('a[href*="course/view.php?id="]');
            courseLinks.each((_, el) => {
                const name = $(el).text().trim();
                let url = $(el).attr('href');
                
                if (name && url) {
                    // Ensure absolute URL
                    if (!url.startsWith('http')) {
                        url = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
                    }

                    // Clean URL (Keep only ID)
                    const idMatch = url.match(/id=(\d+)/);
                    if (idMatch && idMatch[1]) {
                        url = `${baseUrl}/course/view.php?id=${idMatch[1]}`;
                    }

                    if (!courses.find(c => c.url === url)) {
                        courses.push({ name, url });
                    }
                }
            });
        } catch (scrapeErr) {
            console.warn('Could not scrape courses:', scrapeErr);
        }

        let detectedDept = '';
        let detectedClass = '';
        if (courses.length > 0) {
            const results = analyzeCourses(courses);
            detectedDept = results.detectedDepartment || '';
            detectedClass = results.detectedClass || '';
        }

        // --- 3. UNIVO AUTHENTICATION ---
        const eduEmail = `${username}@metu.edu.tr`;
        const supabaseAdmin = getSupabaseAdmin();
        
        // Pagination handling to find user by email
        let user: User | undefined;
        let page = 1;
        let hasNextPage = true;
        
        while (hasNextPage && !user) {
            const { data: { users: pageUsers }, error } = await supabaseAdmin.auth.admin.listUsers({
                page: page,
                perPage: 1000
            });
            
            if (error || !pageUsers || pageUsers.length === 0) {
                hasNextPage = false;
            } else {
                user = pageUsers.find(u => u.email === eduEmail);
                if (!user && pageUsers.length < 1000) {
                    hasNextPage = false;
                }
                page++;
            }
        }

        if (!user) {
            const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: eduEmail,
                password: randomPassword,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName || username,
                    is_metu_verified: true,
                    student_username: username,
                    department: detectedDept,
                    class_year: detectedClass,
                    odtu_courses: courses
                }
            });

            if (createError) throw createError;
            user = newUser.user;

            if (user) {
                await supabaseAdmin.from('profiles').insert({
                    id: user.id,
                    full_name: fullName || username,
                    student_id: username.replace('e', ''),
                    department: detectedDept || null,
                    class_year: detectedClass || null,
                    is_metu_verified: true,
                    role: 'student'
                });
            }
        } else {
             // C. Update Metadata if exists
             const updates: any = {};
             
             // Update Full Name (fix for Turkish characters)
             if (fullName && user.user_metadata.full_name !== fullName) {
                 updates.full_name = fullName;
             }

             if (!user.user_metadata.is_metu_verified) updates.is_metu_verified = true;
             if (detectedDept && !user.user_metadata.department) updates.department = detectedDept;
             if (detectedClass && !user.user_metadata.class_year) updates.class_year = detectedClass;
             if (courses.length > 0) updates.odtu_courses = courses;
             
             if (Object.keys(updates).length > 0) {
                 await supabaseAdmin.auth.admin.updateUserById(user.id, {
                     user_metadata: { ...user.user_metadata, ...updates }
                 });
             }
             
             // Also update profile table
             const pUpdates: any = {};
             if (fullName) pUpdates.full_name = fullName;

             if (detectedDept) pUpdates.department = detectedDept;
             else if (detectedDept === '' && (user.user_metadata.department === 'BASE' || user.user_metadata.department === 'DBE')) {
                 pUpdates.department = null;
             }
             if (detectedClass) pUpdates.class_year = detectedClass;
             
             if (Object.keys(pUpdates).length > 0) {
                 await supabaseAdmin.from('profiles').update(pUpdates).eq('id', user.id);
             }
        }

        // --- DIRECT SESSION CREATION ---
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: eduEmail
        });

        if (linkError) throw linkError;

        const tokenHash = linkData.properties.hashed_token;
        const { data: sessionData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'magiclink'
        });

        if (verifyError) throw verifyError;

        return NextResponse.json({
            success: true,
            studentInfo: {
                fullName: fullName?.trim(),
                username: username,
                department: detectedDept || 'Hazırlık'
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
