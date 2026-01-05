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
      isActive ? 'text-[#C8102E]' : 'text-neutral-600 hover:text-[#C8102E]'
    }`;
  };

  return (
    <header className="sticky top-0 z-[9999] bg-white border-b border-neutral-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/?view=voice" className="flex items-center gap-0">
            <div className="relative w-16 h-16 overflow-hidden">
                <Image 
                    src="/logo_black.png" 
                    alt="Univo Logo" 
                    fill 
                    className="object-cover"
                />
            </div>
            <h1 className="text-2xl font-bold text-foreground font-serif tracking-tight group-hover:text-[#C8102E] transition-colors -ml-1">
              Univo
            </h1>
          </Link>

          
          {/* Search Trigger (Mobile & Desktop) */}
          <div className="flex items-center gap-4">
             {/* Desktop Navigation */}
             <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={getLinkClass(item.id)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
            {user && (
                <Link
                    href="/dashboard"
                    className={`flex items-center gap-2 font-medium transition-colors ${
                        pathname?.startsWith('/dashboard') 
                        ? 'text-[#C8102E]' 
                        : 'text-neutral-600 hover:text-[#C8102E]'
                    }`}
                >
                    <LayoutDashboard size={20} />
                </Link>
            )}
            <div className="hidden md:block">
                <AuthButton />
            </div>
            </nav>
            
            <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
                aria-label="Search"
            >
                <SearchIcon size={20} />
            </button>
            
            {/* Mobile Menu Button */}
            <button
                className="md:hidden p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
            >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200">
            <nav className="flex flex-col gap-4">
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
              <div className="pt-2 border-t border-neutral-200">
                <AuthButton />
              </div>
            </nav>
          </div>
        )}
      </div>
      
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={<div className="h-16 bg-white border-b border-neutral-200"></div>}>
      <HeaderContent />
    </Suspense>
  );
}
