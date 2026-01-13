'use client';

import { useEffect, useState } from 'react';
import { Ban, CheckCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

interface User {
    id: string;
    full_name: string;
    student_id: string;
    department: string;
    is_banned: boolean;
    ban_reason?: string;
    banned_by?: string;
    email?: string;
}

export default function BannedUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBannedUsers = async () => {
        try {
            const res = await fetch('/api/admin/banned');
            if (!res.ok) throw new Error('Veri çekilemedi');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            toast.error('Yasaklı kullanıcılar yüklenemedi.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBannedUsers();
    }, []);

    const handleUnban = async (userId: string) => {
        if (!confirm('Kullanıcının yasağını kaldırmak istediğinize emin misiniz?')) return;

        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle_ban', userId, isBanned: false })
            });

            if (!res.ok) throw new Error('İşlem başarısız');

            toast.success('Kullanıcı yasağı kaldırıldı.');
            fetchBannedUsers(); // Refresh list
        } catch (err) {
            toast.error('İşlem sırasında hata oluştu.');
        }
    };

    if (isLoading) return <div className="p-8">Yükleniyor...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-neutral-900 dark:text-white">
                    <Ban className="text-red-600" /> Yasaklı Kullanıcılar
                </h1>
                <p className="text-neutral-500 mt-2">Platformdan uzaklaştırılan kullanıcıların listesi</p>
            </header>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 font-medium border-b border-neutral-200 dark:border-neutral-700">
                        <tr>
                            <th className="px-6 py-3">Kullanıcı</th>
                            <th className="px-6 py-3">Yasaklanma Sebebi</th>
                            <th className="px-6 py-3">Yasaklayan</th>
                            <th className="px-6 py-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                                    Henüz yasaklı kullanıcı yok.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-neutral-900 dark:text-white">{user.full_name}</div>
                                        <div className="text-xs text-neutral-500">{user.student_id || user.email || 'ID Yok'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-red-600 font-medium bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-xs">
                                            {user.ban_reason || 'Sebep belirtilmemiş'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                        {user.banned_by || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleUnban(user.id)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition-colors"
                                        >
                                            <CheckCircle size={14} className="text-green-600" /> Yasağı Kaldır
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
