'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, Moon, Sun, Shield, Bell, LogOut, Check, User, Users, Heart, BarChart2, Laptop, Palette, Lock } from 'lucide-react';
import { useTheme, ColorTheme } from '@/contexts/ThemeContext';
import { toTitleCase, cn } from '@/lib/utils';

const colorThemes: { id: ColorTheme; label: string; color: string; bg: string }[] = [
    { id: 'default', label: 'Mars Kırmızısı', color: '#C8102E', bg: 'bg-red-500' },
    { id: 'blue', label: 'Okyanus Mavisi', color: '#3b82f6', bg: 'bg-blue-500' },
    { id: 'green', label: 'Orman Yeşili', color: '#22c55e', bg: 'bg-green-500' },
    { id: 'purple', label: 'Kraliyet Moru', color: '#a855f7', bg: 'bg-purple-500' },
    { id: 'orange', label: 'Gün Batımı', color: '#f97316', bg: 'bg-orange-500' },
];

type SettingsTab = 'account' | 'appearance' | 'privacy';

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const { theme, setTheme, colorTheme, setColorTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<SettingsTab>('appearance'); // Default to appearance as per user focus
    const [privacySettings, setPrivacySettings] = useState({
        show_interests: true,
        show_activities: true,
        show_friends: true,
        show_polls: true
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
        if (!user) {
            router.push('/login');
            return;
        }
        fetchSettings();
    }, [user]);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('privacy_settings')
                .eq('id', user?.id)
                .single();

            if (error) throw error;
            if (data?.privacy_settings) {
                setPrivacySettings(data.privacy_settings);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Ayarlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const updatePrivacy = async (key: string, value: boolean) => {
        const newSettings = { ...privacySettings, [key]: value };
        setPrivacySettings(newSettings);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ privacy_settings: newSettings })
                .eq('id', user?.id);

            if (error) throw error;
            toast.success('Ayarlar güncellendi');
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Güncellenemedi');
            setPrivacySettings(prev => ({ ...prev, [key]: !value }));
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    if (!mounted || loading) return null;

    // === DESKTOP LAYOUT ===
    const DesktopView = () => (
        <div className="hidden md:flex min-h-[calc(100vh-4rem)] max-w-6xl mx-auto p-8 gap-12">
            {/* Sidebar */}
            <div className="w-64 shrink-0 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-neutral-900 dark:text-white mb-6">Ayarlar</h1>
                    <nav className="space-y-2">
                        <button
                            onClick={() => setActiveTab('account')}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium",
                                activeTab === 'account' 
                                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm" 
                                    : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                            )}
                        >
                            <User size={20} />
                            Hesap
                        </button>
                        <button
                            onClick={() => setActiveTab('appearance')}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium",
                                activeTab === 'appearance' 
                                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm" 
                                    : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                            )}
                        >
                            <Palette size={20} />
                            Görünüm
                        </button>
                        <button
                            onClick={() => setActiveTab('privacy')}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium",
                                activeTab === 'privacy' 
                                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm" 
                                    : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                            )}
                        >
                            <Lock size={20} />
                            Gizlilik
                        </button>
                    </nav>
                </div>

                <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors w-full font-medium"
                    >
                        <LogOut size={20} />
                        Çıkış Yap
                    </button>
                </div>
            </div>

                <div className="flex-1 max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm h-fit">
                {activeTab === 'account' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <section>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">Hesap Bilgileri</h2>
                            <p className="text-sm text-neutral-500 mb-6">Kişisel bilgilerinizi ve hesap detaylarınızı buradan yönetin.</p>
                            
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center gap-4">
                                <div 
                                    className="h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold font-serif text-white shadow-sm"
                                    style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}
                                >
                                    {(user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'Ö').toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-neutral-900 dark:text-white">E-posta Adresi</div>
                                    <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400 font-mono">{user?.email}</div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'appearance' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <section>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">Tema Seçenekleri</h2>
                            <p className="text-sm text-neutral-500 mb-6">Uygulamanın görünümünü tercihlerinize göre özelleştirin.</p>
                            
                            {/* Mode Switch */}
                            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                        {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-neutral-900 dark:text-white">Karanlık Mod</div>
                                        <div className="text-sm font-medium text-neutral-500">Göz yormayan koyu tema deneyimi</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className={cn(
                                        "relative w-14 h-7 rounded-full transition-colors duration-300 ease-in-out",
                                        theme === 'dark' ? "bg-[var(--primary-color)]" : "bg-neutral-300"
                                    )}
                                >
                                    <span 
                                        className={cn(
                                            "absolute left-1 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-sm",
                                            theme === 'dark' ? "translate-x-7" : "translate-x-0"
                                        )} 
                                    />
                                </button>
                            </div>

                            {/* Color Selection */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-900 dark:text-white mb-4">
                                    Vurgu Rengi
                                </label>
                                <div className="grid grid-cols-5 gap-4">
                                    {colorThemes.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setColorTheme(t.id)}
                                            className={cn(
                                                "group relative aspect-square rounded-xl flex flex-col items-center justify-center gap-2 transition-all border",
                                                colorTheme === t.id 
                                                    ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5" 
                                                    : "border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700"
                                            )}
                                        >
                                            <div 
                                                className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-transform group-hover:scale-110"
                                                style={{ backgroundColor: t.color }}
                                            >
                                                {colorTheme === t.id && <Check size={16} className="text-white bg-black/20 rounded-full p-0.5" strokeWidth={3} />}
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 text-center px-1 hidden lg:block">
                                                {t.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'privacy' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <section>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">Gizlilik Ayarları</h2>
                            <p className="text-sm text-neutral-500 mb-6">Profilinizin başkaları tarafından nasıl görüneceğini kontrol edin.</p>
                            
                            <div className="space-y-4">
                                {[
                                    { id: 'show_friends', label: 'Arkadaş Listesi', desc: 'Arkadaşlarını profilinde göster', icon: Users, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
                                    { id: 'show_activities', label: 'Son Aktiviteler', desc: 'Son aktivitelerini göster', icon: Bell, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' },
                                    { id: 'show_interests', label: 'İlgi Alanları', desc: 'İlgi alanlarını profilinde göster', icon: Heart, color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30 dark:text-pink-400' },
                                    { id: 'show_polls', label: 'Anket Katılımları', desc: 'Anket katılımlarını profilinde göster', icon: BarChart2, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400' },
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("p-3 rounded-lg shadow-sm", item.color)}>
                                                <item.icon size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-neutral-900 dark:text-white">{item.label}</div>
                                                <div className="text-sm font-medium text-neutral-500">{item.desc}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => updatePrivacy(item.id, !privacySettings[item.id as keyof typeof privacySettings])}
                                            className={cn(
                                                "relative w-12 h-6 rounded-full transition-colors duration-300 ease-in-out",
                                                privacySettings[item.id as keyof typeof privacySettings] 
                                                    ? "bg-[var(--primary-color)]" 
                                                    : "bg-neutral-300 dark:bg-neutral-600"
                                            )}
                                        >
                                            <span 
                                                className={cn(
                                                    "absolute left-1 top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm",
                                                    privacySettings[item.id as keyof typeof privacySettings] 
                                                        ? "translate-x-6" 
                                                        : "translate-x-0"
                                                )} 
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );

    // === MOBILE LAYOUT (UNCHANGED ish) ===
    const MobileView = () => (
        <div className="md:hidden min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] pb-24">
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 h-16 flex items-center gap-4">
                <button 
                    onClick={() => router.back()}
                    className="p-2 -ml-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-neutral-900 dark:text-white" />
                </button>
                <h1 className="text-xl font-bold font-serif text-neutral-900 dark:text-white">Ayarlar</h1>
            </div>

            <div className="p-4 space-y-6">
                {/* Account Section */}
                <section>
                    <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 ml-1">Hesap</h2>
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                                    <User size={20} className="text-neutral-600 dark:text-neutral-400" />
                                </div>
                                <div>
                                    <div className="font-medium text-neutral-900 dark:text-white">E-posta</div>
                                    <div className="text-sm text-neutral-500">{user?.email}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Appearance Section */}
                <section>
                    <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 ml-1">Görünüm</h2>
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden p-4 space-y-6">
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                                    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} className="text-neutral-600" />}
                                </div>
                                <div className="font-medium text-neutral-900 dark:text-white">Karanlık Mod</div>
                            </div>
                            
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out bg-neutral-200 dark:bg-neutral-700"
                                style={{ backgroundColor: theme === 'dark' ? 'var(--primary-color)' : undefined }}
                            >
                                <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                                Renk Teması
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {colorThemes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setColorTheme(t.id)}
                                        className={cn(
                                            "group relative aspect-square rounded-full flex items-center justify-center transition-all",
                                            colorTheme === t.id 
                                            ? 'ring-2 ring-offset-2 ring-black dark:ring-white dark:ring-offset-neutral-900' 
                                            : 'hover:scale-110'
                                        )}
                                        style={{ backgroundColor: t.color }}
                                        title={t.label}
                                    >
                                        {colorTheme === t.id && (
                                            <Check size={16} className="text-white drop-shadow-md" strokeWidth={3} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </section>

                {/* Privacy Section */}
                <section>
                    <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 ml-1">Gizlilik</h2>
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                        {[
                            { id: 'show_friends', label: 'Arkadaş Listesi', desc: 'Arkadaşlarını profilinde göster', icon: Users, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
                            { id: 'show_activities', label: 'Son Aktiviteler', desc: 'Son aktivitelerini göster', icon: Bell, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
                            { id: 'show_interests', label: 'İlgi Alanları', desc: 'İlgi alanlarını profilinde göster', icon: Heart, color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' },
                            { id: 'show_polls', label: 'Anket Katılımları', desc: 'Anket katılımlarını profilinde göster', icon: BarChart2, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
                        ].map((item) => (
                            <div key={item.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg", item.color)}>
                                        <item.icon size={20} />
                                    </div>
                                    <div>
                                        <div className="font-medium text-neutral-900 dark:text-white">{item.label}</div>
                                        <div className="text-xs text-neutral-500">{item.desc}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => updatePrivacy(item.id, !privacySettings[item.id as keyof typeof privacySettings])}
                                    className="relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out bg-neutral-200 dark:bg-neutral-700"
                                    style={{ backgroundColor: privacySettings[item.id as keyof typeof privacySettings] ? 'var(--primary-color)' : undefined }}
                                >
                                    <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${privacySettings[item.id as keyof typeof privacySettings] ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <button 
                    onClick={handleSignOut}
                    className="w-full p-4 flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 rounded-xl font-bold transition-colors shadow-sm border border-red-100 dark:border-red-900/30"
                >
                    <LogOut size={20} />
                    Çıkış Yap
                </button>

                <div className="text-center text-xs text-neutral-400 py-4">
                    Univo v1.0.0 • ODTÜ Öğrencileri için
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a]">
            <DesktopView />
            <MobileView />
        </div>
    );
}
