'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export type Theme = 'light' | 'dark' | 'system';
export type ColorTheme = 'default' | 'blue' | 'green' | 'purple' | 'orange';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('default');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const lastSyncedRef = React.useRef<string>('');

  // Initial load from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      const savedColorTheme = localStorage.getItem('colorTheme') as ColorTheme | null;
      
      if (savedTheme) setTheme(savedTheme);
      if (savedColorTheme) setColorTheme(savedColorTheme);
    } catch (e) {
      console.warn('LocalStorage not available');
    }
    setIsInitialLoad(false);
  }, []);

  // Update from profile when it loads (only if different)
  useEffect(() => {
    if (profile && (profile as any).theme_preference) {
      const { theme: dbTheme, colorTheme: dbColorTheme } = (profile as any).theme_preference;
      
      if (dbTheme && dbTheme !== theme) {
        setTheme(dbTheme);
      }
      if (dbColorTheme && dbColorTheme !== colorTheme) {
        setColorTheme(dbColorTheme);
      }
      // Initialize synced ref to avoid immediate re-sync
      lastSyncedRef.current = JSON.stringify({ theme: dbTheme, colorTheme: dbColorTheme });
    }
  }, [profile]);

  // Handle Light/Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;

    const updateTheme = () => {
      let activeTheme: 'light' | 'dark';

      if (theme === 'system') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        activeTheme = theme;
      }

      setResolvedTheme(activeTheme);
      root.classList.remove('light', 'dark');
      root.classList.add(activeTheme);

      try {
        if (theme !== 'system') {
          localStorage.setItem('theme', theme);
        } else {
          localStorage.removeItem('theme');
        }
      } catch (e) {}

      // Sync to DB (debounced/checked)
      if (!isInitialLoad && user) {
        syncThemeToDb(theme, colorTheme);
      }
    };

    updateTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, user]);

  // Handle Color Theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme-color', colorTheme);
    try {
      localStorage.setItem('colorTheme', colorTheme);
    } catch (e) {}

    // Sync to DB
    if (!isInitialLoad && user) {
      syncThemeToDb(theme, colorTheme);
    }
  }, [colorTheme, user]);

  const syncThemeToDb = async (t: Theme, ct: ColorTheme) => {
    if (!user) return;
    
    // Check if truly different from last sync
    const syncKey = JSON.stringify({ theme: t, colorTheme: ct });
    if (lastSyncedRef.current === syncKey) return;
    
    lastSyncedRef.current = syncKey;

    try {
      await supabase
        .from('profiles')
        .update({
          theme_preference: { theme: t, colorTheme: ct }
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error syncing theme to DB:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, colorTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
