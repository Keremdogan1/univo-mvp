'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, Users, FileText, Activity, Shield, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminUserDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`/api/admin/users/${params.id}`);
                if (!res.ok) throw new Error('Kullanıcı verisi alınamadı');
                const result = await res.json();
                setData(result);
            } catch (err) {
                toast.error('Veri yüklenirken hata oluştu');
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [params.id]);

    if (isLoading) return <div className="p-8">Yükleniyor...</div>;
    if (!data || !data.profile) return <div className="p-8">Kullanıcı bulunamadı.</div>;

    const { profile, communities, posts, logs } = data;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-neutral-500 hover:text-black mb-6 transition-colors font-medium text-sm">
                <ArrowLeft size={16} /> Geri Dön
            </button>

            {/* Header Profile Card */}
            <div className="bg-white dark:bg-neutral-800 p-8 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm mb-8 flex items-start justify-between">
                <div className="flex gap-6">
                    <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center text-neutral-400">
                        <User size={48} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">{profile.full_name}</h1>
                        <div className="flex flex-col gap-1 text-sm text-neutral-500">
                            <span className="font-mono bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded w-fit">ID: {profile.id}</span>
                            <span>{profile.email}</span>
                            <span>{profile.department || 'Bölüm Yok'}</span>
                        </div>
                        <div className="mt-4">
                            {profile.is_banned ? (
                                <span className="text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full text-xs font-bold border border-red-100 dark:border-red-900/30">
                                    YASAKLI ({profile.ban_reason})
                                </span>
                            ) : (
                                <span className="text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full text-xs font-bold border border-green-100 dark:border-green-900/30">
                                    AKTİF
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Communities */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <Users size={20} /> Topluluklar
                        </h3>
                        <div className="space-y-4">
                            {communities.admin.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-neutral-400 mb-2">Yönetici Olduğu</h4>
                                    <ul className="space-y-2">
                                        {communities.admin.map((c: any) => (
                                            <li key={c.id} className="text-sm font-medium">{c.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div>
                                <h4 className="text-xs font-bold uppercase text-neutral-400 mb-2">Üye Olduğu</h4>
                                {communities.following.length === 0 ? <p className="text-sm text-neutral-500">Hiçbir topluluğa üye değil.</p> : (
                                    <ul className="space-y-2">
                                        {communities.following.map((c: any) => (
                                            <li key={c.id} className="text-sm text-neutral-600 dark:text-neutral-300">{c.name}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Admin Actions Logs (Targeting this user) */}
                    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <Shield size={20} /> İlgili Admin İşlemleri
                        </h3>
                        {logs.length === 0 ? <p className="text-sm text-neutral-500">Kayıt yok.</p> : (
                            <div className="space-y-4">
                                {logs.map((log: any) => (
                                    <div key={log.id} className="text-sm border-b border-neutral-100 dark:border-neutral-700 last:border-0 pb-2">
                                        <div className="flex justify-between">
                                            <span className="font-bold">{log.action}</span>
                                            <span className="text-xs text-neutral-400">{new Date(log.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-neutral-500 mt-1">{log.details}</p>
                                        <div className="text-xs text-neutral-400 mt-1">Yapan: {log.admin_name}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Posts */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6 max-h-[600px] overflow-y-auto">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <FileText size={20} /> Son Paylaşımlar
                    </h3>
                    {posts.length === 0 ? <p className="text-sm text-neutral-500">Paylaşım yok.</p> : (
                        <div className="space-y-4">
                            {posts.map((post: any) => (
                                <div key={post.id} className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold bg-white dark:bg-black px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700">
                                            {post.communities?.name || 'Genel'}
                                        </span>
                                        <span className="text-xs text-neutral-400">{new Date(post.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{post.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
