'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search, Ban, CheckCircle, MoreHorizontal } from 'lucide-react';

interface User {
    id: string;
    full_name: string;
    student_id: string;
    department: string;
    is_banned: boolean;
    created_at: string;
    email?: string;
}

interface Stats {
    totalUsers: number;
}

export default function AdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchData = async () => {
        try {
            const res = await fetch('/api/admin/data');
            if (!res.ok) throw new Error('Veri çekilemedi');
            const data = await res.json();
            setUsers(data.users);
            setStats(data.stats);
        } catch (err: any) {
            toast.error('Veriler yüklenirken hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getDisplayId = (user: User) => {
        // 1. If existing student_id/custom_id from DB, use it
        if (user.student_id) return user.student_id;

        // 2. Extract from email if available
        if (user.email) {
            const extracted = user.email.split('@')[0];
            // Optional regex to ensure it's "e123456" format if strictly needed, but general extraction is safer
            return extracted;
        }

        // 3. Fallback to UUID
        return user.id.substring(0, 8) + '...';
    };

    const handleToggleBan = async (userId: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle_ban', userId, isBanned: !currentStatus })
            });

            if (!res.ok) throw new Error('İşlem başarısız');

            const data = await res.json();
            toast.success(data.message);

            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
        } catch (err) {
            toast.error('İşlem sırasında hata oluştu.');
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.student_id?.toLowerCase().includes(search.toLowerCase()) ||
        u.department?.toLowerCase().includes(search.toLowerCase())
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
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Genel Bakış</h1>
                <p className="text-neutral-500">Sistem durumu ve kullanıcı yönetimi</p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <h3 className="text-sm font-medium text-neutral-500 mb-2">Toplam Kullanıcı</h3>
                    <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                </div>
                {/* Add more stats here later */}
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-4">
                    <h2 className="font-bold text-lg">Kullanıcılar</h2>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Ara..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 font-medium border-b border-neutral-200 dark:border-neutral-700">
                            <tr>
                                <th className="px-6 py-3">E-Posta</th>
                                <th className="px-6 py-3">Öğrenci No</th>
                                <th className="px-6 py-3">Bölüm</th>
                                <th className="px-6 py-3">Durum</th>
                                <th className="px-6 py-3 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-neutral-900 dark:text-white">{user.full_name}</div>
                                        <div className="text-xs text-neutral-500">{user.email || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded inline-block">
                                            {getDisplayId(user)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                        {user.department || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.is_banned ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                                <Ban size={12} /> Yasaklı
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                                <CheckCircle size={12} /> Aktif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleToggleBan(user.id, user.is_banned)}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${user.is_banned
                                                ? 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                                                : 'border-red-200 text-red-600 hover:bg-red-50'
                                                }`}
                                        >
                                            {user.is_banned ? 'Yasağı Kaldır' : 'Yasakla'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
