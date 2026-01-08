'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center p-4 transition-colors">
      <div className="text-center max-w-md w-full">
        {/* Large 404 Display */}
        <div className="relative mb-8">
          <h1 className="text-[150px] font-black font-serif leading-none text-neutral-100 dark:text-neutral-800 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="bg-neutral-900 dark:bg-white text-white dark:text-black px-4 py-1 rounded text-sm font-bold uppercase tracking-widest transform rotate-12">
                Sayfa Bulunamadı
             </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-serif mb-4 text-neutral-900 dark:text-white">
          Aradığınız sayfaya ulaşılamıyor.
        </h2>
        
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          Gitmek istediğiniz sayfa silinmiş, taşınmış veya hiç var olmamış olabilir.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary-color)] !text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}
            >
              <Home size={20} />
              Ana Sayfaya Dön
            </Link>
             <button 
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <ArrowLeft size={20} />
              Geri Git
            </button>
        </div>
      </div>
    </div>
  );
}
