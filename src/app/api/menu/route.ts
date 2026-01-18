import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const university = searchParams.get('uni') || 'metu';

    if (university === 'bilkent') {
        return await fetchBilkentMenu();
    }

    // Default: METU
    return await fetchMetuMenu();

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
        error: 'Failed', 
        menu: { breakfast: [], lunch: [], dinner: [] }, 
        announcements: [] 
    }, { status: 500 });
  }
}

async function fetchBilkentMenu() {
    try {
        const res = await fetch('https://bais.bilkent.edu.tr/menu/', { 
            next: { revalidate: 3600 },
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = await res.text();
        const $ = cheerio.load(html);
        
        // Find today's tab pane
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        let $todayPane = $(`#day-${todayStr}-tab-pane`);
        
        // Fallback to active tab if today's date not found (e.g. weekend/holiday)
        if ($todayPane.length === 0) {
            $todayPane = $('.tab-pane.active');
        }

        const breakfast: any[] = [];
        const lunch: any[] = [];
        const dinner: any[] = [];

        // Bilkent usually has 3 columns: Fixed Lunch, Fixed Dinner, Alternative
        const columns = $todayPane.find('.col-lg-4');
        
        const parseColumn = (colIndex: number) => {
            const items: any[] = [];
            const $col = columns.eq(colIndex);
            $col.find('.meal-item').each((_, el) => {
                const name = $(el).contents().first().text().trim();
                if (name && name.length > 1) {
                    items.push({
                        name: name,
                        image: getLocalImage(name)
                    });
                }
            });
            return items;
        };

        if (columns.length >= 1) lunch.push(...parseColumn(0));
        if (columns.length >= 2) dinner.push(...parseColumn(1));
        
        // Announcements for Bilkent Cafe (placeholder or scrape if found)
        const announcements: any[] = [];

        return NextResponse.json({
            date: new Date().toLocaleDateString('tr-TR'),
            menu: { breakfast: [], lunch, dinner },
            announcements
        });
    } catch (e) {
        console.error('Bilkent Menu Scrape Error:', e);
        throw e;
    }
}

async function fetchMetuMenu() {
    const response = await fetch('https://kafeterya.metu.edu.tr/tr/tum-duyurular', {
      next: { revalidate: 3600 }, 
      cache: 'no-store'
    });
    
    const menuResponse = await fetch('https://kafeterya.metu.edu.tr/', { next: { revalidate: 3600 } });
    const menuHtml = await menuResponse.text();
    
    // --- MENU PARSING ---
    const cleanText = (text: string) => text.replace(/&amp;/g, '&').replace(/\n/g, '').trim();

    // Advanced Parser: Extracts Name AND Image URL from standard ODTU card structure
    const parseArticleSection = (htmlSection: string) => {
        const items = [];
        const articleRegex = /<article[^>]*>[\s\S]*?<h2[^>]*><a[^>]*>([^<]+)<\/a><\/h2>[\s\S]*?<img[^>]+src="([^"]+)"/g;
        
        let match;
        while ((match = articleRegex.exec(htmlSection)) !== null) {
            const name = cleanText(match[1]);
            const rawImgUrl = match[2];
            let imageUrl = rawImgUrl.split('?')[0];
            if (imageUrl.startsWith('/')) imageUrl = `https://kafeterya.metu.edu.tr${imageUrl}`;
            items.push({ name, image: imageUrl });
        }
        return items;
    };

    const parseTextSection = (htmlSection: string) => {
        const items = [];
        const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>|<div class="kahvalti">([^<]+)<\/div>/g;
        let match;
        while ((match = linkRegex.exec(htmlSection)) !== null) {
            const rawName = match[2] || match[3];
            if (!rawName) continue;
            const name = cleanText(rawName.replace(/<[^>]+>/g, ''));
            if (name.length < 3) continue;
            const ignore = ['ENGLISH', 'TÜRKÇE', 'GİRİŞ', 'İLETİŞİM', 'FOTOĞRAFLAR YOK', 'ANA SAYFA', 'ANASAYFA', 'DUYURULAR', 'İDARİ', 'AKADEMİK', 'PERSONEL', 'LİSTESİ', 'KURUMSAL', 'HİZMETLERİMİZ', 'BİRİMLER', 'GALERİ', 'BELGELER', 'ODTÜ', 'METU', 'KAFETERYA'];
            if (ignore.some(i => name.toUpperCase().includes(i))) continue;
            items.push({ name, image: getLocalImage(name) });
        }
        return items;
    };

    const kahvaltiIndex = menuHtml.indexOf('Kahvaltı');
    const ogleIndex = menuHtml.indexOf('Öğle Yemeği');
    const aksamIndex = menuHtml.indexOf('Akşam Yemeği');
    const footerIndex = menuHtml.indexOf('Vejetaryen') || menuHtml.length;

    let breakfastItems: any[] = [];
    let lunchItems: any[] = [];
    let dinnerItems: any[] = [];

    if (kahvaltiIndex > -1) {
        const end = ogleIndex > -1 ? ogleIndex : menuHtml.length;
        breakfastItems = parseTextSection(menuHtml.substring(kahvaltiIndex, end));
    }

    if (ogleIndex > -1) {
        const end = aksamIndex > -1 ? aksamIndex : (footerIndex > -1 ? footerIndex : menuHtml.length);
        const sectionHtml = menuHtml.substring(ogleIndex, end);
        lunchItems = parseArticleSection(sectionHtml);
        if (lunchItems.length === 0) lunchItems = parseTextSection(sectionHtml);
    }

    if (aksamIndex > -1) {
        const end = menuHtml.indexOf('Vejetaryen', aksamIndex);
        const finalEnd = end > -1 ? end : menuHtml.length;
        const sectionHtml = menuHtml.substring(aksamIndex, finalEnd);
        dinnerItems = parseArticleSection(sectionHtml);
        if (dinnerItems.length === 0) dinnerItems = parseTextSection(sectionHtml);
    }

    let realAnnouncements: any[] = [];
    if (response.ok) {
        const annHtml = await response.text();
        const blockRegex = /<a[^>]*href="([^"]+)"[^>]*class="announcement-link">[\s\S]*?<div class="announcement-title">([^<]+)<\/div>([\s\S]*?)<div class="announcement-date">([^<]+)<\/div>/g;
        let match;
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); 
        while ((match = blockRegex.exec(annHtml)) !== null) {
            const link = match[1];
            const title = cleanText(match[2]);
            const rawSummary = match[3];
            let dateStr = match[4].trim();
            const summary = cleanText(rawSummary.replace(/<[^>]+>/g, ' '));
            const parts = dateStr.split(/[\.\/]/);
            if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]);
                const year = parseInt(parts[2]);
                const annDate = new Date(year, month - 1, day);
                if (annDate >= oneWeekAgo) {
                     realAnnouncements.push({
                        title: title,
                        date: dateStr,
                        link: link.startsWith('http') ? link : `https://kafeterya.metu.edu.tr${link}`,
                        summary: summary && summary.length > 5 ? summary : 'Yemekhane duyurusu için tıklayınız.'
                    });
                }
            }
        }
    }

    return NextResponse.json({ 
      date: new Date().toLocaleDateString('tr-TR'),
      menu: { breakfast: breakfastItems, lunch: lunchItems, dinner: dinnerItems },
      announcements: realAnnouncements
    });
}

// Local Image Bank (Shared)
const getLocalImage = (foodName: string) => {
    const normalizedName = foodName.toUpperCase();
    const mappings: Record<string, string> = {
      'DOMATESLİ BULGUR': '/menu/domatesli_bulgur.png',
      'AYRAN': '/menu/ayran.png',
      'EZOGELİN': '/menu/ezogelin.png',
      'DOMATES': '/menu/domates_corba.png',
      'MERCİMEK': '/menu/mercimek_corba_user.png',
      'SOSLU MAKARNA': '/menu/soslu_makarna.png',
      'TAVUK': '/menu/tavuk_doner.png',
      'DÖNER': '/menu/tavuk_doner.png',
      'PİLAV': '/menu/bulgur.png', 
      'SALATA': '/menu/salata.png',
      'MAKARNA': 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=800&q=80',
      'KÖFTE': 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
      'TATLI': 'https://images.unsplash.com/photo-1551024601-5688d95183f9?w=800&q=80',
      'TABİLDOT': 'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=800&q=80',
      'SEÇMELİ': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
      'FİKS': 'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=800&q=80',
      'SCHNITZEL': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=80',
      'MANTI': 'https://images.unsplash.com/photo-1616614438313-1cf02a3a5a4c?w=800&q=80'
    };
    for (const [key, url] of Object.entries(mappings)) {
      if (normalizedName.includes(key)) return url;
    }
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
};
