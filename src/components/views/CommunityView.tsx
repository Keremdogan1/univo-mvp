'use client';

import { useState, useEffect } from 'react';
import { mockEvents } from '@/data/mockEvents';
import NotificationCenter from '../NotificationCenter';
import { useAuth } from '@/contexts/AuthContext';
import { EventCategory } from '@/types';
import CategoryFilter from '../CategoryFilter';
import EventList from '../EventList';
import { Calendar, ArrowRight, Globe, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
// Shared Component Import
import SkeletonLoader from '../ui/SkeletonLoader';

const CommunityViewSkeleton = () => {
  return (
    <div className="container mx-auto px-4 pt-8 pb-32 relative animate-in fade-in duration-500 min-h-[100dvh] overflow-x-hidden">
      <div className="border-b-4 border-neutral-200 dark:border-neutral-800 pb-4 mb-8 text-center md:static pt-4 -mt-4 -mx-4 px-4 relative min-h-[240px] bg-neutral-50 dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center justify-center gap-4">
          <SkeletonLoader width={400} height={60} className="mb-2" />
          <div className="flex items-center gap-3 mb-2">
             <SkeletonLoader width={56} height={56} className="rounded-full" />
          </div>
        </div>
        <div className="flex justify-between items-center border-t-2 border-neutral-200 dark:border-neutral-800 pt-2 mt-4 max-w-2xl mx-auto h-8">
           <SkeletonLoader width={80} height={20} />
           <SkeletonLoader width={120} height={20} />
           <SkeletonLoader width={80} height={20} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-1 hidden lg:block">
            <SkeletonLoader width={150} height={28} className="mb-4" />
            <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                        <SkeletonLoader width={20} height={20} className="rounded" />
                        <SkeletonLoader width={120} height={20} />
                    </div>
                ))}
            </div>
            <div className="mt-8 border-4 border-neutral-200 dark:border-neutral-800 p-6">
                <SkeletonLoader width={100} height={24} className="mb-4" />
                <div className="space-y-4">
                    <SkeletonLoader height={50} />
                    <SkeletonLoader height={50} />
                </div>
            </div>
         </div>
         <div className="lg:hidden flex gap-3 overflow-hidden pb-4">
             {[1, 2, 3, 4].map(i => (
                 <SkeletonLoader key={i} width={100} height={36} className="rounded-full shrink-0" />
             ))}
         </div>
         <div className="lg:col-span-3">
            <div className="flex items-center gap-4 mb-6 border-b-2 border-neutral-200 dark:border-neutral-800 pb-2">
                 <SkeletonLoader width={80} height={24} className="bg-neutral-800 dark:bg-white" />
                 <SkeletonLoader width={200} height={28} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                        <SkeletonLoader width="100%" height={160} className="rounded-none translate-x-[0%] translate-y-[0%]" />
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between">
                                <SkeletonLoader width={80} height={20} className="rounded-sm" />
                                <SkeletonLoader width={60} height={20} className="rounded-full" />
                            </div>
                            <SkeletonLoader width="90%" height={24} />
                            <SkeletonLoader width="60%" height={24} />
                            <div className="flex gap-2 pt-2">
                                <SkeletonLoader width={16} height={16} />
                                <SkeletonLoader width={100} height={16} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default function CommunityView() {
  const router = useRouter();
  const { user, profile, setViewLoading, loading: showSkeleton } = useAuth();
  const [isGlobalMode, setIsGlobalMode] = useState(false);
  const [isAdminSession, setIsAdminSession] = useState(false);

  const [university, setUniversity] = useState(profile?.university || 'metu');
  const isBilkent = university === 'bilkent';

  // Check admin session
  useEffect(() => {
      const checkAdmin = async () => {
          try {
              const res = await fetch('/api/admin/session');
              const data = await res.json();
              setIsAdminSession(data.isAdmin === true);
          } catch (e) {
              setIsAdminSession(false);
          }
      };
      if (user) checkAdmin();
  }, [user]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [popularEvents, setPopularEvents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    setViewLoading(true);
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

    const fetchAllEvents = async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
            .from('events')
            .select(`
                *,
                community:communities(id, name, logo_url, category),
                event_attendees(count)
            `)
            .gte('date', today)
            .order('date', { ascending: true });
        
        if (data) {
             // Combine real data with mock events for presentation
             const combinedEvents = [...data, ...mockEvents];
             
             // Remove duplicates if any ID conflicts (though mock IDs are distinct)
             const uniqueEvents = Array.from(new Map(combinedEvents.map(item => [item.id, item])).values());
             
             // Sort by date just in case
             uniqueEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
             
             setEvents(uniqueEvents);
        } else {
             setEvents(mockEvents);
        }
        setViewLoading(false);
    };
    fetchAllEvents();
  }, [setViewLoading]);

  if (showSkeleton) {
    return <CommunityViewSkeleton />;
  }

  const filteredEvents =
    selectedCategory === 'all'
      ? events.filter((event) => event.community?.category !== 'Resmi')
      : events.filter((event) => event.community?.category === selectedCategory);

  // Date & Issue Logic
  const today = new Date();
  const start = new Date(2025, 11, 29);
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffTime = current.getTime() - start.getTime();
  const issueNumber = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const formattedDate = today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="container mx-auto px-4 pt-8 pb-32 min-h-[100dvh]">
      {/* Newspaper Header - Static on mobile */}

      <div className="relative border-b-4 border-black dark:border-neutral-600 pb-4 mb-8 text-center transition-colors md:static bg-neutral-50 dark:bg-[#0a0a0a] pt-4 -mt-4 -mx-4 px-4 min-h-[240px]">
        <div className="flex flex-col items-center justify-center gap-4">
          <h2 className="text-4xl md:text-6xl font-black font-serif uppercase tracking-tight text-black dark:text-white leading-none">Topluluk Meydanı</h2>

          {/* Global Mode Switch - Custom Morphing Button (3D Flip) */}
          <div className="flex items-center gap-3">
            {user && isAdminSession ? (
              <div className="flex items-center gap-2 mb-2 bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 animate-in fade-in slide-in-from-top-2">
                {/* ODTÜ Button */}
                <button 
                    onClick={() => { setIsGlobalMode(false); setUniversity('metu'); }} 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative ${!isGlobalMode && university === 'metu' ? 'bg-white shadow-sm ring-1 ring-black/5 scale-110' : 'opacity-50 hover:opacity-100'}`}
                    title="ODTÜ Kampüsü"
                >
                    <img src="/odtu_logo.png" className="w-8 h-8 object-contain" />
                    {!isGlobalMode && university === 'metu' && <div className="absolute -bottom-1 w-1 h-1 bg-black dark:bg-white rounded-full"></div>}
                </button>
                
                {/* Bilkent Button */}
                <button 
                    onClick={() => { setIsGlobalMode(false); setUniversity('bilkent'); }} 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative ${!isGlobalMode && university === 'bilkent' ? 'bg-white shadow-sm ring-1 ring-black/5 scale-110' : 'opacity-50 hover:opacity-100'}`}
                    title="Bilkent Kampüsü"
                >
                    <img src="/universities/bilkent_cleaned.png" className="w-8 h-8 object-contain" />
                    {!isGlobalMode && university === 'bilkent' && <div className="absolute -bottom-1 w-1 h-1 bg-black dark:bg-white rounded-full"></div>}
                </button>

                {/* Global Button */}
                <button 
                    onClick={() => setIsGlobalMode(true)} 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative ${isGlobalMode ? 'bg-white shadow-sm ring-1 ring-black/5 scale-110' : 'opacity-50 hover:opacity-100'}`}
                    title="Global Gündem"
                >
                   <img src="/earth_image.jpg" className="w-8 h-8 rounded-full object-cover" />
                   {isGlobalMode && <div className="absolute -bottom-1 w-1 h-1 bg-black dark:bg-white rounded-full"></div>}
                </button>
              </div>
            ) : (
            <div 
                className="relative w-14 h-14 rounded-full perspective-1000 cursor-pointer mb-2"
                onClick={() => setIsGlobalMode(!isGlobalMode)}
                title={isGlobalMode ? (isBilkent ? "Bilkent Moduna Geç" : "ODTÜ Moduna Geç") : "Global Moda Geç"}
            >
                <div 
                    className="w-full h-full relative preserve-3d transition-transform duration-700 ease-in-out"
                    style={{ transform: isGlobalMode ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                    {/* Front: Uni Logo */}
                    <div className="absolute inset-0 backface-hidden rounded-full overflow-hidden border-2 border-black dark:border-neutral-400 bg-white dark:bg-black shadow-md flex items-center justify-center">
                         <img src={isBilkent ? "/universities/bilkent_cleaned.png" : "/odtu_logo.png"} alt="University Logo" className="w-10 h-10 object-contain" />
                    </div>
                    {/* Back: Global */}
                    <div 
                        className="absolute inset-0 backface-hidden rounded-full overflow-hidden border-2 border-black dark:border-neutral-400 bg-white dark:bg-black shadow-md flex items-center justify-center"
                        style={{ transform: 'rotateY(180deg)' }}
                    >
                        <img src="/earth_image.jpg" alt="Global" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center text-sm font-medium border-t-2 border-black dark:border-neutral-600 pt-2 mt-4 max-w-2xl mx-auto text-neutral-600 dark:text-neutral-400 h-8">
          <span>SAYI: {issueNumber}</span>
          <span>ÖĞRENCİ BÜLTENİ</span>
          <span>{formattedDate.toUpperCase()}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isGlobalMode ? (
          <motion.div
            key="global"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-20 min-h-[50vh] text-center"
          >
            <div className="relative w-64 h-64 mb-8 group perspective-1000">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
              <Globe className="w-full h-full text-blue-600 dark:text-blue-400 animate-[spin_60s_linear_infinite]" strokeWidth={0.5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl">🌍</span>
              </div>
            </div>

            <h2 className="text-4xl md:text-5xl font-black font-serif text-neutral-900 dark:text-white mb-6">
              Global Topluluk
            </h2>

            <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-300 max-w-lg mx-auto mb-10 leading-relaxed font-serif">
              Sınırlar kalkıyor! Dünyanın dört bir yanındaki öğrenci topluluklarıyla çok yakında burada buluşacaksın.
            </p>

            <div className="flex gap-4">
              <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold border border-neutral-200 dark:border-neutral-700">
                <Lock size={18} />
                Erişime Kapalı
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="odtu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
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
                          <motion.div
                            key={event.id}
                            onClick={() => router.push(`/events/${event.id}`)}
                            className="group cursor-pointer"
                            whileHover={{ scale: 1.02, x: 5 }}
                            whileTap={{ scale: 0.98 }}
                          >
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
                          </motion.div>
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

                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedCategory}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EventList events={filteredEvents} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
