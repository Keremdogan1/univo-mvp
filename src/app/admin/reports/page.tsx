'use client';

import { useEffect, useState } from 'react';
import { Flag, Clock, AlertTriangle, CheckCircle, XCircle, ExternalLink, Eye } from 'lucide-react';
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

    const filteredReports = filter === 'all' ? reports : reports.filter(r => r.status === filter);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-black/10 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-neutral-900 dark:text-white">
                    <Flag className="text-orange-500" /> Şikayetler
                </h1>
                <p className="text-neutral-500 mt-2">Kullanıcılar tarafından bildirilen içerikler</p>
            </header>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {(['all', 'pending', 'reviewed', 'resolved', 'dismissed'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            filter === f
                                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                    >
                        {f === 'all' ? 'Tümü' : f === 'pending' ? 'Bekleyenler' : f === 'reviewed' ? 'İncelenenler' : f === 'resolved' ? 'Çözülenler' : 'Reddedilenler'}
                        {f !== 'all' && (
                            <span className="ml-2 text-xs opacity-70">
                                ({reports.filter(r => r.status === f).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Reports Table */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                {filteredReports.length === 0 ? (
                    <div className="p-12 text-center text-neutral-500">
                        <Flag size={48} className="mx-auto mb-4 opacity-30" />
                        <p>Bu kategoride şikayet bulunmuyor.</p>
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
