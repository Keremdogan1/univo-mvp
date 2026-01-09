'use client';

import { useState, useEffect } from 'react';
import { mockEvents } from '@/data/mockEvents';
import NotificationCenter from '../NotificationCenter';
import { EventCategory } from '@/types';
import CategoryFilter from '../CategoryFilter';
import EventList from '../EventList';
import { Calendar, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CommunityView() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [popularEvents, setPopularEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchPopularEvents = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('events')
        .select(`
          id, 
          title, 
          date, 
          location,
          community:communities(name),
          event_attendees(count)
        `)
        .gte('date', today)
        .order('date', { ascending: true }) // Get nearest upcoming first to ensure they are relevant
        .limit(10); // Fetch a batch to find popular ones
      
      if (data) {
        // Sort by attendee count descending
        const sorted = data.sort((a: any, b: any) => {
            const countA = a.event_attendees?.[0]?.count || 0;
            const countB = b.event_attendees?.[0]?.count || 0;
            return countB - countA;
        }).slice(0, 2);
        
        setPopularEvents(sorted);
      }
    };
    fetchPopularEvents();
  }, []);

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
      {/* Newspaper Header - Static on mobile */}
      <div className="relative border-b-4 border-black dark:border-neutral-600 pb-4 mb-8 text-center transition-colors md:static bg-neutral-50 dark:bg-[#0a0a0a] pt-4 -mt-4 -mx-4 px-4">
        <h2 className="text-[1.35rem] md:text-6xl font-black font-serif uppercase tracking-tighter mb-2 text-black dark:text-white whitespace-nowrap">Topluluk Meydanı</h2>
        <div className="flex justify-between items-center text-sm font-medium border-t-2 border-black dark:border-neutral-600 pt-2 max-w-2xl mx-auto text-neutral-600 dark:text-neutral-400">
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
              {/* Popular Events - Real Data */}
              <div className="border-4 border-black dark:border-neutral-600 p-6 bg-neutral-50 dark:bg-[#0a0a0a] transition-colors rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                <h3 className="text-lg font-black border-b-2 border-black dark:border-neutral-600 pb-2 mb-4 font-serif uppercase tracking-tight flex items-center gap-2 text-neutral-900 dark:text-white transition-colors">
                  <Calendar size={20} className="text-neutral-900 dark:text-white" />
                  Popüler
                </h3>
                <div className="space-y-4">
                  {popularEvents.length > 0 ? popularEvents.map(event => (
                    <div key={event.id} onClick={() => router.push(`/events/${event.id}`)} className="group cursor-pointer">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h4 className="font-bold font-serif text-neutral-900 dark:text-neutral-100 group-hover:underline decoration-2 underline-offset-2 transition-colors line-clamp-2 leading-tight py-1">
                          {event.title}
                        </h4>
                        <span className="shrink-0 text-[10px] font-bold bg-black text-white dark:bg-white dark:text-black px-2 py-1 uppercase transition-colors">
                          {new Date(event.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex justify-between items-end border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-2 group-last:border-0 group-last:mb-0 group-last:pb-0">
                        <div className="flex flex-col">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider truncate max-w-[150px]">
                              {event.community?.name || 'Topluluk'}
                            </p>
                            <p className="text-[10px] text-primary font-bold">
                                {(event.event_attendees?.[0]?.count || 0)} Katılımcı
                            </p>
                        </div>
                        <ArrowRight size={14} className="text-neutral-900 dark:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  )) : (
                     <div className="text-sm text-neutral-500 italic text-center py-4">
                        Yaklaşan etkinlik yok.
                     </div>
                  )}
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
