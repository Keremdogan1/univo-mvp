import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import imaps from 'imap-simple';

// Helper to fetch emails (Reusable for GET and POST)
async function fetchRecentEmails(username: string, password: string, extraUids: number[] = []) {
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
    const delay = 24 * 3600 * 1000 * 14; // Increase to 14 days for robustness (UI will filter if needed)
    const sinceDate = new Date(Date.now() - delay);
    
    // IMAP SINCE expects "DD-Mon-YYYY" format (e.g., 01-Jan-2024)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const sinceStr = `${String(sinceDate.getDate()).padStart(2, '0')}-${months[sinceDate.getMonth()]}-${sinceDate.getFullYear()}`;
    const searchCriteria = [['SINCE', sinceStr]];
    
    // We only need the UID and SeqNo initially to sort
    const searchOptions = {
        bodies: ['HEADER.FIELDS (DATE)'], 
        struct: false
    };

    // Get all messages in range (Lightweight)
    let searchRes = await connection.search(searchCriteria, searchOptions);

    // 2. Sort by UID descending (Newest first)
    searchRes.sort((a, b) => b.attributes.uid - a.attributes.uid);

    // 3. Take only the top 50 latest
    const topLimit = searchRes.slice(0, 50);
    
    // Collect UIDs to fetch fully
    let uidsToFetch = topLimit.map(m => m.attributes.uid);

    // 4. Add Extra UIDs (Starred) if provided
    if (extraUids && extraUids.length > 0) {
        const numericExtras = extraUids.map(u => Number(u)).filter(n => !isNaN(n));
        const newUids = numericExtras.filter(uid => !uidsToFetch.includes(uid));
        uidsToFetch = [...uidsToFetch, ...newUids];
    }

    // 5. If we have messages, fetch their FULL headers now
    let emails: any[] = [];
    
    if (uidsToFetch.length > 0) {
        // IMPORTANT: Join UIDs with a comma for the IMAP search string. 
        // Passing an array directly to 'UID' criteria can sometimes result in only searching for the first item.
        const uidString = uidsToFetch.join(',');
        const fetchCriteria = [['UID', uidString]];
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
            
            // Decode Subject if encoded
            let subject = headerBody.subject ? headerBody.subject[0] : 'Konusuz';
            let from = headerBody.from ? headerBody.from[0] : 'Bilinmeyen Gönderen';
            let dateStr = headerBody.date ? headerBody.date[0] : new Date().toISOString();
            let timestamp = Date.parse(dateStr) || Date.now();

            return {
                id: m.attributes.uid,
                seq: m.seqNo,
                subject: subject,
                from: from,
                date: dateStr,
                timestamp: timestamp
            };
        });

        // Re-sort because the second search might return in different order
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

        const starredHeader = request.headers.get('X-Starred-Uids');
        const starredUids = starredHeader ? JSON.parse(starredHeader) : [];

        const emails = await fetchRecentEmails(username, password, starredUids);
        return NextResponse.json({ emails, username });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, starredUids } = body; // starredUids: [123, 456]

    if (!username || !password) {
      return NextResponse.json({ error: 'Kullanıcı adı ve şifre gereklidir.' }, { status: 400 });
    }

    // Attempt fetch to verify credentials AND get starred emails
    const emails = await fetchRecentEmails(username, password, starredUids || []);

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
