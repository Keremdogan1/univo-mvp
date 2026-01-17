'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search, Trash2, Ghost, User, Calendar, MessageSquare, ArrowBigUp } from 'lucide-react';
import Link from 'next/link';
import { toTitleCase } from '@/lib/utils';

interface Voice {
    id: string;
    content: string;
    created_at: string;
    is_anonymous: boolean;
    user_id: string;
    profiles: {
        full_name: string;
        nickname?: string;
        avatar_url?: string;
    };
    counts?: {
        likes: number;
        comments: number;
    };
}

export default function AdminVoicesPage() {
    const [voices, setVoices] = useState<Voice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchVoices = async () => {
        try {
            const res = await fetch('/api/admin/voices');
            if (!res.ok) throw new Error('Paylaşımlar çekilemedi');
            const data = await res.json();
            setVoices(data.voices);
        } catch (err: any) {
            toast.error('Paylaşımlar yüklenirken hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVoices();
    }, []);

    const handleDelete = async (voiceId: string) => {
        if (!window.confirm('Bu paylaşımı kalıcı olarak silmek istediğinize emin misiniz?')) return;

        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_voice', voiceId })
            });

            if (!res.ok) throw new Error('Silme işlemi başarısız');

            toast.success('Paylaşım silindi');
            setVoices(voices.filter(v => v.id !== voiceId));
        } catch (err) {
            toast.error('Silme işlemi sırasında hata oluştu.');
        }
    };

    const filteredVoices = voices.filter(v => 
        v.content.toLowerCase().includes(search.toLowerCase()) ||
        v.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        v.profiles?.nickname?.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Paylaşımlar</h1>
                <p className="text-neutral-500">Kampüsün Sesi içerik yönetimi</p>
            </header>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-4">
                    <h2 className="font-bold text-lg">Tüm Gönderiler</h2>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="İçerik veya kullanıcı ara..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                </div>

                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {filteredVoices.map((voice) => (
                        <div key={voice.id} className="p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex gap-4 items-start flex-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-800 ${voice.is_anonymous ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100'}`}>
                                        {voice.is_anonymous ? <Ghost size={20} /> : (
                                            voice.profiles?.avatar_url ? <img src={voice.profiles.avatar_url} className="w-full h-full rounded-full object-cover" /> : <User size={20} className="text-neutral-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-bold text-neutral-900 dark:text-white">
                                                {voice.is_anonymous ? (voice.profiles?.nickname || 'Anonim') : toTitleCase(voice.profiles?.full_name)}
                                            </span>
                                            {voice.is_anonymous && (
                                                <span className="text-[10px] bg-neutral-100 dark:bg-neutral-700 text-neutral-500 px-1.5 py-0.5 rounded font-bold uppercase transition-colors">Yalnızca Admin: {toTitleCase(voice.profiles?.full_name)}</span>
                                            )}
                                            <span className="text-xs text-neutral-400 flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(voice.created_at).toLocaleDateString('tr-TR')} {new Date(voice.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed font-serif text-lg">
                                            {voice.content}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(voice.id)}
                                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                    title="Sil"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredVoices.length === 0 && (
                        <div className="p-12 text-center text-neutral-500 italic">
                            Paylaşım bulunamadı.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

