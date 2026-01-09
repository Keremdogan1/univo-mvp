'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, MessageCircle, Users, Building2, LayoutDashboard, User, Settings, LogOut, Globe, Radio } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import AuthButton from './AuthButton';
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
  const [isCommunityAdmin, setIsCommunityAdmin] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const currentView = searchParams?.get('view') || 'community';



  // ... (existing code)

  const [isScrolled, setIsScrolled] = useState(false);
  const [localProfile, setLocalProfile] = useState<any>(null); // Renamed to avoid conflict with useAuth's profile
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      getProfile();
      fetchUnreadCount();

      // Subscribe to notifications
      const channel = supabase
        .channel(`header_notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const getProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      setLocalProfile(data);
  };

  const fetchUnreadCount = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)
      .eq('read', false);
    setUnreadCount(count || 0);
  };

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




      <header className={`hidden lg:block sticky top-0 z-[9999] bg-white dark:bg-neutral-900 border-b border-black dark:border-white transition-all duration-300 ${!isAtTop ? 'md:translate-y-0 -translate-y-full' : ''}`}>
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
            <nav className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 bg-neutral-100/50 dark:bg-neutral-800/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-black dark:border-white">
              <ul className="flex items-center gap-0.5">
                {navItems.map((item) => {
                  const isActive = pathname === '/' && currentView === item.id;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={(e) => item.href === '#' && e.preventDefault()}
                        className={`flex items-center gap-1.5 px-3 py-2 transition-all duration-200 relative group ${isActive
                          ? 'text-[var(--primary-color)] font-bold'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-[var(--primary-color)] font-medium'
                          }`}
                      >
                        <item.icon size={16} className={`relative z-10 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="text-xs relative z-10">{item.label}</span>

                        {/* Active Underline */}
                        {isActive && (
                          <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-[var(--primary-color)] rounded-full animate-in fade-in zoom-in duration-200"></span>
                        )}

                        {/* Hover Underline */}
                        <span className={`absolute bottom-0 left-1 right-1 h-0.5 bg-[var(--primary-color)] rounded-full transition-all duration-200 ${isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-50 group-hover:scale-x-75'}`}></span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Right: Tools (Search, Auth, DarkMode, Menu) */}
            <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">

              {/* Dashboard Link (Desktop) - Subtle */}
              {user && canAccessDashboard && (
                <Link
                  href="/dashboard"
                  className={`hidden lg:flex items-center justify-center p-2 rounded-full transition-all ${pathname?.startsWith('/dashboard')
                    ? 'bg-neutral-100 text-black dark:bg-neutral-800 dark:text-white shadow-sm font-bold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                    }`}
                  title="Kontrol Paneli"
                >
                  <LayoutDashboard size={18} />
                </Link>
              )}



              {/* Search (Desktop) - Prominent */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('univo-search-toggle'))}
                className="hidden lg:block p-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-all hover:scale-105"
                aria-label="Search"
              >
                <SearchIcon size={18} />
              </button>

              {/* Notification Center (Desktop) - Prominent */}
              <div className="hidden lg:block">
                <NotificationCenter />
              </div>

              {/* Auth Button (Desktop) */}
              <div className="hidden lg:block pl-1">
                <AuthButton />
              </div>

              {/* Mobile Header Actions (Search) */}
              <div className="flex lg:hidden items-center gap-2">
                {/* Mobile Notification Center */}
                <NotificationCenter />

                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('univo-search-toggle'))}
                  className="p-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-all"
                >
                  <SearchIcon size={24} />
                </button>
                {/* AuthButton removed from mobile header */}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Moved outside header to prevent transform issues */}
      {/* Mobile Bottom Navigation - Shows on mobile only (below lg) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-black dark:border-white safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-center h-16 w-full px-2">
          <ul className="grid grid-cols-5 gap-0 w-full h-full max-w-md mx-auto">
            {navItems.slice(0, 2).map((item) => {
              const isActive = pathname === '/' && currentView === item.id;
              return (
                <li key={item.id} className="flex justify-center items-center h-full">
                  <Link
                    href={item.href}
                    className={`relative flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-300 active:scale-95 ${isActive ? 'text-[var(--primary-color,#C8102E)]' : 'text-neutral-400 dark:text-neutral-500'
                      }`}
                  >
                    <item.icon size={22} className="transition-transform duration-300" strokeWidth={isActive ? 2.5 : 2} />
                    <span className={`text-[10px] font-bold uppercase tracking-tight text-center leading-none transition-all duration-300`}>
                      {item.label}
                    </span>
                    {/* Animated Underline */}
                    <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-[var(--primary-color,#C8102E)] rounded-full transition-all duration-300 ${isActive ? 'w-8 opacity-100' : 'w-0 opacity-0'}`}></span>
                  </Link>
                </li>
              );
            })}

            {/* Middle: Search Button */}
            <li className="flex justify-center items-center h-full">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('univo-search-toggle'))}
                className="relative flex flex-col items-center justify-center w-full h-full gap-0.5 text-neutral-400 dark:text-neutral-500 active:scale-95 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-1">
                  <SearchIcon size={20} />
                </div>
              </button>
            </li>

            {navItems.slice(2).map((item) => {
               const isActive = pathname === '/' && currentView === item.id;
               return (
                <li key={item.id} className="flex justify-center items-center h-full">
                  <Link
                    href={item.href}
                    className={`relative flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-300 active:scale-95 ${isActive ? 'text-[var(--primary-color,#C8102E)]' : 'text-neutral-400 dark:text-neutral-500'
                      }`}
                  >
                    <item.icon size={22} className="transition-transform duration-300" strokeWidth={isActive ? 2.5 : 2} />
                    <span className={`text-[10px] font-bold uppercase tracking-tight text-center leading-none transition-all duration-300`}>
                       {item.label}
                    </span>
                    {/* Animated Underline */}
                    <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-[var(--primary-color,#C8102E)] rounded-full transition-all duration-300 ${isActive ? 'w-8 opacity-100' : 'w-0 opacity-0'}`}></span>
                  </Link>
                </li>
               );
            })}

            {/* Profile Link (4th item) */}
            <li className="flex justify-center items-center h-full">
              <Link
                href={user ? `/profile/${user.id}` : '/login'}
                className={`relative flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-300 active:scale-95 ${pathname?.startsWith('/profile') || pathname === '/login' ? 'text-[var(--primary-color,#C8102E)]' : 'text-neutral-400 dark:text-neutral-500'
                  }`}
              >
                {user ? (
                  <div className="relative">
                    {profile?.avatar_url ? (
                      <div className={`relative w-6 h-6 rounded-full overflow-hidden border-2 ${pathname?.startsWith('/profile') ? 'border-[var(--primary-color,#C8102E)]' : 'border-transparent'}`}>
                        <Image
                          src={profile.avatar_url}
                          alt="Profile"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs bg-[var(--primary-color,#C8102E)] shadow-sm">
                        {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Notification Dot - Shows only when unreadCount > 0 */}
                    {unreadCount > 0 && (
                       <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 z-50">
                          <span 
                            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                            style={{ backgroundColor: 'var(--primary-color)' }}
                          ></span>
                          <span 
                            className="relative inline-flex rounded-full h-2.5 w-2.5 ring-2 ring-white dark:ring-black"
                            style={{ backgroundColor: 'var(--primary-color)' }}
                          ></span>
                       </span>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <User size={22} strokeWidth={pathname?.startsWith('/profile') || pathname === '/login' ? 2.5 : 2} />
                  </div>
                )}
                <span className="text-[10px] font-bold uppercase tracking-tight text-center leading-none">
                  {user ? 'Profil' : 'Giriş'}
                </span>
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-[var(--primary-color,#C8102E)] rounded-full transition-all duration-300 ${pathname?.startsWith('/profile') || pathname === '/login' ? 'w-8 opacity-100' : 'w-0 opacity-0'}`}></span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}

export default function Header() {
  return (
    <Suspense fallback={<div className="h-16 bg-white dark:bg-[#0a0a0a] border-b border-black dark:border-white"></div>}>
      <HeaderContent />
    </Suspense>
  );
}
