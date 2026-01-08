'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, Moon, Sun, Shield, Bell, LogOut, Check, User, Users } from 'lucide-react';
import { useTheme, ColorTheme } from '@/contexts/ThemeContext';

const colorThemes: { id: ColorTheme; label: string; color: string }[] = [
    { id: 'default', label: 'Varsayılan (Kırmızı)', color: '#C8102E' },
    { id: 'blue', label: 'Okyanus Mavisi', color: '#3b82f6' },
    { id: 'green', label: 'Orman Yeşili', color: '#22c55e' },
    { id: 'purple', label: 'Kraliyet Moru', color: '#a855f7' },
    { id: 'orange', label: 'Gün Batımı Turuncusu', color: '#f97316' },
];

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const { theme, setTheme, colorTheme, setColorTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [privacySettings, setPrivacySettings] = useState({
        show_email: false,
        show_interests: true,
        show_activities: true,
        show_friends: true
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
            // Revert on error
            setPrivacySettings(prev => ({ ...prev, [key]: !value }));
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    if (!mounted || loading) return null;

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] pb-20">
            {/* Mobile Header */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 h-16 flex items-center gap-4">
                <button 
                    onClick={() => router.back()}
                    className="p-2 -ml-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-neutral-900 dark:text-white" />
                </button>
                <h1 className="text-xl font-bold font-serif text-neutral-900 dark:text-white">Ayarlar</h1>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                
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
                        
                        {/* Theme Mode */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                                    {theme === 'dark' ? 
                                        <Moon size={20} style={{ color: 'var(--primary-color)' }} /> : 
                                        <Sun size={20} className="text-neutral-600 dark:text-neutral-400" />
                                    }
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

                        {/* Color Theme */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                                Renk Teması
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {colorThemes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setColorTheme(t.id)}
                                        className={`group relative aspect-square rounded-full flex items-center justify-center transition-all ${
                                            colorTheme === t.id 
                                            ? 'ring-2 ring-offset-2 ring-black dark:ring-white dark:ring-offset-neutral-900' 
                                            : 'hover:scale-110'
                                        }`}
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
                        
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-neutral-900 dark:text-white">E-posta Görünürlüğü</div>
                                    <div className="text-xs text-neutral-500">Profilinde e-posta adresini göster</div>
                                </div>
                            </div>
                            <button
                                onClick={() => updatePrivacy('show_email', !privacySettings.show_email)}
                                className="relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out bg-neutral-200"
                                style={{ backgroundColor: privacySettings.show_email ? 'var(--primary-color)' : undefined }}
                            >
                                <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${privacySettings.show_email ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-neutral-900 dark:text-white">Arkadaş Listesi</div>
                                    <div className="text-xs text-neutral-500">Arkadaşlarını profilinde göster</div>
                                </div>
                            </div>
                            <button
                                onClick={() => updatePrivacy('show_friends', !privacySettings.show_friends)}
                                className="relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out bg-neutral-200"
                                style={{ backgroundColor: privacySettings.show_friends ? 'var(--primary-color)' : undefined }}
                            >
                                <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${privacySettings.show_friends ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                         <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-neutral-900 dark:text-white">Son Aktiviteler</div>
                                    <div className="text-xs text-neutral-500">Son aktivitelerini göster</div>
                                </div>
                            </div>
                            <button
                                onClick={() => updatePrivacy('show_activities', !privacySettings.show_activities)}
                                className="relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out bg-neutral-200"
                                style={{ backgroundColor: privacySettings.show_activities ? 'var(--primary-color)' : undefined }}
                            >
                                <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${privacySettings.show_activities ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

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
}
