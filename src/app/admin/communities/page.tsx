'use client';

import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Search, Trash2, Users, Calendar, ArrowRight, Settings, Plus, Building2, Filter, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

interface Community {
    id: string;
    name: string;
    logo_url: string;
    category: string;
    admin_id: string;
    admin_name: string;
    follower_count: number;
    event_count: number;
    created_at: string;
}

export default function AdminCommunitiesPage() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchCommunities = async () => {
        try {
            const res = await fetch('/api/admin/communities');
            if (!res.ok) throw new Error('Topluluklar çekilemedi');
            const data = await res.json();
            setCommunities(data.communities);
        } catch (err: any) {
            toast.error('Topluluklar yüklenirken hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCommunities();
    }, []);

    const handleDelete = async (communityId: string) => {
        if (!window.confirm('Bu topluluğu kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve topluluğa ait tüm veriler silinebilir.')) return;

        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_community', communityId })
            });

            if (!res.ok) throw new Error('Silme işlemi başarısız');

            toast.success('Topluluk silindi');
            setCommunities(communities.filter(c => c.id !== communityId));
        } catch (err) {
            toast.error('Silme işlemi sırasında hata oluştu.');
        }
    };

    const filteredCommunities = useMemo(() => {
        return communities.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.category.toLowerCase().includes(search.toLowerCase()) ||
            c.admin_name.toLowerCase().includes(search.toLowerCase())
        );
    }, [communities, search]);

    if (isLoading) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                <div className="space-y-4">
                    <div className="h-10 w-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse"></div>
                    <div className="h-4 w-96 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg animate-pulse"></div>
                </div>
                
                <div className="flex gap-3">
                    <div className="h-12 flex-1 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl animate-pulse"></div>
                    <div className="h-12 w-32 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl animate-pulse"></div>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 h-16"></div>
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="p-6 bg-white dark:bg-neutral-800 h-24 animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                    <Users className="text-primary" size={32} />
                    Topluluk Yönetimi
                </h1>
                <p className="text-neutral-500 mt-1">Platformdaki tüm öğrenci topluluklarını denetle</p>
            </header>

            {/* Standardized Search & Filter Bar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Topluluk, kategori veya yönetici ara..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all shadow-sm"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
                        showFilters 
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent' 
                            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                    }`}
                >
                    <Filter size={18} />
                    <span>Filtreler</span>
                    <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {showFilters && (
                <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-neutral-500 italic">Gelişmiş filtreleme seçenekleri çok yakında.</p>
                </div>
            )}

            {/* Communities Table Header with Counter */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="text-sm font-medium text-neutral-500">
                    {filteredCommunities.length} / {communities.length} topluluk gösteriliyor
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden mt-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                            <tr>
                                <th className="px-6 py-4">Topluluk</th>
                                <th className="px-6 py-4">Kategori</th>
                                <th className="px-6 py-4">Yönetici</th>
                                <th className="px-6 py-4">İstatistikler</th>
                                <th className="px-6 py-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {filteredCommunities.length > 0 ? filteredCommunities.map((community) => (
                                <tr key={community.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex-shrink-0 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                                {community.logo_url ? (
                                                    <img src={community.logo_url} alt={community.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                                        <Building2 size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <Link 
                                                    href={`/community/${community.id}`}
                                                    className="font-bold text-neutral-900 dark:text-white hover:text-primary transition-colors block"
                                                >
                                                    {community.name}
                                                </Link>
                                                <span className="text-xs text-neutral-400 font-mono">ID: {community.id.substring(0, 8)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                                            {community.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-neutral-900 dark:text-white">{community.admin_name}</span>
                                            <span className="text-xs text-neutral-500">Yönetici</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400" title="Takipçi Sayısı">
                                                <Users size={14} />
                                                <span className="font-bold">{community.follower_count}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400" title="Etkinlik Sayısı">
                                                <Calendar size={14} />
                                                <span className="font-bold">{community.event_count}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link 
                                                href={`/dashboard?communityId=${community.id}`}
                                                className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                                title="Panelini Görüntüle"
                                            >
                                                <Settings size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(community.id)}
                                                className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                                                title="Topluluğu Sil"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500 italic">
                                        Topluluk bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
