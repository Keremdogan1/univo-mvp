'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search, Ban, CheckCircle, MoreHorizontal, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface User {
    id: string;
    full_name: string;
    student_id: string;
    department: string;
    is_banned: boolean;
    created_at: string;
    email?: string;
    ban_reason?: string;
    banned_by?: string;
}

interface Stats {
    totalUsers: number;
}

export default function AdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [banModalOpen, setBanModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [banReason, setBanReason] = useState('');

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
            return extracted;
        }

        // 3. Fallback to UUID
        return user.id.substring(0, 8) + '...';
    };

    const openBanModal = (user: User) => {
        setSelectedUser(user);
        setBanReason('');
        setBanModalOpen(true);
    };

    const handleBanSubmit = async () => {
        if (!selectedUser) return;
        if (!banReason.trim()) {
            toast.error('Lütfen bir yasaklama sebebi girin.');
            return;
        }

        await handleToggleBan(selectedUser.id, false, banReason); // is_banned currently false, so we are banning
        setBanModalOpen(false);
        setSelectedUser(null);
    };

    const handleToggleBan = async (userId: string, currentStatus: boolean, reason?: string) => {
        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle_ban', userId, isBanned: !currentStatus, reason: reason })
            });

            if (!res.ok) throw new Error('İşlem başarısız');

            const data = await res.json();
            toast.success(data.message);

            // Update local state
            setUsers(users.map(u => u.id === userId ? {
                ...u,
                is_banned: !currentStatus,
                ban_reason: !currentStatus ? reason : undefined,
                banned_by: !currentStatus ? 'Siz' : undefined
            } : u));
        } catch (err) {
            toast.error('İşlem sırasında hata oluştu.');
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.student_id?.toLowerCase().includes(search.toLowerCase()) ||
        u.department?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
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
                                        <Link href={`/admin/users/${user.id}`} className="font-medium text-neutral-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors block w-fit">
                                            {user.full_name}
                                        </Link>
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
                                            onClick={() => user.is_banned ? handleToggleBan(user.id, true) : openBanModal(user)}
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

            {/* Ban Modal */}
            {banModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-200 dark:border-neutral-700">
                        <div className="p-4 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-red-600">
                                <AlertTriangle size={20} /> Kullanıcıyı Yasakla
                            </h3>
                            <button onClick={() => setBanModalOpen(false)} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
                                <span className="font-bold text-neutral-900 dark:text-white">{selectedUser.full_name}</span> adlı kullanıcıyı yasaklamak üzeresiniz.
                            </p>
                            <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Yasaklama Sebebi</label>
                            <textarea
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                className="w-full h-32 p-3 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                placeholder="Gerekçe belirtiniz..."
                            ></textarea>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-700 flex justify-end gap-3">
                            <button
                                onClick={() => setBanModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleBanSubmit}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-lg shadow-red-600/20"
                            >
                                Yasakla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
