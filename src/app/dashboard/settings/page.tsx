'use client';

import { useState, useEffect, useRef } from 'react';

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ADMIN_EMAIL, ADMIN_NAME } from '@/lib/constants';
import { Rocket, ChevronDown, Check, X, Upload, Instagram, Twitter, Globe, Users } from 'lucide-react';

export default function SettingsPage() {
    const { user, profile } = useAuth();
    const router = useRouter(); 
    const [community, setCommunity] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

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
        const updates: any = {
            name: formData.get('name') as string,
            category: formData.get('category') as string,
            description: formData.get('description') as string,
            instagram_url: formData.get('instagram_url') as string,
            twitter_url: formData.get('twitter_url') as string,
            website_url: formData.get('website_url') as string,
        };
        // Explicitly set logo_url from state because file upload updates state directly
        if (community.logo_url) updates.logo_url = community.logo_url;
        else updates.logo_url = null; // Ensure we can clear it

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

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `communities/${community.id}/${Date.now()}.${fileExt}`;

        setUploading(true);
        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
            // Update local state immediately
            setCommunity({ ...community, logo_url: data.publicUrl });
        } catch (error) {
            console.error('Upload error:', error);
            alert('Logo yüklenirken hata oluştu!');
        } finally {
            setUploading(false);
        }
    };

    const removeLogo = () => {
        if (!window.confirm('Topluluk logosunu silmek istediğinize emin misiniz?')) return;
        setCommunity({ ...community, logo_url: '' });
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
                    {/* Logo Upload Section - Centered */}
                    <div className="flex flex-col items-center gap-6 justify-center pb-6 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="relative group">
                            <div className="w-32 h-32 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-700 overflow-hidden">
                                {community.logo_url ? (
                                    <img src={community.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Users size={40} className="text-neutral-400" />
                                )}
                            </div>
                            
                            {/* Upload Overlay */}
                            <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full text-white font-medium text-xs">
                                <Upload size={20} className="mb-1" />
                                Değiştir
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleLogoUpload}
                                />
                            </label>

                            {community.logo_url && (
                                <button
                                    type="button"
                                    onClick={removeLogo}
                                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-sm hover:bg-red-600 transition-colors z-10"
                                    title="Logoyu Kaldır"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Topluluk Logosu</p>
                            <p className="text-xs text-neutral-500 max-w-[200px] mx-auto">PNG, JPG veya GIF. Önerilen boyut: 400x400px.</p>
                        </div>
                    </div>

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
                        <label className="block font-bold text-sm mb-2 dark:text-neutral-200">Sosyal Medya Hesapları</label>
                        <div className="space-y-3">
                            <div className="relative">
                                <Instagram className="absolute top-3 left-3 text-neutral-400" size={20} />
                                <input 
                                    name="instagram_url"
                                    type="text" 
                                    placeholder="Instagram Profili (Örn: https://instagram.com/univo)"
                                    defaultValue={community?.instagram_url}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 dark:text-white hover:border-[var(--primary-color)] focus:border-[var(--primary-color)] outline-none transition-colors"
                                />
                            </div>
                            <div className="relative">
                                <Twitter className="absolute top-3 left-3 text-neutral-400" size={20} />
                                <input 
                                    name="twitter_url"
                                    type="text" 
                                    placeholder="Twitter Profili (X)"
                                    defaultValue={community?.twitter_url}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 dark:text-white hover:border-[var(--primary-color)] focus:border-[var(--primary-color)] outline-none transition-colors"
                                />
                            </div>
                            <div className="relative">
                                <Globe className="absolute top-3 left-3 text-neutral-400" size={20} />
                                <input 
                                    name="website_url"
                                    type="text" 
                                    placeholder="Web Sitesi URL"
                                    defaultValue={community?.website_url}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 dark:text-white hover:border-[var(--primary-color)] focus:border-[var(--primary-color)] outline-none transition-colors"
                                />
                            </div>
                        </div>
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
