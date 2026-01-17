'use client';

import { useEffect, useState } from 'react';
import { Ban, CheckCircle, Search, Filter, ChevronDown } from 'lucide-react';
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
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [reasonFilter, setReasonFilter] = useState('all');

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

    const filteredUsers = users.filter(u => {
        const matchesSearch =  
            u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            u.student_id?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase());
        
        const matchesReason = reasonFilter === 'all' ? true : u.ban_reason === reasonFilter;
        
        return matchesSearch && matchesReason;
    });

    const uniqueReasons = [...new Set(users.map(u => u.ban_reason).filter(Boolean))];

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
                    <Ban className="text-red-600" size={32} /> Yasaklı Kullanıcılar
                </h1>
                <p className="text-neutral-500 mt-1">Platformdan uzaklaştırılan kullanıcıların listesi</p>
            </header>

            {/* Standardized Search & Filter Bar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Kullanıcı ara (İsim, e-posta, ID)..."
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
                <div className="mb-6 p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Yasaklanma Sebebi</label>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setReasonFilter('all')}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                    reasonFilter === 'all' 
                                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' 
                                    : 'bg-white text-neutral-500 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700'
                                }`}
                            >
                                Tümü
                            </button>
                            {uniqueReasons.map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => setReasonFilter(reason!)}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                        reasonFilter === reason 
                                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' 
                                        : 'bg-white text-neutral-500 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700'
                                    }`}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Banned Table Header with Counter */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="text-sm font-medium text-neutral-500">
                    {filteredUsers.length} / {users.length} yasaklı kullanıcı gösteriliyor
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden mt-4">

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
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-neutral-500 italic">
                                    {search ? 'Aramanızla eşleşen kullanıcı bulunamadı.' : 'Henüz yasaklı kullanıcı yok.'}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
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
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-colors"
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
