import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import imaps from 'imap-simple';

// Helper to fetch emails (Reusable for GET and POST)
async function fetchRecentEmails(username: string, password: string) {
    const config = {
      imap: {
        user: username,
        password: password,
        host: 'imap.metu.edu.tr',
        port: 993,
        tls: true,
        authTimeout: 15000,
        tlsOptions: { 
            rejectUnauthorized: false,
            servername: 'imap.metu.edu.tr'
        }
      }
    };

    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: ['HEADER'], 
      markSeen: false,
      struct: true
    };
    
    // Fetch last 14 days or just recent count
    const delay = 24 * 3600 * 1000 * 14; 
    const since = new Date(Date.now() - delay);
    
    const searchRes = await connection.search(['ALL', ['SINCE', since]], fetchOptions);

    // Sort by ID (sequence) descending
    searchRes.sort((a, b) => b.attributes.uid - a.attributes.uid);
    const top15 = searchRes.slice(0, 15);
    
    const emails = top15.map((m) => {
        const headerPart = m.parts.find(p => p.which === 'HEADER');
        const headerBody = headerPart ? headerPart.body : {};
        
        return {
            id: m.attributes.uid,
            seq: m.seqNo,
            subject: headerBody.subject ? headerBody.subject[0] : 'Konusuz',
            from: headerBody.from ? headerBody.from[0] : 'Bilinmeyen Gönderen',
            date: headerBody.date ? headerBody.date[0] : new Date().toISOString()
        };
    });

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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return NextResponse.json({ emails });

  } catch (error: any) {
    console.error('IMAP Error:', error);
    return NextResponse.json({ error: error.message || 'connection failed' }, { status: 500 });
  }
}
