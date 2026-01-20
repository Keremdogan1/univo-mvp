'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CommunityView from '@/components/views/CommunityView';
import VoiceView from '@/components/views/VoiceView';
import OfficialView from '@/components/views/OfficialView';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function HomeContent() {
  const searchParams = useSearchParams();
  const view = searchParams?.get('view') || 'community';
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check auth and guest status
  useEffect(() => {
    if (!loading) {
      const guestMode = localStorage.getItem('univo_guest_mode') === 'true';
      setIsGuest(guestMode);
      
      if (!user && !guestMode) {
        router.push('/login');
      } else {
        setIsChecking(false);
      }
    }
  }, [user, loading, router]);

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

  if (loading || isChecking) {
       return (
         <div className="min-h-[100dvh] bg-neutral-50 dark:bg-[#0a0a0a] flex items-center justify-center">
             <div className="animate-pulse flex flex-col items-center gap-4">
                 <div className="h-12 w-12 rounded-full border-4 border-neutral-200 border-t-black dark:border-neutral-800 dark:border-t-white animate-spin"></div>
                 <p className="text-sm font-medium text-neutral-500">Univo Başlatılıyor...</p>
             </div>
         </div>
       );
  }

  return (
    <div className="min-h-[100dvh] bg-neutral-50 dark:bg-[#0a0a0a] transition-colors duration-300 overflow-x-hidden">
      {renderView()}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-neutral-50 dark:bg-[#0a0a0a] overflow-x-hidden">
        <div className="container mx-auto px-4 pt-8 pb-32 relative">
             <div className="relative border-b-4 border-neutral-200 dark:border-neutral-800 pb-4 mb-8 text-center bg-neutral-50 dark:bg-[#0a0a0a] pt-4 -mt-4 -mx-4 px-4 min-h-[240px]">
                 <div className="flex flex-col items-center justify-center gap-4">
                     <div className="h-10 md:h-14 w-64 md:w-96 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                     <div className="h-14 w-14 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse mb-2"></div>
                 </div>
                 <div className="flex justify-between items-center border-t-2 border-neutral-200 dark:border-neutral-800 pt-2 mt-4 max-w-2xl mx-auto h-8">
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
