import { useState, useEffect } from 'react';
import { mockEvents } from '@/data/mockEvents';
import { EventCategory } from '@/types';
import CategoryFilter from '../CategoryFilter';
import EventList from '../EventList';
import { Calendar, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

// MOCK POPULAR EVENTS
const POPULAR_EVENTS = [
  { id: 'evt-1', title: 'Start-up Zirvesi', attendees: 250, date: '12 Mayıs' },
  { id: 'evt-2', title: 'Müzik Festivali', attendees: 180, date: '15 Mayıs' },
];

export default function CommunityView() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredEvents =
    selectedCategory === 'all'
      ? mockEvents.filter((event) => event.community.category !== 'Resmi')
      : mockEvents.filter((event) => event.community.category === selectedCategory);

  // Date & Issue Logic
  const today = new Date();
  const start = new Date(2025, 11, 29);
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffTime = current.getTime() - start.getTime();
  const issueNumber = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const formattedDate = today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Newspaper Header - Sticky on mobile */}
      <div className="border-b-4 border-black dark:border-white pb-4 mb-8 text-center transition-colors md:static sticky top-0 z-[9998] bg-neutral-50 dark:bg-[#0a0a0a] pt-4 -mt-4 -mx-4 px-4">
        <h2 className="text-3xl md:text-6xl font-black font-serif uppercase tracking-tight mb-2 text-black dark:text-white">Topluluk Meydanı</h2>
        <div className="flex justify-between items-center text-sm font-medium border-t border-black dark:border-white pt-2 max-w-2xl mx-auto text-neutral-600 dark:text-neutral-400">
          <span>SAYI: {issueNumber}</span>
          <span>ÖĞRENCİ BÜLTENİ</span>
          <span>{formattedDate.toUpperCase()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar / Navigation (Category Filter) */}
        <div className="lg:col-span-1">
          <div className="">
            <h3 className="text-xl font-bold border-b-2 border-black dark:border-white pb-2 mb-4 font-serif dark:text-white transition-colors">Kategoriler</h3>
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            <div className="mt-8">
              {/* Popular Events - Replaced TrendingWidget */}
              <div className="border-4 border-primary dark:border-primary p-6 bg-white dark:bg-neutral-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] transition-colors">
                <h3 className="text-xl font-bold border-b-2 border-black dark:border-white pb-2 mb-4 font-serif uppercase tracking-tight flex items-center gap-2 dark:text-white transition-colors">
                  <Calendar size={24} style={{ color: 'var(--primary-color, #C8102E)' }} />
                  Popüler
                </h3>
                <div className="space-y-4">
                  {POPULAR_EVENTS.map(event => (
                    <div key={event.id} onClick={() => router.push('/events/1')} className="group cursor-pointer">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold font-serif text-neutral-900 dark:text-neutral-100 group-hover:text-primary transition-colors">{event.title}</h4>
                        <span className="text-xs font-bold bg-primary text-white px-2 py-1 uppercase transition-colors">{event.date}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-2 group-last:border-0 group-last:mb-0 group-last:pb-0">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">{event.attendees} katılımcı</p>
                        <ArrowRight size={16} className="text-neutral-400 dark:text-neutral-500 group-hover:translate-x-1 group-hover:text-primary transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Column */}
        <div className="lg:col-span-3">
          <h3 className="text-xl font-bold border-b-2 border-black dark:border-white pb-2 mb-6 flex items-center gap-2 font-serif dark:text-white transition-colors">
            <span className="bg-black dark:bg-white text-white dark:text-black px-2 py-1 text-sm uppercase">Güncel</span>
            Etkinlikler & Kulüpler
          </h3>

          <EventList events={filteredEvents} />
        </div>
      </div>
    </div>
  );
}
