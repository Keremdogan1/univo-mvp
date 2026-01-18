'use client';

import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Search, Trash2, Ghost, User, Calendar, MessageSquare, ArrowBigUp, Filter, ChevronDown, X } from 'lucide-react';
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
    image_url?: string;
}

export default function AdminVoicesPage() {
    const [voices, setVoices] = useState<Voice[]>([]);
    const [topTags, setTopTags] = useState<string[]>([]);
    const [tagHistory, setTagHistory] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'anonymous' | 'public' | 'with_images'>('all');
    const [showFilters, setShowFilters] = useState(false);
    // Changed from single string to array for multi-tag support
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const fetchVoices = async () => {
        try {
            const res = await fetch('/api/admin/voices');
            if (!res.ok) throw new Error('Paylaşımlar çekilemedi');
            const data = await res.json();
            setVoices(data.voices);
            setTopTags(data.topTags || []);
        } catch (err: any) {
            toast.error('Paylaşımlar yüklenirken hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVoices();
        // Load tag history
        const savedHistory = localStorage.getItem('admin_tag_history');
        if (savedHistory) setTagHistory(JSON.parse(savedHistory));
    }, []);

    const addToHistory = (tag: string) => {
        const cleanTag = tag.replace(/^#/, '').toLowerCase();
        const newHistory = [cleanTag, ...tagHistory.filter(t => t !== cleanTag)].slice(0, 5);
        setTagHistory(newHistory);
        localStorage.setItem('admin_tag_history', JSON.stringify(newHistory));
    };

    const addTagFilter = (tag: string) => {
        const cleanTag = tag.replace(/^#/, '').toLowerCase();
        if (cleanTag && !selectedTags.includes(cleanTag)) {
            setSelectedTags(prev => [...prev, cleanTag]);
            addToHistory(cleanTag);
        }
    };

    const removeTagFilter = (tag: string) => {
        setSelectedTags(prev => prev.filter(t => t !== tag));
    };

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

    const filteredVoices = useMemo(() => {
        return voices.filter(v => {
            const matchesSearch = v.content.toLowerCase().includes(search.toLowerCase()) ||
                v.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                v.profiles?.nickname?.toLowerCase().includes(search.toLowerCase());
            
            const matchesFilter = 
                filter === 'all' ? true :
                filter === 'anonymous' ? v.is_anonymous :
                filter === 'with_images' ? !!v.image_url :
                !v.is_anonymous;

            // Multi-tag matching: post must contain ALL selected tags
            const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => 
                v.content.toLowerCase().includes(`#${tag.toLowerCase()}`)
            );

            // User ID matching
            const matchesUser = !selectedUserId || v.user_id === selectedUserId;

            return matchesSearch && matchesFilter && matchesTags && matchesUser;
        });
    }, [voices, search, filter, selectedTags, selectedUserId]);

    const activeFilterCount = [filter !== 'all', selectedTags.length > 0, selectedUserId].filter(Boolean).length;

    if (isLoading) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                <div className="space-y-4">
                    <div className="h-10 w-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse"></div>
                    <div className="h-4 w-96 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg animate-pulse"></div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="h-12 flex-1 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl animate-pulse"></div>
                    <div className="h-12 w-32 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl animate-pulse"></div>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="p-6 bg-white dark:bg-neutral-800 space-y-4">
                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 animate-pulse"></div>
                                    <div className="flex-1 space-y-2 pt-1">
                                        <div className="h-4 w-32 bg-neutral-100 dark:bg-neutral-700 rounded animate-pulse"></div>
                                        <div className="h-3 w-48 bg-neutral-50 dark:bg-neutral-700/50 rounded animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="space-y-2 ml-14">
                                    <div className="h-4 w-full bg-neutral-50 dark:bg-neutral-700/50 rounded animate-pulse"></div>
                                    <div className="h-4 w-3/4 bg-neutral-50 dark:bg-neutral-700/50 rounded animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-neutral-900 dark:text-white">
                    <MessageSquare size={32} className="text-primary" /> Paylaşımlar
                </h1>
                <p className="text-neutral-500 mt-1">Kampüsün Sesi içerik yönetimi</p>
            </header>

            <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="İçerik veya kullanıcı ara..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && search.startsWith('#')) {
                                    addToHistory(search.replace('#', ''));
                                }
                            }}
                            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
                            showFilters || activeFilterCount > 0 
                                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent' 
                                : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                        }`}
                    >
                        <Filter size={18} />
                        <span>Filtreler</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {activeFilterCount}
                            </span>
                        )}
                        <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="space-y-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Gizlilik Durumu</label>
                            <div className="flex gap-2">
                                {[
                                    { id: 'all', label: 'Tümü' },
                                    { id: 'anonymous', label: 'Anonimler' },
                                    { id: 'public', label: 'Herkese Açık' }
                                ].map((btn) => (
                                    <button
                                        key={btn.id}
                                        onClick={() => setFilter(btn.id as any)}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                            filter === btn.id 
                                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' 
                                            : 'bg-white text-neutral-500 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700'
                                        }`}
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Tag Yönetimi</label>
                            
                            {/* Active Tags */}
                            {selectedTags.length > 0 && (
                                <div className="mb-4">
                                    <span className="text-[10px] text-neutral-400 mb-2 block font-bold uppercase">Aktif Taglar</span>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTags.map((tag) => (
                                            <div 
                                                key={tag}
                                                className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold animate-in zoom-in-95"
                                            >
                                                <span>#{tag}</span>
                                                <button 
                                                    onClick={() => removeTagFilter(tag)}
                                                    className="hover:bg-white/20 dark:hover:bg-black/20 rounded-full p-0.5"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Tags (excluding active) */}
                            {tagHistory.filter(t => !selectedTags.includes(t)).length > 0 && (
                                <div className="mb-4">
                                    <span className="text-[10px] text-neutral-400 mb-2 block font-bold uppercase">Son Arananlar</span>
                                    <div className="flex flex-wrap gap-2">
                                        {tagHistory.filter(t => !selectedTags.includes(t)).map((tag) => (
                                            <button
                                                key={tag}
                                                onClick={() => addTagFilter(tag)}
                                                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400 hover:bg-neutral-300 dark:hover:bg-neutral-600"
                                            >
                                                #{tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Popular Tags (excluding active) */}
                            <div>
                                <span className="text-[10px] text-neutral-400 mb-2 block font-bold uppercase">Popüler</span>
                                <div className="flex flex-wrap gap-2">
                                    {topTags.filter(t => !selectedTags.includes(t)).slice(0, 5).map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => addTagFilter(tag)}
                                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all bg-white text-neutral-400 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700 hover:border-primary hover:text-primary"
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                    {topTags.filter(t => !selectedTags.includes(t)).length === 0 && topTags.length > 0 && <span className="text-xs text-neutral-400 italic">Tüm popüler taglar seçili.</span>}
                                    {topTags.length === 0 && <span className="text-xs text-neutral-400 italic">Henüz etiket bulunmuyor.</span>}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Medya</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilter(filter === 'with_images' ? 'all' : 'with_images')}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                        filter === 'with_images'
                                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' 
                                        : 'bg-white text-neutral-500 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700'
                                    }`}
                                >
                                    Fotoğraflılar
                                </button>
                            </div>
                        </div>

                        {(activeFilterCount > 0) && (
                            <div className="sm:col-span-2 flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                <button
                                    onClick={() => {
                                        setFilter('all');
                                        setSearch('');
                                        setSelectedTags([]);
                                        setSelectedUserId(null);
                                    }}
                                    className="text-sm text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-bold"
                                >
                                    <X size={14} strokeWidth={3} /> Filtreleri Temizle
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="text-sm text-neutral-500 mb-4 px-1">
                {filteredVoices.length} / {voices.length} paylaşım gösteriliyor
            </div>

            {/* Voices List */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden mt-4">
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {filteredVoices.map((voice) => (
                        <div key={voice.id} className="p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex gap-4 items-start flex-1">
                                    <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-800 ${voice.is_anonymous ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}>
                                        {(!voice.is_anonymous && voice.profiles?.avatar_url) ? (
                                            <img src={voice.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <MessageSquare size={18} />
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
                                        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed font-serif text-lg mb-3">
                                            {voice.content}
                                        </p>
                                        {voice.image_url && (
                                            <div className="mt-3 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 w-full max-w-sm">
                                                <img src={voice.image_url} alt="" className="w-full h-auto object-contain bg-neutral-100 dark:bg-neutral-900" />
                                            </div>
                                        )}
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
