'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, BarChart2, Settings, LogOut, PlusCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SUPER_ADMIN_NAMES } from '@/lib/constants';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
        router.push('/login');
        return;
    }

    async function checkAdminStatus() {
        const isSuperAdmin = profile?.full_name && SUPER_ADMIN_NAMES.includes(profile.full_name);
        
        // 1. Check if user owns a community
        const { data, error } = await supabase
            .from('communities')
            .select('*')
            .eq('admin_id', user?.id)
            .limit(1); 
        
        if (data && data.length > 0) {
            setCommunity(data[0]);
        } else if (isSuperAdmin) {
            // 2. If Super Admin but no owned community, fallback to "Univo" community
            const { data: defaultComm } = await supabase
                .from('communities')
                .select('*')
                .ilike('name', '%Univo%')
                .limit(1);
            
            if (defaultComm && defaultComm.length > 0) {
                setCommunity(defaultComm[0]);
            }
        }
        setLoading(false);
    }
    checkAdminStatus();
  }, [user, authLoading, profile]);

  if (loading || authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-[#0a0a0a]">
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 border-[var(--primary-color)] dark:border-white"></div>
            <p className="text-neutral-600 dark:text-neutral-400 font-serif">Panel Yükleniyor...</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-[#0a0a0a] flex transition-colors">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-900 text-black dark:text-white border-r border-neutral-200 dark:border-neutral-800 fixed top-16 bottom-0 flex flex-col overflow-y-auto z-40 transition-colors">
        <div className="px-4 py-5 border-b border-neutral-200 dark:border-neutral-800">
           <h1 className="text-xs font-bold font-serif text-black dark:text-white uppercase tracking-tight text-center">
              TOPLULUK PANELİ
           </h1>
           {community && (
               <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider block mt-1">
                   {community.name}
               </span>
           )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
            <NavLink href="/dashboard" icon={<LayoutDashboard size={20} />} label="Genel Bakış" active={pathname === '/dashboard'} />
            <NavLink href="/dashboard/events" icon={<Calendar size={20} />} label="Etkinliklerim" active={pathname === '/dashboard/events'} />
            <NavLink href="/dashboard/analytics" icon={<BarChart2 size={20} />} label="Analiz & Rapor" active={pathname === '/dashboard/analytics'} />
            <NavLink href="/dashboard/settings" icon={<Settings size={20} />} label="Ayarlar" active={pathname === '/dashboard/settings'} />
        </nav>


      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
    return (
        <Link 
            href={href} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                active 
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm' 
                : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white'
            }`}
        >
            <span>{icon}</span>
            <span>{label}</span>
        </Link>
    );
}
