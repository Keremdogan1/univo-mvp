'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, MessageCircle, Users, Building2, LayoutDashboard, User, Settings, LogOut, Globe, Radio } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import AuthButton from './AuthButton';
import GlobalSearch from './search/GlobalSearch';
import { Search as SearchIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

import NotificationCenter from './NotificationCenter';


const ALLOWED_DASHBOARD_USERS = [
  'Kerem Doğan',
  'Berke Şen',
  'Salih KIZILER'
];

function HeaderContent() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCommunityAdmin, setIsCommunityAdmin] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const currentView = searchParams?.get('view') || 'community';



  // ... (existing code)

  // Scroll detection for mobile header hide
  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsCommunityAdmin(false);
        return;
      }
      const { data } = await supabase.from('communities').select('id').eq('admin_id', user.id).maybeSingle();
      if (data) setIsCommunityAdmin(true);
    }
    checkAdmin();
  }, [user]);

  const canAccessDashboard = isCommunityAdmin || (profile?.full_name && ALLOWED_DASHBOARD_USERS.includes(profile.full_name));

  const navItems = [
    {
      id: 'voice',
      label: 'Kampüsün Sesi',
      href: '/?view=voice',
      icon: MessageCircle
    },
    {
      id: 'community',
      label: 'Topluluk Meydanı',
      href: '/?view=community',
      icon: Users
    },
    {
      id: 'official',
      label: 'Resmi Gündem',
      href: '/?view=official',
      icon: Building2
    }
  ];

  const getLinkClass = (id: string) => {
    const isActive = currentView === id;
    return `flex items-center gap-2 font-medium transition-colors ${isActive ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400 hover:text-primary'
      }`;
  };

  // Hide header on login/register pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <>
      <header className={`sticky top-0 z-[9999] bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 transition-all duration-300 ${!isAtTop ? 'md:translate-y-0 -translate-y-full' : ''}`}>
        <div className="w-full px-4 md:container md:mx-auto">
          <div className="flex items-center justify-between h-16 max-w-full relative">

            {/* Left: Logo */}
            <Link href="/?view=voice" className="flex items-center gap-0 shrink-0">
              <div className="relative w-12 h-12 md:w-16 md:h-16 overflow-hidden bg-transparent shrink-0">
                <Image
                  src="/logo_black.png"
                  alt="Univo Logo"
                  fill
                  className="object-cover transition-all duration-300 dark:invert mix-blend-multiply dark:mix-blend-screen"
                />
              </div>
              <h1 className="text-2xl font-bold text-foreground dark:text-white font-serif tracking-tight group-hover:text-primary transition-colors -ml-1">
                Univo
              </h1>
            </Link>

            {/* Center: Desktop Navigation - Only show on large screens to avoid overlap */}
            <nav className="hidden xl:flex items-center justify-center absolute left-1/2 -translate-x-1/2 bg-neutral-100/50 dark:bg-neutral-800/50 backdrop-blur-sm px-5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700">
              <ul className="flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={(e) => item.href === '#' && e.preventDefault()}
                        className={`flex items-center gap-2 px-3.5 py-2 transition-all duration-200 relative group ${isActive
                          ? 'text-[var(--primary-color)] font-bold'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-[var(--primary-color)] font-medium'
                          }`}
                      >
                        <item.icon size={18} className={`relative z-10 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="text-sm relative z-10">{item.label}</span>

                        {/* Active Underline */}
                        {isActive && (
                          <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--primary-color)] rounded-full animate-in fade-in zoom-in duration-200"></span>
                        )}

                        {/* Hover Underline */}
                        <span className={`absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--primary-color)] rounded-full transition-all duration-200 ${isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-50 group-hover:scale-x-75'}`}></span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Right: Tools (Search, Auth, DarkMode, Menu) */}
            <div className="flex items-center gap-2 xl:gap-3 shrink-0">

              {/* Dashboard Link (Desktop) - Subtle */}
              {user && canAccessDashboard && (
                <Link
                  href="/dashboard"
                  className={`hidden xl:flex items-center justify-center p-2.5 rounded-full transition-all ${pathname?.startsWith('/dashboard')
                    ? 'bg-neutral-100 text-black dark:bg-neutral-800 dark:text-white shadow-sm font-bold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                    }`}
                  title="Kontrol Paneli"
                >
                  <LayoutDashboard size={20} />
                </Link>
              )}



              {/* Search (Desktop) - Prominent */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden xl:block p-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-all hover:scale-105"
                aria-label="Search"
              >
                <SearchIcon size={20} />
              </button>

              {/* Notification Center (Desktop) - Prominent */}
              <div className="hidden xl:block">
                <NotificationCenter />
              </div>

              {/* Auth Button (Desktop) */}
              <div className="hidden xl:block pl-2">
                <AuthButton />
              </div>

              {/* Mobile Header Actions (Search & Auth) */}
              <div className="flex xl:hidden items-center gap-2">
                {/* Mobile Notification Center */}
                <NotificationCenter />

                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-all"
                >
                  <SearchIcon size={24} />
                </button>
                <AuthButton />
              </div>
            </div>
          </div>
        </div>

        <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </header>

      {/* Mobile Bottom Navigation - Moved outside header to prevent transform issues */}
      {/* Mobile Bottom Navigation - Shows on mobile and tablet (below lg) */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-center h-16 w-full px-1">
          <ul className="flex justify-around items-center w-full h-full max-w-sm">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <li key={item.id} className="flex-1 flex justify-center items-center h-full">
                  <Link
                    href={item.href}
                    className={`relative flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-300 active:scale-95 ${isActive ? 'text-[var(--primary-color,#C8102E)]' : 'text-neutral-400 dark:text-neutral-500'
                      }`}
                  >
                    <item.icon size={20} className="transition-transform duration-300" strokeWidth={isActive ? 2.5 : 2} />
                    <span className={`text-[9px] font-bold uppercase tracking-tight text-center leading-none transition-all duration-300`}>
                      {item.label}
                    </span>
                    {/* Animated Underline */}
                    <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-[var(--primary-color,#C8102E)] rounded-full transition-all duration-300 ${isActive ? 'w-8 opacity-100' : 'w-0 opacity-0'}`}></span>
                  </Link>
                </li>
              );
            })}

            {/* Dashboard Link */}
            {user && canAccessDashboard && (
              <li className="flex-1 flex justify-center items-center h-full">
                <Link
                  href="/dashboard"
                  className={`relative flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-300 active:scale-95 ${pathname?.startsWith('/dashboard') ? 'text-[var(--primary-color,#C8102E)]' : 'text-neutral-400 dark:text-neutral-500'
                    }`}
                >
                  <LayoutDashboard size={20} strokeWidth={pathname?.startsWith('/dashboard') ? 2.5 : 2} />
                  <span className="text-[9px] font-bold uppercase tracking-tight text-center leading-none">Panel</span>
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-[var(--primary-color,#C8102E)] rounded-full transition-all duration-300 ${pathname?.startsWith('/dashboard') ? 'w-8 opacity-100' : 'w-0 opacity-0'}`}></span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </>
  );
}

export default function Header() {
  return (
    <Suspense fallback={<div className="h-16 bg-white dark:bg-[#0a0a0a] border-b-2 border-black dark:border-white"></div>}>
      <HeaderContent />
    </Suspense>
  );
}
