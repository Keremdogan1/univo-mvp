'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CommunityView from '@/components/views/CommunityView';
import VoiceView from '@/components/views/VoiceView';
import OfficialView from '@/components/views/OfficialView';

function HomeContent() {
  const searchParams = useSearchParams();
  const view = searchParams?.get('view') || 'community';

  const renderView = () => {
    switch (view) {
      case 'voice':
        return <VoiceView />;
      case 'official':
        return <OfficialView />;
      case 'community':
      default:
        return <CommunityView />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      {renderView()}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a]">
        <div className="container mx-auto px-4 pt-8 pb-32 relative">
             <div className="relative border-b-4 border-neutral-200 dark:border-neutral-800 pb-4 mb-8 text-center bg-neutral-50 dark:bg-[#0a0a0a] pt-4 -mt-4 -mx-4 px-4">
                 <div className="flex flex-col items-center justify-center gap-4">
                     <div className="h-10 md:h-14 w-64 md:w-96 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                     <div className="h-14 w-14 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse mb-2"></div>
                 </div>
                 <div className="flex justify-between items-center border-t-2 border-neutral-200 dark:border-neutral-800 pt-2 mt-4 max-w-2xl mx-auto">
                     <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                     <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                     <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                 </div>
             </div>
             <div className="flex items-center justify-center h-64 text-neutral-400">Yükleniyor...</div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
