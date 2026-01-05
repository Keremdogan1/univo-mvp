import { NextResponse } from 'next/server';

interface Announcement {
  id: string;
  source: string; // 'Kütüphane', 'Spor Müdürlüğü', 'ÖİDB'
  title: string;
  date: string; // ISO or display format
  link: string;
  timestamp: number; // For sorting
  summary?: string;
}

// Helper to clean text
const cleanText = (text: string) => text.replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();

// Generic Parser for "Miys" Theme (Sports & Library)
const parseDrupalMiys = (html: string, baseUrl: string, sourceName: string): Announcement[] => {
  const announcements: Announcement[] = []; // Initialize announcements array
  // Regex to find views-row
  const rowRegex = /<div class="views-row">([\s\S]*?)<\/div><\/span><\/div>/g;
  
  // Specific regex for internal fields
  const titleRegex = /<a href="([^"]+)" class="list-group-item__title">([^<]+)<\/a>/;
  const dateRegex = /<time datetime="([^"]+)"/;
  const bodyRegex = /<p class="list-group-item__body">([\s\S]*?)<\/p>/;
  
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const rowContent = match[1];
    const titleMatch = titleRegex.exec(rowContent);
    const dateMatch = dateRegex.exec(rowContent);
    const bodyMatch = bodyRegex.exec(rowContent);

    if (titleMatch && dateMatch) {
      const link = titleMatch[1].startsWith('http') ? titleMatch[1] : `${baseUrl}${titleMatch[1]}`;
      const title = cleanText(titleMatch[2]);
      const dateStr = dateMatch[1]; // ISO string like 2025-12-30T14:12:22+03:00
      const dateObj = new Date(dateStr);
      let summary = '';
      
      if (bodyMatch) {
          // Remove anchor tags but keep text, remove newlines
          summary = cleanText(bodyMatch[1].replace(/<[^>]+>/g, ' '));
      }
      
      announcements.push({
        id: `${sourceName}-${link}`,
        source: sourceName,
        title: title,
        date: dateObj.toLocaleDateString('tr-TR'),
        link: link,
        timestamp: dateObj.getTime(),
        summary: summary // Add extracted summary
      });
    }
  }
  return announcements;
};

// Parser for ÖİDB (simple body link extraction)
const parseOidb = (html: string, baseUrl: string): Announcement[] => {
  const announcements: Announcement[] = [];
  // Look for the main content body
  const bodyRegex = /class="field field--name-body[^>]*>([\s\S]*?)<\/div>/;
  const bodyMatch = bodyRegex.exec(html);
  
  if (bodyMatch) {
    const content = bodyMatch[1];
    // Find paragraphs with links
    const linkRegex = /<p[^>]*>[\s\S]*?<a href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<\/p>/g;
    
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const href = match[1];
      const text = cleanText(match[2]);
      // Skip email links or very short text
      if (href.startsWith('mailto:') || text.length < 5) continue;
      
      const link = href.startsWith('http') ? href : `${baseUrl}${href}`;
      
      // ÖİDB main page doesn't always have dates next to links, use today as fallback or try to find date text
      // In the sample, specific dates weren't clearly next to links in a structured way. 
      // We'll trust the "Son Güncelleme" or just show them.
      // Actually, looking at the raw HTML, there is "2025-2026 Akademik Yılı..."
      
      announcements.push({
        id: `OIDB-${link}`,
        source: 'ÖİDB',
        title: text,
        date: 'Güncel',
        link: link,
        timestamp: Date.now() // Default to top since we can't easily parse date
      });
    }
  }
  return announcements;
};

export async function GET() {
  try {
    const results: Announcement[] = [];
    
    // 1. Fetch Library
    try {
      const libRes = await fetch('https://lib.metu.edu.tr/', { next: { revalidate: 3600 } });
      if (libRes.ok) {
        const text = await libRes.text();
        results.push(...parseDrupalMiys(text, 'https://lib.metu.edu.tr', 'Kütüphane'));
      }
    } catch (e) { console.error('Lib fetch failed', e); }

    // 2. Fetch Sports
    try {
      const sporRes = await fetch('http://spormd.metu.edu.tr/', { next: { revalidate: 3600 } });
      if (sporRes.ok) {
        const text = await sporRes.text();
        results.push(...parseDrupalMiys(text, 'http://spormd.metu.edu.tr', 'Spor MD'));
      }
    } catch (e) { console.error('Spor fetch failed', e); }

    // 3. Fetch ÖİDB
    try {
        const oidbRes = await fetch('https://oidb.metu.edu.tr/tr/duyurular', { next: { revalidate: 3600 } });
        if (oidbRes.ok) {
            const text = await oidbRes.text();
            results.push(...parseOidb(text, 'https://oidb.metu.edu.tr'));
        }
    } catch (e) { console.error('OIDB fetch failed', e); }

    // Filter last 7 days
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const filteredResults = results.filter(a => a.timestamp >= oneWeekAgo);

    // Sort by date (newest first)
    filteredResults.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({ announcements: filteredResults });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch announcements', announcements: [] }, { status: 500 });
  }
}
