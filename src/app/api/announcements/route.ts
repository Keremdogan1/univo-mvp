import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface Announcement {
  id: string;
  source: string;
  title: string;
  date: string;
  link: string;
  timestamp: number;
  summary?: string;
}

const cleanText = (text: string) => text.replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const university = searchParams.get('uni') || 'metu';

    if (university === 'bilkent') {
        return await fetchBilkentAnnouncements();
    }

    return await fetchMetuAnnouncements();

  } catch (error) {
    console.error('Announcements API Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

async function fetchBilkentAnnouncements() {
    try {
        const res = await fetch('http://bilkentnews.bilkent.edu.tr/?cat=80', { next: { revalidate: 3600 } });
        const html = await res.text();
        const $ = cheerio.load(html);
        const announcements: Announcement[] = [];

        $('.post').each((_, el) => {
            const $el = $(el);
            const title = $el.find('.entry-title a').text().trim();
            const link = $el.find('.entry-title a').attr('href') || '';
            const dateStr = $el.find('.entry-date').text().trim();
            const summary = $el.find('.entry-summary p').first().text().trim();
            
            // Basic date parsing (Bilkent News uses formats like "December 23, 2025")
            const timestamp = dateStr ? new Date(dateStr).getTime() : Date.now();

            if (title && link) {
                announcements.push({
                    id: `BILKENT-${link}`,
                    source: 'Bilkent News',
                    title: cleanText(title),
                    link,
                    date: dateStr || 'Güncel',
                    timestamp: isNaN(timestamp) ? Date.now() : timestamp,
                    summary: cleanText(summary)
                });
            }
        });

        return NextResponse.json({ announcements });
    } catch (e) {
        console.error('Bilkent Announce Error:', e);
        return NextResponse.json({ announcements: [] });
    }
}

async function fetchMetuAnnouncements() {
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
    const oneWeekAgo = Date.now() - (14 * 24 * 60 * 60 * 1000); // 14 days for more content
    const filteredResults = results.filter(a => a.timestamp >= oneWeekAgo);

    filteredResults.sort((a, b) => b.timestamp - a.timestamp);
    return NextResponse.json({ announcements: filteredResults });
}

// Generic Parser for "Miys" Theme (Sports & Library)
const parseDrupalMiys = (html: string, baseUrl: string, sourceName: string): Announcement[] => {
  const announcements: Announcement[] = [];
  const rowRegex = /<div class="views-row">([\s\S]*?)<\/div><\/span><\/div>/g;
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
      const dateStr = dateMatch[1];
      const dateObj = new Date(dateStr);
      let summary = '';
      if (bodyMatch) summary = cleanText(bodyMatch[1].replace(/<[^>]+>/g, ' '));
      
      announcements.push({
        id: `${sourceName}-${link}`,
        source: sourceName,
        title: title,
        date: dateObj.toLocaleDateString('tr-TR'),
        link: link,
        timestamp: dateObj.getTime(),
        summary: summary
      });
    }
  }
  return announcements;
};

const parseOidb = (html: string, baseUrl: string): Announcement[] => {
  const announcements: Announcement[] = [];
  const bodyRegex = /class="field field--name-body[^>]*>([\s\S]*?)<\/div>/;
  const bodyMatch = bodyRegex.exec(html);
  if (bodyMatch) {
    const content = bodyMatch[1];
    const linkRegex = /<p[^>]*>[\s\S]*?<a href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<\/p>/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const href = match[1];
      const text = cleanText(match[2]);
      if (href.startsWith('mailto:') || text.length < 5) continue;
      const link = href.startsWith('http') ? href : `${baseUrl}${href}`;
      announcements.push({
        id: `OIDB-${link}`,
        source: 'ÖİDB',
        title: text,
        date: 'Güncel',
        link: link,
        timestamp: Date.now()
      });
    }
  }
  return announcements;
};
