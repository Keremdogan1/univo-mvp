'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Activity, Ban, Flag, Settings, LogOut } from 'lucide-react';

export default function AdminSidebar() {
    const pathname = usePathname();

    const menuItems = [
        { href: '/admin', label: 'Kullanıcılar', icon: Users },
        { href: '/admin/voices', label: 'Paylaşımlar', icon: Activity },
        { href: '/admin/logs', label: 'Admin Hareketleri', icon: Activity },
        { href: '/admin/banned', label: 'Yasaklılar', icon: Ban },
        { href: '/admin/reports', label: 'Şikayetler', icon: Flag },
        { href: '/admin/settings', label: 'Ayarlar', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 hidden md:flex flex-col h-screen sticky top-0">
            <div className="px-4 py-5 border-b border-neutral-100 dark:border-neutral-800 flex flex-col items-center justify-center text-center">
                <h1 className="text-xs font-bold font-serif text-black dark:text-white uppercase tracking-tight">
                    YÖNETİM PANELİ
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                                    : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
                <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                >
                    <LogOut size={18} />
                    <span>Çıkış Yap</span>
                </Link>
            </div>
        </aside>
    );
}
