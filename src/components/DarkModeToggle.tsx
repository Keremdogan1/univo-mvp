'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-24 h-9 bg-neutral-100 dark:bg-neutral-800 rounded-full animate-pulse" />;

  return (
    <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-full p-1 border border-neutral-200 dark:border-neutral-700">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-full transition-all duration-300 ${
          theme === 'light' 
            ? 'bg-white text-orange-500 shadow-sm' 
            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
        }`}
        title="Açık Tema"
      >
        <Sun size={16} className={theme === 'light' ? 'fill-current' : ''} />
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-full transition-all duration-300 ${
          theme === 'system' 
            ? 'bg-white dark:bg-neutral-700 text-blue-500 shadow-sm' 
            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
        }`}
        title="Sistem Teması"
      >
        <Monitor size={16} />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-full transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-neutral-700 text-yellow-400 shadow-sm' 
            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
        }`}
        title="Koyu Tema"
      >
        <Moon size={16} className={theme === 'dark' ? 'fill-current' : ''} />
      </button>
    </div>
  );
}
