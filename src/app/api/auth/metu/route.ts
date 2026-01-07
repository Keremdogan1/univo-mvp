import { NextResponse } from 'next/server';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

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

        const loginRes = await client.post(loginPageUrl, formData, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': loginPageUrl }
        });

        // 303/302 means redirect (Success in Moodle context usually)
        if (loginRes.status !== 303 && loginRes.status !== 302) {
             // Check content for error
             const $fail = cheerio.load(loginRes.data);
             const errorMsg = $fail('.loginerrors').text() || 'Giriş başarısız.';
             return NextResponse.json({ error: errorMsg }, { status: 401 });
        }
        
        // Success! Follow redirect to scrape info
        const redirectUrl = loginRes.headers['location'];
        if (!redirectUrl || redirectUrl.includes('login')) {
            return NextResponse.json({ error: 'Giriş doğrulanamadı.' }, { status: 401 });
        }
        
        const dashboardRes = await client.get(redirectUrl);
        const $dash = cheerio.load(dashboardRes.data);
        
        let fullName = $dash('.usertext').text() || $dash('.user-name').text() || $dash('#action-menu-toggle-1 span.userbutton span.usertext').text();
        if (fullName) fullName = fullName.replace('You are logged in as', '').trim();
        
        // --- ENHANCED SCRAPING: Get Department ---
        let department = '';
        try {
            // 1. Find Profile URL from Dashboard
            // Look for any link containing 'user/profile.php'
            const profileUrl = $dash('a[href*="user/profile.php"]').first().attr('href');
            
            if (profileUrl) {
                console.log('Navigating to Profile:', profileUrl);
                const profileRes = await client.get(profileUrl);
                const $prof = cheerio.load(profileRes.data);

                // 2. Search for "Department" or "Bölüm"
                // Strategy: Find the label, then get the text immediately following it.
                // Moodle profiles often use <dt>Label</dt> <dd>Value</dd> OR <li><span>Label</span>Value</li>
                
                // Moodle Description List approach
                const deptLabel = $prof('dt:contains("Department"), dt:contains("Bölüm")').first();
                if (deptLabel.length > 0) {
                    department = deptLabel.next('dd').text().trim();
                } else {
                    // List Item approach
                    const listLabel = $prof('li span:contains("Department"), li span:contains("Bölüm")').first();
                    if (listLabel.length > 0) {
                        // The text might be in the parent li, keeping only text nodes? 
                        // Or adjacent. Moodle structure varies.
                        department = listLabel.parent().text().replace(listLabel.text(), '').trim();
                    }
                }
                
                console.log('Scraped Department:', department);
            }
        } catch (scrapeErr) {
            console.warn('Could not scrape department:', scrapeErr);
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
                    department: department
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

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: eduEmail
        });

        if (linkError) throw linkError;

        console.log('ODTÜ Auth Success:', fullName, 'Dept:', department);

        return NextResponse.json({
            success: true,
            studentInfo: {
                fullName: fullName?.trim(),
                username: username,
                department: department
            },
            redirectUrl: linkData.properties.action_link
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
