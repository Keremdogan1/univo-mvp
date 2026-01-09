'use client';

import { useState, useEffect, useRef } from 'react';

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ADMIN_EMAIL, ADMIN_NAME } from '@/lib/constants';
import { Rocket, ChevronDown, Check } from 'lucide-react';

export default function SettingsPage() {
    const { user, profile } = useAuth();
    const router = useRouter(); 
    const [community, setCommunity] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const isAdmin = user?.email === ADMIN_EMAIL || profile?.full_name === ADMIN_NAME;

    const fetchCommunity = async () => {
        if (!user) return;
        setLoading(true);
        const { data } = await supabase.from('communities').select('*').eq('admin_id', user.id).limit(1);
        if (data && data.length > 0) setCommunity(data[0]);
        setLoading(false);
    };

    useEffect(() => {
        fetchCommunity();
    }, [user?.id]); // Only refresh if ID changes (fixes loop)

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
            toast.success("Değişiklikler başarıyla kaydedildi!");
            router.refresh(); 
        } catch (error: any) {
            console.error("Update error:", error);
            toast.error("Güncelleme başarısız: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
       return (
            <div className="min-h-screen flex items-center justify-center">
                 <div className="w-8 h-8 border-4 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin"></div>
            </div>
       )
    }

    if (!community) {
        return (
            <div className="max-w-2xl mx-auto py-12">
                <h1 className="text-3xl font-black font-serif mb-8 text-center dark:text-white">Hoş Geldiniz</h1>
                
                <div className="grid gap-8">
                    {/* Manual Creation */}
                    <div className="bg-white dark:bg-neutral-900 p-8 border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-3 dark:text-white">
                             <div className="w-10 h-10 rounded-full border-2 border-[var(--primary-color)] flex items-center justify-center text-neutral-900 dark:text-white bg-transparent">
                                <Rocket size={20} />
                             </div>
                             {isAdmin ? 'Yeni Topluluk Oluştur' : 'Erişim Kısıtlı'}
                        </h3>
                        {isAdmin ? (
                            <>
                                <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-sm">
                                    Kendi topluluğunuzu sıfırdan kurun ve yönetmeye başlayın.
                                </p>
                                <CreateCommunityForm userId={user?.id || ''} onComplete={(data) => setCommunity(data)} />
                            </>
                        ) : (
                            <p className="text-neutral-600 dark:text-neutral-500 text-sm italic">
                                Sadece sistem yöneticisi topluluk oluşturabilir.
                            </p>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-neutral-300 dark:border-neutral-700"></div>
                        <span className="flex-shrink mx-4 text-neutral-400 text-sm font-bold uppercase">veya</span>
                        <div className="flex-grow border-t border-neutral-300 dark:border-neutral-700"></div>
                    </div>

                    {/* Demo Button */}
                    {isAdmin && (
                        <div className="bg-neutral-50 dark:bg-neutral-900 p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg text-center opacity-75 hover:opacity-100 transition-opacity">
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
            <h1 className="text-3xl font-black font-serif mb-8 dark:text-white">Topluluk Ayarları</h1>
            
            <div className="bg-white dark:bg-neutral-900 p-6 border-2 border-black dark:border-neutral-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] transition-colors">
                <form className="space-y-6" onSubmit={handleUpdate}>
                    <div>
                        <label className="block font-bold text-sm mb-2 dark:text-neutral-200">Topluluk Adı</label>
                        <input 
                            name="name"
                            type="text" 
                            defaultValue={community?.name}
                            className="w-full border-2 border-neutral-300 dark:border-neutral-700 p-3 font-serif hover:border-[var(--primary-color)] focus:border-[var(--primary-color)] bg-white dark:bg-neutral-800 dark:text-white outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block font-bold text-sm mb-2 dark:text-neutral-200">Kategori</label>
                        <CustomSelect 
                            name="category" 
                            defaultValue={community?.category || 'Sanat'} 
                            options={['Sanat', 'Spor', 'Teknoloji', 'Girişimcilik', 'Sosyal']}
                        />
                    </div>

                    <div>
                        <label className="block font-bold text-sm mb-2 dark:text-neutral-200">Açıklama</label>
                        <textarea 
                            name="description"
                            rows={4}
                            defaultValue={community?.description}
                            className="w-full border-2 border-neutral-300 dark:border-neutral-700 p-3 font-serif hover:border-[var(--primary-color)] focus:border-[var(--primary-color)] bg-white dark:bg-neutral-800 dark:text-white outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block font-bold text-sm mb-2 dark:text-neutral-200">Logo URL</label>
                        <input 
                            name="logo_url"
                            type="text" 
                            defaultValue={community?.logo_url}
                            className="w-full border-2 border-neutral-300 dark:border-neutral-700 p-3 font-serif hover:border-[var(--primary-color)] focus:border-[var(--primary-color)] bg-white dark:bg-neutral-800 dark:text-white outline-none transition-colors"
                        />
                    </div>

                    <div className="pt-4 border-t border-neutral-200">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="bg-[var(--primary-color)] text-white px-6 py-3 font-bold uppercase hover:bg-[var(--primary-color-hover)] transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Demo Data Section */}
            <div className="mt-8 bg-neutral-100 dark:bg-neutral-900 p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-700">
                <h3 className="text-lg font-bold font-serif mb-2 dark:text-white">Demo Verileri</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    Topluluğunuz boş görünüyorsa, aşağıdan örnek verileri tekrar yükleyebilirsiniz.
                </p>
                <DemoDataLoader communityId={community?.id} />
            </div>
        </div>
    );
}

// Custom Select Component to avoid Blue Hover issues
function CustomSelect({ name, defaultValue, options }: { name: string, defaultValue: string, options: string[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(defaultValue);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: string) => {
        setSelected(option);
        setIsOpen(false);
    };

    return (
        <div className="relative font-serif" ref={containerRef}>
            {/* Hidden input for form submission */}
            <input type="hidden" name={name} value={selected} />
            
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full text-left p-3 border-2 flex items-center justify-between transition-colors outline-none bg-white dark:bg-neutral-800 dark:text-white
                    ${isOpen ? 'border-[var(--primary-color)]' : 'border-neutral-300 dark:border-neutral-700 hover:border-[var(--primary-color)]'}
                `}
            >
                <span>{selected}</span>
                <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--primary-color)]' : 'text-neutral-400'}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
                    {options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => handleSelect(option)}
                            className="w-full text-left px-4 py-3 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 last:border-0
                                hover:border-l-4 hover:border-l-[var(--primary-color)] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all group"
                        >
                            <span className={`group-hover:text-[var(--primary-color)] group-hover:font-bold dark:text-white transition-colors ${selected === option ? 'font-bold text-[var(--primary-color)]' : 'text-neutral-600'}`}>
                                {option}
                            </span>
                            {selected === option && <Check size={16} className="text-[var(--primary-color)]" />}
                        </button>
                    ))}
                </div>
            )}
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
                toast.success("Topluluk başarıyla oluşturuldu!");
                onComplete(data[0]);
            }
        } catch (e: any) {
             toast.error("Hata: " + e.message + "\nLütfen 'seed_fake_members.sql' dosyasını çalıştırarak veritabanı şemasını güncellediğinizden emin olun.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block font-bold text-sm mb-1">Topluluk Adı</label>
                <input required name="name" type="text" placeholder="Örn: Dağcılık Kulübü" className="w-full border-2 border-neutral-200 dark:border-neutral-700 p-2 hover:border-[var(--primary-color)] focus:border-[var(--primary-color)] bg-white dark:bg-neutral-800 dark:text-white outline-none transition-colors" />
            </div>
             <div>
                <label className="block font-bold text-sm mb-1">Kategori</label>
                <CustomSelect 
                    name="category" 
                    defaultValue="Sanat" 
                    options={['Sanat', 'Spor', 'Teknoloji', 'Girişimcilik', 'Sosyal']}
                />
            </div>
             <div>
                <label className="block font-bold text-sm mb-1">Kısa Açıklama</label>
                <textarea required name="description" rows={2} placeholder="Topluluğunuzu anlatan kısa bir yazı..." className="w-full border-2 border-neutral-200 dark:border-neutral-700 p-2 hover:border-[var(--primary-color)] focus:border-[var(--primary-color)] bg-white dark:bg-neutral-800 dark:text-white outline-none transition-colors" />
            </div>
            <button disabled={loading} type="submit" className="w-full bg-[var(--primary-color)] text-white font-bold uppercase py-3 hover:bg-[var(--primary-color-hover)] transition-colors shadow-lg">
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
            const { data, error } = await supabase.from('communities').insert({
                name: 'UniVo Sanat Topluluğu',
                category: 'Sanat',
                description: 'Kampüsün en renkli sanat topluluğu.',
                logo_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071&auto=format&fit=crop',
                admin_id: userId
            }).select();

            if (error) throw error;
            const comm = data?.[0];
            if (!comm) throw new Error("Community created but no data returned.");

            await seedEvents(comm.id);
            toast.success("Topluluk ve veriler oluşturuldu!");
            onComplete(comm); 
        } catch (e: any) {
            console.error("Initialization failed:", e);
            toast.error("Hata: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            type="button"
            onClick={handleInit}
            disabled={loading}
            className="w-full bg-[var(--primary-color)] !text-white py-3 font-bold uppercase hover:bg-[var(--primary-color-hover)] transition-colors"
        >
            {loading ? 'Oluşturuluyor...' : 'Topluluğu Oluştur ve Başla'}
        </button>
    );
}

async function seedEvents(communityId: string) {
    console.log("Cleaning up old events...");
    await supabase.from('events').delete().eq('community_id', communityId);

    const pastEvents = [
        { title: 'Yaza Merhaba Sergisi', date: '2025-06-15', location: 'Sanat Galerisi' },
        { title: 'Dijital Sanat Atölyesi', date: '2025-11-20', location: 'Lab 3' },
        { title: 'Portre Çizim Teknikleri', date: '2025-10-05', location: 'Stüdyo 2' }
    ];

    for (const pEvent of pastEvents) {
        const { error } = await supabase.from('events').insert({
            title: pEvent.title,
            category: 'workshop',
            description: 'Örnek etkinlik açıklaması.',
            date: pEvent.date, 
            time: '14:00',
            location: pEvent.location,
            community_id: communityId
        }).select().single();
        if (error) console.error('Seed error:', error);
    }
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
         await supabase.from('community_followers').insert({
             community_id: communityId,
             user_id: userData.user.id
         });
    }
}

function DemoDataLoader({ communityId }: { communityId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    
    const loadData = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!communityId) {
             toast.error("Hata: Topluluk ID bulunamadı.");
             return;
        }
        setLoading(true);
        try {
            await seedEvents(communityId);
            toast.success('Demo verileri sıfırlandı!');
            router.refresh(); 
        } catch (e: any) {
            console.error("Load data error:", e);
            toast.error("Hata oluştu: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            type="button"
            onClick={loadData} 
            disabled={loading}
            className="bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-4 py-2 font-bold uppercase text-xs hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
        >
            {loading ? 'Yükleniyor...' : 'Demo Verilerini Yükle'}
        </button>
    );
}
