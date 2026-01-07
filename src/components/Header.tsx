'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, MessageCircle, Users, Building2, LayoutDashboard, User, Settings, LogOut } from 'lucide-react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCommunityAdmin, setIsCommunityAdmin] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const currentView = searchParams?.get('view') || 'community';

  // ... (existing code)



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
    return `flex items-center gap-2 font-medium transition-colors ${isActive ? 'text-[#C8102E]' : 'text-neutral-600 dark:text-neutral-400 hover:text-[#C8102E]'
      }`;
  };

  return (
    <header className="sticky top-0 z-[9999] bg-white dark:bg-[#0a0a0a] border-b border-neutral-200 dark:border-black dark:border-white transition-colors duration-300">
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
            <h1 className="text-2xl font-bold text-foreground dark:text-white font-serif tracking-tight group-hover:text-[#C8102E] transition-colors -ml-1">
              Univo
            </h1>
          </Link>

          {/* Center: Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 bg-neutral-100/50 dark:bg-neutral-800/50 backdrop-blur-sm px-5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700">
            <ul className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all duration-300 relative group overflow-hidden ${isActive
                        ? 'text-black dark:text-white font-bold bg-white dark:bg-black shadow-sm'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                        }`}
                    >
                      <item.icon size={18} className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                      <span className="text-sm font-medium relative z-10">{item.label}</span>
                      {!isActive && (
                        <span className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity rounded-full z-0"></span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right: Tools (Search, Auth, DarkMode, Menu) */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">

            {/* Dashboard Link (Desktop) - Subtle */}
            {user && canAccessDashboard && (
              <Link
                href="/dashboard"
                className={`hidden md:flex items-center justify-center p-2.5 rounded-full transition-all ${pathname?.startsWith('/dashboard')
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
              className="hidden md:block p-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-all hover:scale-105"
              aria-label="Search"
            >
              <SearchIcon size={20} />
            </button>

            {/* Notification Center (Desktop) - Prominent */}
            <div className="hidden md:block">
              <NotificationCenter />
            </div>

            {/* Auth Button (Desktop) */}
            <div className="hidden md:block pl-2">
              <AuthButton />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors relative w-10 h-10 flex items-center justify-center overflow-hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`absolute transition-all duration-300 transform ${isMenuOpen ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`}>
                <Menu size={24} className="text-neutral-900 dark:text-white" />
              </span>
              <span className={`absolute transition-all duration-300 transform ${isMenuOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`}>
                <X size={24} className="text-neutral-900 dark:text-white" />
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
            style={{ top: '64px' }} // Start below header
          />

          {/* Menu */}
          <div className="fixed top-16 left-0 w-full h-[calc(100vh-64px)] bg-white dark:bg-[#0a0a0a] border-b border-neutral-200 dark:border-white shadow-lg z-50 md:hidden animate-in slide-in-from-top-2 duration-200 overflow-y-auto">
            <nav className="flex flex-col p-6 space-y-6">

              {/* Top Actions Row */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                  className="flex-1 flex items-center gap-3 p-4 rounded-xl text-neutral-600 dark:text-neutral-400 font-serif font-bold text-base hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all group animate-in slide-in-from-bottom-2 fade-in duration-500 fill-mode-backwards"
                  style={{ animationDelay: '0ms' }}
                >
                  <SearchIcon size={20} className="group-hover:scale-110 transition-transform" />
                  <span>Ara</span>
                </button>

                <div
                  className="animate-in slide-in-from-bottom-2 fade-in duration-500 fill-mode-backwards"
                  style={{ animationDelay: '50ms' }}
                >
                  <AuthButton onNavigate={() => setIsMenuOpen(false)} />
                </div>
              </div>

              <div className="border-t-2 border-black dark:border-white my-4"></div>

              <div className="space-y-2">
                {navItems.map((item, index) => {
                  const isActive = currentView === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all font-serif font-bold text-lg animate-in slide-in-from-bottom-2 fade-in duration-500 fill-mode-backwards ${isActive
                        ? 'bg-white text-black dark:bg-black dark:text-white shadow-md'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                        }`}
                      style={{ animationDelay: `${(index + 2) * 75}ms` }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon size={24} className={isActive ? 'animate-pulse' : ''} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {user && canAccessDashboard && (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all font-serif font-bold text-lg animate-in slide-in-from-bottom-2 fade-in duration-500 fill-mode-backwards ${pathname?.startsWith('/dashboard')
                      ? 'bg-white text-black dark:bg-black dark:text-white shadow-md'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                      }`}
                    style={{ animationDelay: '350ms' }}
                  >
                    <LayoutDashboard size={24} />
                    <span>Kontrol Paneli</span>
                  </Link>
                )}
              </div>

            </nav>
          </div>
        </>
      )}

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={<div className="h-16 bg-white dark:bg-[#0a0a0a] border-b-2 border-black dark:border-white"></div>}>
      <HeaderContent />
    </Suspense>
  );
}
