'use client';

import { useEffect, useState } from 'react';
import { Activity, Clock } from 'lucide-react';

interface AuditLog {
    id: string;
    admin_name: string;
    action: string;
    details: string;
    created_at: string;
}

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('/api/admin/logs');
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data);
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (isLoading) return <div className="p-8">Yükleniyor...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-neutral-900 dark:text-white">
                    <Activity /> Admin Hareketleri
                </h1>
                <p className="text-neutral-500 mt-2">Sistemdeki tüm yönetici işlemleri</p>
            </header>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 font-medium border-b border-neutral-200 dark:border-neutral-700">
                        <tr>
                            <th className="px-6 py-3">Tarih</th>
                            <th className="px-6 py-3">Admin</th>
                            <th className="px-6 py-3">İşlem</th>
                            <th className="px-6 py-3">Detaylar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                <td className="px-6 py-4 whitespace-nowrap text-neutral-500">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} />
                                        {new Date(log.created_at).toLocaleString('tr-TR')}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">
                                    <span className="bg-black text-white dark:bg-white dark:text-black px-2 py-1 rounded text-xs font-bold">
                                        {log.admin_name}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${log.action.includes('BAN') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                    {log.details}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
