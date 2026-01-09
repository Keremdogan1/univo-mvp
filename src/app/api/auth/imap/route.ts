import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import imaps from 'imap-simple';

// Helper to fetch emails (Reusable for GET and POST)
async function fetchRecentEmails(username: string, password: string) {
    // Normalize username: Remove domain if present, as ODTÜ IMAP usually expects NetID
    const cleanUsername = username.includes('@') ? username.split('@')[0] : username;

    const config = {
      imap: {
        user: cleanUsername,
        password: password,
        host: 'imap.metu.edu.tr',
        port: 993,
        tls: true,
        authTimeout: 20000,
        tlsOptions: { 
            rejectUnauthorized: false,
            servername: 'imap.metu.edu.tr'
        }
      }
    };

    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    // Optimization: Don't fetch headers for ALL messages in the last 14 days.
    // 1. Just find the messages first (lightweight)
    const delay = 24 * 3600 * 1000 * 30; // Check last 30 days to be safe
    const since = new Date(Date.now() - delay);
    const searchCriteria = [['SINCE', since]];
    
    // We only need the UID and SeqNo initially to sort
    const searchOptions = {
        bodies: ['HEADER.FIELDS (DATE)'], // Minimal fetch to verify existence
        struct: false
    };

    // Get all messages in range (Lightweight)
    const searchRes = await connection.search(searchCriteria, searchOptions);

    // 2. Sort by UID descending (Newest first)
    searchRes.sort((a, b) => b.attributes.uid - a.attributes.uid);

    // 3. Take only the top 15 latest
    const top15 = searchRes.slice(0, 15);

    // 4. If we have messages, fetch their FULL headers now
    let emails: any[] = [];
    
    if (top15.length > 0) {
        // imap-simple doesn't have a direct "fetch by UIDs" helper that returns specific bodies easily 
        // without re-searching, but we can search by UID range or specific UIDs.
        // Generating a UID search criteria for these specific emails:
        const uids = top15.map(m => m.attributes.uid);
        const fetchCriteria = [['UID', uids]];
        const fetchPartsOptions = {
            bodies: ['HEADER'], 
            markSeen: false,
            struct: true
        };

        const detailedRes = await connection.search(fetchCriteria, fetchPartsOptions);
        
        // Map the detailed results
        emails = detailedRes.map((m) => {
            const headerPart = m.parts.find(p => p.which === 'HEADER');
            const headerBody = headerPart ? headerPart.body : {};
            
            // Decode Subject if encoded (e.g. =?UTF-8?B?...) - simple heuristic, can add library later if critical
            let subject = headerBody.subject ? headerBody.subject[0] : 'Konusuz';
            let from = headerBody.from ? headerBody.from[0] : 'Bilinmeyen Gönderen';

            return {
                id: m.attributes.uid,
                seq: m.seqNo,
                subject: subject,
                from: from,
                date: headerBody.date ? headerBody.date[0] : new Date().toISOString()
            };
        });

        // Re-sort because the second search might return in ID order or random
        emails.sort((a, b) => b.id - a.id);
    }

    connection.end();
    return emails;
}

export async function GET(request: Request) {
    const cookieStore = await cookies();
    const sessionToResume = cookieStore.get('session_imap');

    if (!sessionToResume) {
        return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    try {
        // Simple base64 decoding (In production use proper encryption)
        const decoded = Buffer.from(sessionToResume.value, 'base64').toString('utf-8');
        const [username, ...passParts] = decoded.split(':');
        const password = passParts.join(':');

        if (!username || !password) throw new Error('Invalid session');

        const emails = await fetchRecentEmails(username, password);
        return NextResponse.json({ emails, username });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Kullanıcı adı ve şifre gereklidir.' }, { status: 400 });
    }

    // Attempt fetch to verify credentials
    const emails = await fetchRecentEmails(username, password);

    // If successful, set HTTP-only cookie
    const sessionValue = Buffer.from(`${username}:${password}`).toString('base64');
    const cookieStore = await cookies();
    cookieStore.set('session_imap', sessionValue, { 
        httpOnly: true, 
        // Secure only in genuine production (HTTPS). For local dev (including mobile/IP), false.
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return NextResponse.json({ emails });

  } catch (error: any) {
    console.error('IMAP Error:', error);
    return NextResponse.json({ error: error.message || 'connection failed' }, { status: 500 });
  }
}
