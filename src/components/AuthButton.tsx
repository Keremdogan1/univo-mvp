'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toTitleCase } from '@/lib/utils';

export default function AuthButton({ onNavigate }: { onNavigate?: () => void }) {
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    if (onNavigate) onNavigate();
    router.push('/');
    router.refresh();
  };

  if (!user) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        className="px-3 md:px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity !text-white bg-[var(--primary-color,#C8102E)] flex items-center gap-2 text-sm md:text-base"
      >
        <span className="hidden md:inline">Üniversitenle Giriş Yap</span>
        <span className="md:hidden">Giriş Yap</span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name || 'User'}
            className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
          />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs border border-transparent bg-[var(--primary-color,#C8102E)]">
            {(profile?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200 hidden md:block">
          {toTitleCase(profile?.full_name) || 'User'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 max-w-[90vw] bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-800 py-2 z-50">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{profile?.full_name}</p>
            {profile?.department && (
              <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-1 truncate">{profile.department}</p>
            )}
          </div>

          <Link
            href={`/profile/${user.id}`}
            onClick={() => {
              setIsOpen(false);
              if (onNavigate) onNavigate();
            }}
            className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <User size={18} className="text-neutral-600 dark:text-neutral-400" />
            <span className="text-sm text-neutral-700 dark:text-neutral-200">Profilim</span>
          </Link>

          <Link
            href="/settings"
            onClick={() => {
              setIsOpen(false);
              if (onNavigate) onNavigate();
            }}
            className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Settings size={18} className="text-neutral-600 dark:text-neutral-400" />
            <span className="text-sm text-neutral-700 dark:text-neutral-200">Ayarlar</span>
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
          >
            <LogOut size={18} className="text-neutral-600 dark:text-neutral-400" />
            <span className="text-sm text-neutral-700 dark:text-neutral-200">Çıkış Yap</span>
          </button>
        </div>
      )}
    </div>
  );
}
