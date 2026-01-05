import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
// Ensure you have GEMINI_API_KEY in your .env.local file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Set revalidation to 1 week (604800 seconds)
export const revalidate = 604800;

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

export async function GET() {
  // Random fallback selector
  const getRandomFallback = () => FALLBACK_POLLS[Math.floor(Math.random() * FALLBACK_POLLS.length)];

  try {
    if (!process.env.GEMINI_API_KEY) {
        // Fallback if no key is present (Development / No Key mode)
        // We use a diverse bank of questions so it still feels dynamic
        return NextResponse.json(getRandomFallback());
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Sen ODTÜ (Orta Doğu Teknik Üniversitesi) kampüs gazetesinin yapay zeka editörüsün.
      
      GÖREV:
      1. Şu anki tarihi analiz et: ${new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
      2. Bu tarihte ODTÜ'de akademik veya sosyal olarak ne olduğunu TAHMİN ET / ARAŞTIR (Örn: Vize haftası mı? Bahar şenliği yaklaşıyor mu? Kayıt haftası mı? Kar tatili riski var mı?).
      3. ODTÜ Kültürü (Devrim, "Hocam", Ringler, Çatı, Kütüphane sabahlamaları, Kediler) ile bu gündemi birleştir.
      
      Bu analize dayanarak, öğrencilerin BUGÜN en çok konuşacağı tek bir anket sorusu oluştur.
      
      Çıktı Formatı (JSON):
      {
        "question": "Gündem ve tarih odaklı soru metni",
        "options": ["Seçenek 1", "Seçenek 2", "Seçenek 3"]
      }
      
      Sadece saf JSON döndür. Markdown yok.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up markdown if present (Gemini sometimes wraps in ```json ... ```)
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const pollData = JSON.parse(cleanedText);

    return NextResponse.json(pollData);

  } catch (error) {
    console.error('Gemini API Error:', error);
    // Fallback on error
    return NextResponse.json(getRandomFallback());
  }
}
