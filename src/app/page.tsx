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
    <Suspense fallback={<div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] flex items-center justify-center dark:text-white">Yükleniyor...</div>}>
      <HomeContent />
    </Suspense>
  );
}
