import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Gemini
// Ensure you have GEMINI_API_KEY in your .env.local file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Set revalidation to 0 since we handle caching manually via DB/Logic, 
// but technically we could cache this response for a while too.
export const revalidate = 0;

const FALLBACK_POLLS: Record<string, { question: string, options: string[] }[]> = {
    metu: [
        { question: "ODTÜ'de kütüphane çalışma saatleri (7/24) yeterli mi?", options: ["Evet", "Hayır, yetersiz", "Haftasonu artırılmalı"] },
        { question: "Yemekhane menüsünde vegan seçenekler artırılmalı mı?", options: ["Kesinlikle", "Mevcut durum iyi", "Gereksiz"] },
        { question: "Ring seferlerinin sıklığı ve güzergahları verimli mi?", options: ["Verimli", "Yetersiz", "Güzergah değişmeli"] },
        { question: "Kampüs kedileri için yapılan 'Kedi Evi' projesini nasıl buluyorsunuz?", options: ["Harika", "Daha iyi olabilir", "Gereksiz"] },
        { question: "Bahar şenliği bütçesi topluluklara mı sanatçılara mı ayrılmalı?", options: ["Topluluklara", "Sanatçılara", "Eşit olmalı"] }
    ],
    bilkent: [
        { question: "Bilkent kütüphanesi sınav döneminde 7/24 açık kalmalı mı?", options: ["Evet, kesinlikle", "Gerek yok", "Sadece A binası"] },
        { question: "Millet Berberi'ndeki sıra bekleme süreleri nasıl?", options: ["Çok uzun", "Normal", "Daha hızlı olmalı"] },
        { question: "Ring servislerinin güzergahı (Merkez-Doğu) yeterli mi?", options: ["Yeterli", "Doğu kampüs artırılmalı", "Ek sefer gelmeli"] },
        { question: "Bilkent Odeon konserlerini ne sıklıkla takip ediyorsunuz?", options: ["Her zaman", "Ara sıra", "Hiç gitmedim"] },
        { question: "Moodle üzerindeki ödev teslim süreçleri verimli mi?", options: ["Evet", "Hayır, karışık", "Geliştirilmeli"] }
    ]
};

// Helper to get ISO Week String (YYYY-WW)
function getWeekId() {
    const d = new Date();
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uni = searchParams.get('uni') || 'metu';
  const uniFallbacks = FALLBACK_POLLS[uni === 'bilkent' ? 'bilkent' : 'metu'];

  const getRandomFallback = () => uniFallbacks[Math.floor(Math.random() * uniFallbacks.length)];

  // 1. Setup Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use Service Role Key if available for Write permissions (creating weekly poll), otherwise Anon
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
     console.error('Missing Supabase Keys, falling back to random.');
     return NextResponse.json(getRandomFallback());
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Helper Helper: Deterministic Fallback based on Week ID
  const getDeterministicFallback = (weekId: string) => {
      // Simple hash of weekId string
      let hash = 0;
      for (let i = 0; i < weekId.length; i++) {
        hash = weekId.charCodeAt(i) + ((hash << 5) - hash);
      }
      // Ensure positive index
      const index = Math.abs(hash) % uniFallbacks.length;
      console.log(`Using Deterministic Fallback for ${weekId} (${uni}) -> Index ${index}`);
      return uniFallbacks[index];
  };

  try {
    const currentWeekId = getWeekId();

    // 2. Check DB for existing poll
    const { data: existingPoll, error: dbError } = await supabase
        .from('weekly_polls')
        .select('*')
        .eq('week_id', currentWeekId)
        .single();

    // CRITICAL FIX: If table doesn't exist (code 42P01), force deterministic fallback
    if (dbError && dbError.code === '42P01') { 
        console.warn('weekly_polls table missing. Returning deterministic specific poll for this week.');
        return NextResponse.json(getDeterministicFallback(currentWeekId));
    }

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 is "Row not found", other errors are actual problems
        console.error('Poll DB Error:', dbError);
    }

    if (existingPoll && !dbError) {
        // Return cached poll
        return NextResponse.json({
            question: existingPoll.question,
            options: existingPoll.options
        });
    }

    // 3. Not Found -> Generate New with Gemini
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(getDeterministicFallback(currentWeekId));
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const uniName = uni === 'bilkent' ? 'Bilkent Üniversitesi' : 'ODTÜ (Orta Doğu Teknik Üniversitesi)';
    const uniJargon = uni === 'bilkent' ? 'İhsan Doğramacı, Merkez, Doğu, Odeon, Mayfest, Moodle, Stars, Ring' : 'Hocam, Devrim, Ring, Çatı, Yalıncak, A1 Kapısı, ODTÜClass';

    const prompt = `
      Sen ${uniName} kampüs gazetesinin yapay zeka editörüsün.
      
      GÖREV:
      1. Şu anki tarihi analiz et: ${new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
      2. Bu tarihte/haftada ${uniName} kampüsünde akademik veya sosyal olarak ne olduğunu TAHMİN ET (Örn: Final haftası mı? Tatil mi? Kayıt dönemi mi?).
      3. ${uniName} Kültürü ile bu gündemi birleştirerek HAFTALIK bir anket sorusu oluştur.
      
      KRİTİK KURALLAR:
      - Soru metni içinde kesinlikle spesifik bir GÜN veya TARİH (Örn: "5 Ocak", "Bugün Pazartesi") BELİRTME. 
      - Soru, tüm hafta boyunca yayında kalacağı için zamandan bağımsız ama haftalık gündeme uygun olmalı.
      - ${uniName} jargonunu (${uniJargon}) doğal bir şekilde kullan.
      
      Çıktı Formatı (JSON):
      {
        "question": "Haftalık gündeme uygun, tarih ibaresi içermeyen soru metni",
        "options": ["Seçenek 1", "Seçenek 2", "Seçenek 3"]
      }
      
      Sadece saf JSON döndür.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up markdown
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const pollData = JSON.parse(cleanedText);

    // 4. Save to DB for this week
    const { error: insertError } = await supabase
        .from('weekly_polls')
        .insert({
            week_id: currentWeekId,
            question: pollData.question,
            options: pollData.options 
        });

    if (insertError) {
        console.error('Failed to cache weekly poll (might be duplicate or missing table):', insertError);
        // If insert fails (table missing), we return the GENERATED data this time, 
        // BUT next time it will regenerate again. 
        // To be safer for "missing table" consistency, we can actually return deterministic here too if needed,
        // but let's assume if generating works we use it. 
        // Actually, if table missing, insertError code is 42P01.
        if (insertError.code === '42P01') {
             return NextResponse.json(getDeterministicFallback(currentWeekId));
        }
    }

    return NextResponse.json(pollData);

  } catch (error) {
    console.error('Poll Logic Error:', error);
    // Even in total failure, use specific fallback for week
    return NextResponse.json(getDeterministicFallback(getWeekId()));
  }
}
