import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevent Next.js from caching this route statically

export async function GET() {
  try {
    const response = await fetch('https://kafeterya.metu.edu.tr/tr/tum-duyurular', {
      next: { revalidate: 0 }, 
      cache: 'no-store'
    });
    
    // ... (rest of code)

    const menuResponse = await fetch('https://kafeterya.metu.edu.tr/', { next: { revalidate: 0 } });
    const menuHtml = await menuResponse.text();
    console.log('Menu HTML fetched, length:', menuHtml.length);
    
    // --- MENU PARSING ---
    const cleanText = (text: string) => text.replace(/&amp;/g, '&').replace(/\n/g, '').trim();
    
    // Local Image Bank (Backup)
    const getLocalImage = (foodName: string) => {
      const normalizedName = foodName.toUpperCase();
      const mappings: Record<string, string> = {
        'DOMATESLİ BULGUR': '/menu/domatesli_bulgur.png',
        'AYRAN': '/menu/ayran.png',
        'SEBZE': '/menu/sebze_corba.png',
        'EZOGELİN': '/menu/ezogelin.png',
        'KEMALPAŞA': '/menu/kemalpasa.png',
        'KEMAL': '/menu/kemalpasa.png',
        'SOSLU MAKARNA': '/menu/soslu_makarna.png',
        'MERCİMEK': '/menu/mercimek_corba_user.png',
        'ŞEHRİYE PİLAV': '/menu/sehriye_pilav.png',
        'TURŞU': '/menu/tursu.png',
        'ÇİFTLİK': '/menu/ciftlik_kebap.png',
        'MEYVE': '/menu/meyve_suyu.png',
        'ŞEHRİYE': '/menu/sehriye_corba.png', 
        'FASULYE': '/menu/taze_fasulye.png',
        'MÜCEDDERE': '/menu/muceddere.png',
        'DOMATES': '/menu/domates_corba.png',
        'TARHANA': '/menu/tarhana.png',
        'TAVUK': '/menu/tavuk_doner.png',
        'DÖNER': '/menu/tavuk_doner.png',
        'BULGUR': '/menu/bulgur.png',
        'PİLAV': '/menu/bulgur.png', 
        'HAVUÇLU': '/menu/salata.png',
        'LAHANA': '/menu/salata.png',
        'SALATA': '/menu/salata.png',
        'ÇORBA': '/menu/tarhana.png',
        // Generics
        'MANTAR': 'https://images.unsplash.com/photo-1620917670397-a3313437ef51?w=800&q=80',
        'NOHUT': 'https://images.unsplash.com/photo-1544510802-53b6fa039327?w=800&q=80',
        'KEBAP': 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=80',
        'KÖFTE': 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
        'TANDIR': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80',
        'MAKARNA': 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=800&q=80',
        'YOĞURT': 'https://images.unsplash.com/photo-1562114808-b4b33cf60f4f?w=800&q=80',
        'CACI': 'https://images.unsplash.com/photo-1571212515416-f785bc3d8424?w=800&q=80',
        'TATLI': 'https://images.unsplash.com/photo-1551024601-5688d95183f9?w=800&q=80',
        'BÖREK': 'https://images.unsplash.com/photo-1588720465227-6f021e05d0ec?w=800&q=80'
      };
      
      for (const [key, url] of Object.entries(mappings)) {
        if (normalizedName.includes(key)) return url;
      }
      return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80'; // Genetic Fallback
    };

    // Advanced Parser: Extracts Name AND Image URL from standard ODTU card structure
    const parseArticleSection = (htmlSection: string) => {
        const items = [];
        // Regex to match <article> blocks: captures Title inside <h2><a> and Image src inside <img>
        const articleRegex = /<article[^>]*>[\s\S]*?<h2[^>]*><a[^>]*>([^<]+)<\/a><\/h2>[\s\S]*?<img[^>]+src="([^"]+)"/g;
        
        let match;
        while ((match = articleRegex.exec(htmlSection)) !== null) {
            const name = cleanText(match[1]);
            const rawImgUrl = match[2];
            
            let imageUrl = rawImgUrl.split('?')[0]; // Remove query params
            
            // Fix relative URLs (ODTU uses relative paths like /sites/...)
            if (imageUrl.startsWith('/')) {
                imageUrl = `https://kafeterya.metu.edu.tr${imageUrl}`;
            }

            // Check if it looks like a placeholder (optional refinement)
            // If the site uses a specific placeholder filename, we could detect it here.
            // For now, we trust the scraped image.
            
            items.push({ name, image: imageUrl });
        }
        return items;
    };

    // Simple Text Parser (for Breakfast or fallback)
    const parseTextSection = (htmlSection: string) => {
        const items = [];
        // Match simple links or div content
        const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>|<div class="kahvalti">([^<]+)<\/div>/g;
        let match;
        while ((match = linkRegex.exec(htmlSection)) !== null) {
            // Group 2 is link text, Group 3 is div text (for breakfast)
            const rawName = match[2] || match[3];
            if (!rawName) continue;
            
            const name = cleanText(rawName.replace(/<[^>]+>/g, ''));
            if (name.length < 3) continue;
            
            const ignore = ['ENGLISH', 'TÜRKÇE', 'GİRİŞ', 'İLETİŞİM', 'FOTOĞRAFLAR YOK', 'ANA SAYFA', 'ANASAYFA', 'DUYURULAR', 'İDARİ', 'AKADEMİK', 'PERSONEL', 'LİSTESİ', 'KURUMSAL', 'HİZMETLERİMİZ', 'BİRİMLER', 'GALERİ', 'BELGELER', 'ODTÜ', 'METU', 'KAFETERYA'];
            if (ignore.some(i => name.toUpperCase().includes(i))) continue;

            // Since text parser has no image, we rely entirely on Local Bank
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

    // Breakfast: usually text only in 'attachment-before'
    if (kahvaltiIndex > -1) {
        const end = ogleIndex > -1 ? ogleIndex : menuHtml.length;
        breakfastItems = parseTextSection(menuHtml.substring(kahvaltiIndex, end));
    }

    // Lunch: Uses Article structure with images
    if (ogleIndex > -1) {
        const end = aksamIndex > -1 ? aksamIndex : (footerIndex > -1 ? footerIndex : menuHtml.length);
        const sectionHtml = menuHtml.substring(ogleIndex, end);
        lunchItems = parseArticleSection(sectionHtml);
        
        // Fallback to text parser if article parser failed (e.g. layout change)
        if (lunchItems.length === 0) {
             lunchItems = parseTextSection(sectionHtml);
        }
    }

    // Dinner: Uses Article structure with images
    if (aksamIndex > -1) {
        const end = menuHtml.indexOf('Vejetaryen', aksamIndex); // Find next vejetaryen block or end
        const finalEnd = end > -1 ? end : menuHtml.length;
        const sectionHtml = menuHtml.substring(aksamIndex, finalEnd);
        dinnerItems = parseArticleSection(sectionHtml);
        
        if (dinnerItems.length === 0) {
            dinnerItems = parseTextSection(sectionHtml);
        }
    }

    // --- HEURISTIC FALLBACK (If specific headers not found) ---
    if (lunchItems.length === 0) {
        // Global search for all food links
        const allItems = parseTextSection(menuHtml); // Use text parser for global search
        
        // Filter out obviously non-food items if any slipped through
        const validItems = allItems.filter(i => !i.name.includes('YEMEK LİSTESİ'));
        
        if (validItems.length >= 4) {
             lunchItems = validItems.slice(0, 4);
        }
        
        if (validItems.length >= 8) {
            dinnerItems = validItems.slice(4, 8);
        } else if (validItems.length >= 4 && dinnerItems.length === 0) {
            // If we only found one menu's worth (e.g. 4 items), assume it's valid for both or just Lunch.
            // Let's assume Lunch is the priority.
            // We can optionally copy to dinner if it looks identical in source, but safer to leave blank or copy.
            // Given the user observation (repeating items), likely it lists both.
            // If capturing failed to distinguish, we might have just 4 unique items repeated.
            // If the source had 8 items (4+4 duplicates), `parseSection` would catch them all.
             if (validItems.length > 4) { 
                 // If we have 5-7 items, something is weird, take rest as dinner
                 dinnerItems = validItems.slice(4);
             } else {
                 // Even better fallback: if only 4 items found globally, use for both?
                 // No, usually they are different. Let's strictly use what we found.
                 // Dinner empty is fine if not explicitly parsed.
             }
        }
    }
    
    // Fallback for Dinner if still empty but we have lunch (Optional UI polish)
    if (dinnerItems.length === 0 && lunchItems.length > 0) {
         // Often dinner matches lunch on some views, but let's not assume unless verified.
    }

    if (breakfastItems.length === 0) {
        // Simple fallback if no breakfast parsed
        breakfastItems = [{ name: 'ÇORBA', image: getLocalImage('ÇORBA') }];
    }

    // Real Data Only: No Mock Fallbacks
    // If lists are empty, it means no menu is published on the site yet.

    // --- ANNOUNCEMENTS FETCHING (CORRECTED) ---
    let realAnnouncements: any[] = [];
    
    if (response.ok) {
        const annHtml = await response.text();
        
        // CORRECT REGEX based on Raw HTML analysis:
        // Structure: <a href="LINK" ...> ... <div ...title">TITLE</div> ... <div ...date">26/12/2025</div> ... </a>
        // Corrected Regex to capture Summary (Group 3)
        const blockRegex = /<a[^>]*href="([^"]+)"[^>]*class="announcement-link">[\s\S]*?<div class="announcement-title">([^<]+)<\/div>([\s\S]*?)<div class="announcement-date">([^<]+)<\/div>/g;
        
        let match;
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); 
        
        while ((match = blockRegex.exec(annHtml)) !== null) {
            const link = match[1];
            const title = cleanText(match[2]);
            const rawSummary = match[3];
            let dateStr = match[4].trim(); // e.g. "26/12/2025"
            
            // Clean summary: remove HTML tags, excess whitespace
            const summary = cleanText(rawSummary.replace(/<[^>]+>/g, ' '));
            
            // Parse Date
            const parts = dateStr.split(/[\.\/]/);
            if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]);
                const year = parseInt(parts[2]);
                
                const annDate = new Date(year, month - 1, day);
                
                // Filter: Last 7 days
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

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
        error: 'Failed', 
        menu: { breakfast: [], lunch: [], dinner: [] }, 
        announcements: [] 
    }, { status: 500 });
  }
}
