import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Gemini
// Ensure you have GEMINI_API_KEY in your .env.local file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Set revalidation to 0 since we handle caching manually via DB/Logic, 
// but technically we could cache this response for a while too.
export const revalidate = 0;

const FALLBACK_POLLS = [
    { question: "ODTÜ'de kütüphane çalışma saatleri (7/24) yeterli mi?", options: ["Evet", "Hayır, yetersiz", "Haftasonu artırılmalı"] },
    { question: "Yemekhane menüsünde vegan seçenekler artırılmalı mı?", options: ["Kesinlikle", "Mevcut durum iyi", "Gereksiz"] },
    { question: "Ring seferlerinin sıklığı ve güzergahları verimli mi?", options: ["Verimli", "Yetersiz", "Güzergah değişmeli"] },
    { question: "Kampüs kedileri için yapılan 'Kedi Evi' projesini nasıl buluyorsunuz?", options: ["Harika", "Daha iyi olabilir", "Gereksiz"] },
    { question: "Bahar şenliği bütçesi topluluklara mı sanatçılara mı ayrılmalı?", options: ["Topluluklara", "Sanatçılara", "Eşit olmalı"] },
    { question: "Online ders seçeneği kalıcı hale gelmeli mi?", options: ["Evet", "Hibrit olmalı", "Hayır, yüz yüze iyi"] },
    { question: "Kampüs içi bisiklet yolları yeterli mi?", options: ["Evet", "Hayır, artırılmalı", "Bakım gerekli"] },
    { question: "Devrim stadyumundaki etkinliklerin sesi çevreye rahatsızlık veriyor mu?", options: ["Evet, çok fazla", "Hayır, normal", "Sadece sınav dönemleri"] },
    { question: "Yurt internet hızından memnun musunuz?", options: ["Memnunum", "Yavaş", "Sürekli kesiliyor"] },
    { question: "A1 kapısındaki trafik yoğunluğu için çözüm öneriniz nedir?", options: ["Yeni giriş açılmalı", "Ring sayısı artmalı", "Araç girişi kısıtlanmalı"] }
];

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

export async function GET() {
  const getRandomFallback = () => FALLBACK_POLLS[Math.floor(Math.random() * FALLBACK_POLLS.length)];

  // 1. Setup Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use Service Role Key if available for Write permissions (creating weekly poll), otherwise Anon
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
     console.error('Missing Supabase Keys, falling back to random.');
     return NextResponse.json(getRandomFallback());
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const currentWeekId = getWeekId();

    // 2. Check DB for existing poll
    const { data: existingPoll, error: dbError } = await supabase
        .from('weekly_polls')
        .select('*')
        .eq('week_id', currentWeekId)
        .single();

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 is "Row not found", other errors are actual problems
        console.error('Poll DB Error (Check if table weekly_polls exists):', dbError);
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
        return NextResponse.json(getRandomFallback());
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Sen ODTÜ (Orta Doğu Teknik Üniversitesi) kampüs gazetesinin yapay zeka editörüsün.
      
      GÖREV:
      1. Şu anki tarihi analiz et: ${new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
      2. Bu tarihte/haftada ODTÜ'de akademik veya sosyal olarak ne olduğunu TAHMİN ET (Örn: Final haftası mı? Tatil mi? Kayıt dönemi mi?).
      3. ODTÜ Kültürü ile bu gündemi birleştirerek HAFTALIK bir anket sorusu oluştur.
      
      KRİTİK KURALLAR:
      - Soru metni içinde kesinlikle spesifik bir GÜN veya TARİH (Örn: "5 Ocak", "Bugün Pazartesi") BELİRTME. 
      - Soru, tüm hafta boyunca yayında kalacağı için zamandan bağımsız ama haftalık gündeme uygun olmalı.
      - ODTÜ jargonunu (Hocam, Devrim, Ring, Çatı vb.) doğal bir şekilde kullan.
      
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
    // Note: If multiple requests hit at the exact same time, we might get a race condition/unique constraint error.
    // In that case, we can just return the generated one, or fetch again.
    const { error: insertError } = await supabase
        .from('weekly_polls')
        .insert({
            week_id: currentWeekId,
            question: pollData.question,
            options: pollData.options // Supabase handles JSON array automatically if column is jsonb/json
        });

    if (insertError) {
        console.error('Failed to cache weekly poll:', insertError);
        // It might be a duplicate key error if another request beat us to it.
        // We can just proceed to return the data we generated.
    }

    return NextResponse.json(pollData);

  } catch (error) {
    console.error('Poll Logic Error:', error);
    return NextResponse.json(getRandomFallback());
  }
}
