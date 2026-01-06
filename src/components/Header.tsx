'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, MessageCircle, Users, Building2, LayoutDashboard } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import AuthButton from './AuthButton';
import GlobalSearch from './search/GlobalSearch';
import { Search as SearchIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSearchParams, usePathname } from 'next/navigation';
import DarkModeToggle from './DarkModeToggle';

function HeaderContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCommunityAdmin, setIsCommunityAdmin] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useAuth();
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
    return `flex items-center gap-2 font-medium transition-colors ${
      isActive ? 'text-[#C8102E]' : 'text-neutral-600 dark:text-neutral-400 hover:text-[#C8102E]'
    }`;
  };

  return (
    <header className="sticky top-0 z-[9999] bg-white dark:bg-[#0a0a0a] border-b border-neutral-200 dark:border-black dark:border-white transition-colors duration-300">
      <div className="w-full px-4 md:container md:mx-auto">
        <div className="flex items-center justify-between h-16 max-w-full relative">

          {/* Left: Logo */}
          <Link href="/?view=voice" className="flex items-center gap-0 shrink-0">
            <div className="relative w-16 h-16 overflow-hidden bg-transparent shrink-0">
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
          <nav className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 bg-neutral-100/50 dark:bg-neutral-800/50 backdrop-blur-sm px-6 py-2 rounded-full border border-neutral-200 dark:border-neutral-700">
            <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 relative group overflow-hidden ${
                      isActive 
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
             
            {/* Search */}
            <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none"
                aria-label="Search"
            >
                <SearchIcon size={20} />
            </button>

            {/* Dashboard Link (Desktop) */}
            {user && (
                <Link
                    href="/dashboard"
                    className={`hidden md:flex items-center justify-center p-2.5 rounded-full transition-colors ${
                        pathname?.startsWith('/dashboard') 
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' 
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                    title="Kontrol Paneli"
                >
                    <LayoutDashboard size={20} />
                </Link>
            )}

            {/* Dark Mode */}
            <div className="border-l border-neutral-200 dark:border-neutral-800 pl-2 ml-1">
                <DarkModeToggle />
            </div>

            {/* Auth Button (Desktop) */}
            <div className="hidden md:block pl-2">
                <AuthButton />
            </div>
            
            {/* Mobile Menu Button */}
            <button
                className="md:hidden p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
            >
                {isMenuOpen ? <X size={24} className="text-neutral-900 dark:text-white" /> : <Menu size={24} className="text-neutral-900 dark:text-white" />}
            </button>
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
              <div className="absolute top-16 left-0 w-full bg-white dark:bg-[#0a0a0a] border-b border-neutral-200 dark:border-white shadow-lg z-50 md:hidden animate-in slide-in-from-top-2 duration-200">
                <nav className="flex flex-col gap-4 p-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={getLinkClass(item.id)}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                   {user && (
                        <Link
                            href="/dashboard"
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center gap-2 font-medium transition-colors ${
                                pathname?.startsWith('/dashboard') 
                                ? 'text-[#C8102E]' 
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-[#C8102E]'
                            }`}
                        >
                            <LayoutDashboard size={20} />
                            <span>Kontrol Paneli</span>
                        </Link>
                    )}
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <AuthButton />
                  </div>
                </nav>
              </div>
          </>
        )}
      </div>
      
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
