'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed z-[9999] w-12 h-12 rounded-full shadow-lg text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 bottom-20 right-4 md:bottom-6 md:right-6"
      style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}
      aria-label="Yukarı çık"
    >
      <ArrowUp size={24} />
    </button>
  );
}
