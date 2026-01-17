'use client';

import { useEffect, useState } from 'react';
import { Flag, Clock, AlertTriangle, CheckCircle, XCircle, ExternalLink, Eye, Search, Filter, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { REPORT_CATEGORIES } from '@/lib/constants';
import Link from 'next/link';

interface Report {
    id: string;
    reporter_id: string;
    content_type: 'post' | 'comment';
    content_id: string;
    category: string;
    reason: string | null;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    reviewed_by: string | null;
    created_at: string;
    reporter?: {
        full_name: string;
        avatar_url: string | null;
    };
}

export default function AdminReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'>('pending');
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/reports');
            if (!res.ok) throw new Error('Veriler alınamadı');
            const data = await res.json();
            setReports(data);
        } catch (err) {
            toast.error('Şikayetler yüklenirken hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const updateStatus = async (reportId: string, newStatus: string) => {
        try {
            const res = await fetch('/api/reports/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId, status: newStatus })
            });

            if (!res.ok) throw new Error('İşlem başarısız');

            toast.success('Durum güncellendi.');
            setReports(reports.map(r => r.id === reportId ? { ...r, status: newStatus as any } : r));
        } catch (err) {
            toast.error('Güncelleme sırasında hata oluştu.');
        }
    };

    const getCategoryLabel = (categoryId: string) => {
        return REPORT_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium"><Clock size={12} /> Bekliyor</span>;
            case 'reviewed':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium"><Eye size={12} /> İncelendi</span>;
            case 'resolved':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium"><CheckCircle size={12} /> Çözüldü</span>;
            case 'dismissed':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs font-medium"><XCircle size={12} /> Reddedildi</span>;
            default:
                return null;
        }
    };

    const filteredReports = reports.filter(r => {
        const matchesStatus = filter === 'all' ? true : r.status === filter;
        const matchesSearch = 
            r.reason?.toLowerCase().includes(search.toLowerCase()) ||
            r.reporter?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            getCategoryLabel(r.category).toLowerCase().includes(search.toLowerCase());
        
        return matchesStatus && matchesSearch;
    });

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

                <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-10 w-24 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg animate-pulse"></div>
                    ))}
                </div>

                <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 h-16"></div>
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="p-6 bg-white dark:bg-neutral-800 h-20 animate-pulse"></div>
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
                    <Flag className="text-orange-500" size={32} /> Şikayetler
                </h1>
                <p className="text-neutral-500 mt-1">Kullanıcılar tarafından bildirilen içerikler</p>
            </header>

            {/* Standardized Search & Filter Bar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Şikayetlerde ara (Kategori, not, kullanıcı)..."
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
                <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                        <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Durum Filtresi</label>
                        <div className="flex gap-2 flex-wrap">
                            {(['all', 'pending', 'reviewed', 'resolved', 'dismissed'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                        filter === f
                                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                                            : 'bg-white text-neutral-500 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700'
                                    }`}
                                >
                                    {f === 'all' ? 'Tümü' : f === 'pending' ? 'Bekleyenler' : f === 'reviewed' ? 'İncelenenler' : f === 'resolved' ? 'Çözülenler' : 'Reddedilenler'}
                                    {f !== 'all' && (
                                        <span className="ml-1.5 opacity-60 font-mono">
                                            {reports.filter(r => r.status === f).length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Reports Table Header with Counter */}
            <div className="flex items-center justify-between mb-2 px-1">
                <div className="text-sm font-medium text-neutral-500">
                    {filteredReports.length} / {reports.length} şikayet gösteriliyor
                </div>
            </div>

            {/* Reports Table */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden mt-2">
                {filteredReports.length === 0 ? (
                    <div className="p-12 text-center text-neutral-500">
                        <Flag size={48} className="mx-auto mb-4 opacity-30" />
                        <p>{search ? 'Aramanızla eşleşen şikayet bulunamadı.' : 'Bu kategoride şikayet bulunmuyor.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 font-medium border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th className="px-6 py-3">Tarih</th>
                                    <th className="px-6 py-3">Şikayet Eden</th>
                                    <th className="px-6 py-3">Tür</th>
                                    <th className="px-6 py-3">Kategori</th>
                                    <th className="px-6 py-3">Not</th>
                                    <th className="px-6 py-3">Durum</th>
                                    <th className="px-6 py-3 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-neutral-500">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} />
                                                {new Date(report.created_at).toLocaleDateString('tr-TR')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-neutral-900 dark:text-white">
                                                {report.reporter?.full_name || 'Anonim'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                report.content_type === 'post' 
                                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' 
                                                    : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400'
                                            }`}>
                                                {report.content_type === 'post' ? 'Gönderi' : 'Yorum'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium">
                                                {getCategoryLabel(report.category)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 max-w-xs truncate">
                                            {report.reason || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(report.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {report.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(report.id, 'reviewed')}
                                                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                        >
                                                            İncele
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(report.id, 'dismissed')}
                                                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                        >
                                                            Reddet
                                                        </button>
                                                    </>
                                                )}
                                                {report.status === 'reviewed' && (
                                                    <button
                                                        onClick={() => updateStatus(report.id, 'resolved')}
                                                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                    >
                                                        Çözüldü
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
