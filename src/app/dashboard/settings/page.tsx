'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ADMIN_EMAIL, ADMIN_NAME } from '@/lib/constants';

export default function SettingsPage() {
    const { user, profile } = useAuth();
    const router = useRouter(); 
    const [community, setCommunity] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const isAdmin = user?.email === ADMIN_EMAIL || profile?.full_name === ADMIN_NAME;

    // Form inputs state (optional, can use FormData, but state is easier for validation if needed)
    // We'll use FormData in handleSubmit for simplicity with defaultValues

    const fetchCommunity = async () => {
        if (!user) return;
        setLoading(true);
        const { data } = await supabase.from('communities').select('*').eq('admin_id', user.id).limit(1);
        if (data && data.length > 0) setCommunity(data[0]);
        setLoading(false);
    };

    useEffect(() => {
        fetchCommunity();
    }, [user]);

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!community) return;
        setSaving(true);
        
        const formData = new FormData(e.currentTarget);
        const updates = {
            name: formData.get('name') as string,
            category: formData.get('category') as string,
            description: formData.get('description') as string,
            logo_url: formData.get('logo_url') as string,
        };

        try {
            const { error } = await supabase
                .from('communities')
                .update(updates)
                .eq('id', community.id);

            if (error) throw error;
            alert("Değişiklikler başarıyla kaydedildi!");
            router.refresh(); 
        } catch (error: any) {
            console.error("Update error:", error);
            alert("Güncelleme başarısız: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Yükleniyor...</div>;

    if (!community) {
        return (
            <div className="max-w-2xl mx-auto py-12">
                <h1 className="text-3xl font-black font-serif mb-8 text-center">Hoş Geldiniz</h1>
                
                <div className="grid gap-8">
                    {/* Manual Creation */}
                    <div className="bg-white p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                             🚀 {isAdmin ? 'Yeni Topluluk Oluştur' : 'Erişim Kısıtlı'}
                        </h3>
                        {isAdmin ? (
                            <>
                                <p className="text-neutral-600 mb-6 text-sm">
                                    Kendi topluluğunuzu sıfırdan kurun ve yönetmeye başlayın.
                                </p>
                                <CreateCommunityForm userId={user?.id || ''} onComplete={(data) => setCommunity(data)} />
                            </>
                        ) : (
                            <p className="text-neutral-600 text-sm italic">
                                Sadece sistem yöneticisi topluluk oluşturabilir.
                            </p>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-neutral-300"></div>
                        <span className="flex-shrink mx-4 text-neutral-400 text-sm font-bold uppercase">veya</span>
                        <div className="flex-grow border-t border-neutral-300"></div>
                    </div>

                    {/* Demo Button */}
                    {isAdmin && (
                        <div className="bg-neutral-50 p-6 border-2 border-dashed border-neutral-300 rounded-lg text-center opacity-75 hover:opacity-100 transition-opacity">
                             <h4 className="font-bold text-neutral-500 mb-2">Hızlı Başlangıç (Geliştirici)</h4>
                             <p className="text-xs text-neutral-400 mb-4">Örnek verilerle otomatik kurulum yap.</p>
                             <InitializeDemoButton userId={user?.id || ''} onComplete={(data) => setCommunity(data)} />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-black font-serif mb-8">Topluluk Ayarları</h1>
            
            <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <form className="space-y-6" onSubmit={handleUpdate}>
                    <div>
                        <label className="block font-bold text-sm mb-2">Topluluk Adı</label>
                        <input 
                            name="name"
                            type="text" 
                            defaultValue={community?.name}
                            className="w-full border-2 border-neutral-300 p-3 font-serif focus:border-black outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block font-bold text-sm mb-2">Kategori</label>
                        <select 
                            name="category"
                            defaultValue={community?.category || 'Sanat'}
                            className="w-full border-2 border-neutral-300 p-3 font-serif focus:border-black outline-none transition-colors appearance-none bg-white"
                        >
                            <option value="Sanat">Sanat</option>
                            <option value="Spor">Spor</option>
                            <option value="Teknoloji">Teknoloji</option>
                            <option value="Girişimcilik">Girişimcilik</option>
                            <option value="Sosyal">Sosyal</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-bold text-sm mb-2">Açıklama</label>
                        <textarea 
                            name="description"
                            rows={4}
                            defaultValue={community?.description}
                            className="w-full border-2 border-neutral-300 p-3 font-serif focus:border-black outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block font-bold text-sm mb-2">Logo URL</label>
                        <input 
                            name="logo_url"
                            type="text" 
                            defaultValue={community?.logo_url}
                            className="w-full border-2 border-neutral-300 p-3 font-serif focus:border-black outline-none transition-colors"
                        />
                    </div>

                    <div className="pt-4 border-t border-neutral-200">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="bg-[#C8102E] text-white px-6 py-3 font-bold uppercase hover:bg-[#a60d26] transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Demo Data Section */}
            <div className="mt-8 bg-neutral-100 p-6 border-2 border-dashed border-neutral-300">
                <h3 className="text-lg font-bold font-serif mb-2">Demo Verileri</h3>
                <p className="text-sm text-neutral-600 mb-4">
                    Topluluğunuz boş görünüyorsa, aşağıdan örnek verileri tekrar yükleyebilirsiniz.
                </p>
                <DemoDataLoader communityId={community?.id} />
            </div>
        </div>
    );
}

function CreateCommunityForm({ userId, onComplete }: { userId: string, onComplete: (data: any) => void }) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            const { data, error } = await supabase.from('communities').insert({
                name: formData.get('name') as string,
                category: formData.get('category') as string,
                description: formData.get('description') as string,
                admin_id: userId
            }).select();

            if (error) throw error;
            if (data) {
                alert("Topluluk başarıyla oluşturuldu!");
                onComplete(data[0]);
            }
        } catch (e: any) {
             alert("Hata: " + e.message + "\nLütfen 'seed_fake_members.sql' dosyasını çalıştırarak veritabanı şemasını güncellediğinizden emin olun (category sütunu için).");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block font-bold text-sm mb-1">Topluluk Adı</label>
                <input required name="name" type="text" placeholder="Örn: Dağcılık Kulübü" className="w-full border-2 border-neutral-200 p-2 focus:border-black outline-none transition-colors" />
            </div>
             <div>
                <label className="block font-bold text-sm mb-1">Kategori</label>
                <select name="category" className="w-full border-2 border-neutral-200 p-2 focus:border-black outline-none bg-white transition-colors">
                    <option value="Sanat">Sanat</option>
                    <option value="Spor">Spor</option>
                    <option value="Teknoloji">Teknoloji</option>
                    <option value="Girişimcilik">Girişimcilik</option>
                    <option value="Sosyal">Sosyal</option>
                </select>
            </div>
             <div>
                <label className="block font-bold text-sm mb-1">Kısa Açıklama</label>
                <textarea required name="description" rows={2} placeholder="Topluluğunuzu anlatan kısa bir yazı..." className="w-full border-2 border-neutral-200 p-2 focus:border-black outline-none transition-colors" />
            </div>
            <button disabled={loading} type="submit" className="w-full bg-[#C8102E] text-white font-bold uppercase py-3 hover:bg-[#a60d26] transition-colors shadow-lg">
                {loading ? 'Oluşturuluyor...' : 'Topluluğu Kur'}
            </button>
        </form>
    );
}

function InitializeDemoButton({ userId, onComplete }: { userId: string, onComplete: (data: any) => void }) {
    const [loading, setLoading] = useState(false);

    const handleInit = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        console.log("Starting initialization for user:", userId);
        try {
            // 1. Create Community
            console.log("Creating community...");
            const { data, error } = await supabase.from('communities').insert({
                name: 'UniVo Sanat Topluluğu',
                category: 'Sanat',
                description: 'Kampüsün en renkli sanat topluluğu.',
                logo_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071&auto=format&fit=crop',
                admin_id: userId
            }).select();

            if (error) {
                console.error("Community creation error:", error);
                throw error;
            }

            const comm = data?.[0];
            if (!comm) throw new Error("Community created but no data returned.");

            // 2. Seed Data
            console.log("Seeding events for community:", comm.id);
            await seedEvents(comm.id);
            
            alert("Topluluk ve veriler oluşturuldu!");
            console.log("Initialization complete. Updating Parent State directly...");
            
            // DIRECT FIX: Pass the created object to parent
            onComplete(comm); 
            
        } catch (e: any) {
            console.error("Initialization failed:", e);
            alert("Hata: " + e.message + "\nLütfen SQL politikasını kontrol edin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            type="button"
            onClick={handleInit}
            disabled={loading}
            className="w-full bg-[#C8102E] !text-white py-3 font-bold uppercase hover:bg-[#a60d26] transition-colors"
        >
            {loading ? 'Oluşturuluyor...' : 'Topluluğu Oluştur ve Başla'}
        </button>
    );
}

async function seedEvents(communityId: string) {
    // 1. Clean up existing events to prevent duplicates (Spam fix)
    console.log("Cleaning up old events...");
    await supabase.from('events').delete().eq('community_id', communityId);

    const pastEvents = [
        { title: 'Yaza Merhaba Sergisi', date: '2025-06-15', location: 'Sanat Galerisi' },
        { title: 'Dijital Sanat Atölyesi', date: '2025-11-20', location: 'Lab 3' },
        { title: 'Portre Çizim Teknikleri', date: '2025-10-05', location: 'Stüdyo 2' }
    ];

    for (const pEvent of pastEvents) {
        // Simple insert, duplicates might be allowed by schema but that's fine for demo
        const { data: eventData, error } = await supabase.from('events').insert({
            title: pEvent.title,
            category: 'workshop',
            description: 'Örnek etkinlik açıklaması.',
            excerpt: 'Kısa açıklama',
            date: pEvent.date, 
            time: '14:00',
            location: pEvent.location,
            community_id: communityId
        }).select().single();

        if (error) {
            console.error('Seed error:', error);
            throw error;
        }
    }

    // Seed Follower (Self)
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
         // Ignore error if already following
         await supabase.from('community_followers').insert({
             community_id: communityId,
             user_id: userData.user.id
         }).select();
    }
}

function DemoDataLoader({ communityId }: { communityId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    
    const loadData = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!communityId) {
             alert("Hata: Topluluk ID bulunamadı.");
             return;
        }
        setLoading(true);
        try {
            await seedEvents(communityId);
            alert('Demo verileri sıfırlandı!\n\nÖNEMLİ: Yorumları ve puanları görmek için şimdi Supabase SQL Editor\'de "seed_fake_members.sql" dosyasını çalıştırın.');
            // We can optionally refresh, but user complaints about 'nothing happening' often mean they expect visual confirmation or redirect.
            // An alert is good enough for 'Load Data', or we could reload.
            router.refresh(); 
        } catch (e: any) {
            console.error("Load data error:", e);
            alert("Hata oluştu: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            type="button"
            onClick={loadData} 
            disabled={loading}
            className="bg-neutral-200 text-neutral-600 px-4 py-2 font-bold uppercase text-xs hover:bg-neutral-300 transition-colors"
        >
            {loading ? 'Yükleniyor...' : 'Demo Verilerini Yükle'}
        </button>
    );
}
