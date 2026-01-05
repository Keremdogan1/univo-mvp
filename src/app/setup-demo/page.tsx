'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SetupDemoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleSetup = async () => {
    if (!user) {
        addLog("Lütfen önce giriş yapın.");
        return;
    }

    setLoading(true);
    addLog("Demo kurulumu başlıyor...");

    try {
        // 1. Create Community
        const { data: community, error: commError } = await supabase.from('communities').insert({
              name: 'UniVo Sanat Topluluğu',
              description: 'Kampüsün en renkli sanat topluluğu.',
              logo_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071&auto=format&fit=crop',
              admin_id: user.id
        }).select().single();

        if (commError) {
            addLog("Topluluk oluşturulamadı: " + commError.message);
            addLog("HATA: Lütfen SQL Editör'de şu komutu çalıştırıp tekrar deneyin:");
            addLog(`CREATE POLICY "Users can create communities" ON public.communities FOR INSERT WITH CHECK (true);`);
            setLoading(false);
            return;
        }

        addLog(`Topluluk oluşturuldu: ${community.name}`);

        // 2. Create Events
        const pastEvents = [
            { title: 'Yaza Merhaba Sergisi', date: '2025-06-15', location: 'Sanat Galerisi' },
            { title: 'Dijital Sanat Atölyesi', date: '2025-11-20', location: 'Lab 3' }
        ];

        for (const pEvent of pastEvents) {
            await supabase.from('events').insert({
                title: pEvent.title,
                category: 'workshop',
                description: 'Geçmiş etkinlik açıklaması...',
                excerpt: 'Kısa açıklama',
                date: pEvent.date, 
                time: '14:00',
                location: pEvent.location,
                community_id: community.id
            });
        }
        addLog("Geçmiş etkinlikler eklendi.");
        
        // 3. Create Notification for User
        await supabase.from('notifications').insert({
            user_id: user.id,
            content: 'Yönetici olarak atandınız. Panelinize hoş geldiniz!',
            read: false
        });

        addLog("Kurulum tamamlandı! Yönlendiriliyorsunuz...");
        setTimeout(() => router.push('/dashboard'), 2000);

    } catch (err: any) {
        addLog("Beklenmeyen hata: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <h1 className="text-3xl font-black font-serif mb-6">Demo Kurulumu</h1>
      <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="mb-4 text-neutral-600">
            Bu işlem, mevcut hesabınızı "UniVo Sanat Topluluğu" yöneticisi yapacak ve geçmiş etkinlik verilerini yükleyecektir.
        </p>
        
        <div className="bg-neutral-100 p-4 mb-4 rounded text-sm font-mono h-40 overflow-y-auto border border-neutral-200">
            {logs.length === 0 ? <span className="text-neutral-400">Günlükler burada görünecek...</span> : logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>

        <button 
            onClick={handleSetup}
            disabled={loading}
            className="w-full bg-[#C8102E] text-white font-bold uppercase py-3 hover:bg-[#a60d26] transition-colors disabled:opacity-50"
        >
            {loading ? 'Kuruluyor...' : 'Demoyu Kur ve Başla'}
        </button>
      </div>
    </div>
  );
}
