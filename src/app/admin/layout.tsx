import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Users, Settings, LogOut, Activity, Ban, Flag } from 'lucide-react';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // ... (cookie check) ...
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('univo_admin_session');

    if (!sessionCookie) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 hidden md:flex flex-col">
                <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
                    <h1 className="text-xl font-bold font-serif tracking-wide text-black dark:text-white uppercase">
                        YÖNETİM PANELİ
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm transition-all duration-200">
                        <Users size={18} />
                        <span>Kullanıcılar</span>
                    </Link>
                    <Link href="/admin/logs" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white transition-all duration-200">
                        <Activity size={18} />
                        <span>Admin Hareketleri</span>
                    </Link>
                    <Link href="/admin/banned" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white transition-all duration-200">
                        <Ban size={18} />
                        <span>Yasaklılar</span>
                    </Link>
                    <Link href="/admin/reports" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white transition-all duration-200">
                        <Flag size={18} />
                        <span>Şikayetler</span>
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white transition-all duration-200">
                        <Settings size={18} />
                        <span>Ayarlar</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
                    {/* Logout handled by client side logic usually, but here just a link to home */}
                    <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200">
                        <LogOut size={18} />
                        <span>Çıkış Yap</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-screen">
                {children}
            </main>
        </div>
    );
}
