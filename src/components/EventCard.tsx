'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Event } from '@/types';
import { supabase } from '@/lib/supabase';

interface EventCardProps {
  event: Event;
  isAttending?: boolean;
}

export default function EventCard({ event, isAttending = false }: EventCardProps) {
  const router = useRouter();
  const [attendees, setAttendees] = useState<{avatar_url?: string; full_name?: string}[]>([]);
  const [attendeeCount, setAttendeeCount] = useState(0);

  useEffect(() => {
    async function fetchAttendees() {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.id);
        
        if (isUuid) {
             const { data, count } = await supabase
                .from('event_attendees')
                .select('user_id, profiles(avatar_url, full_name)', { count: 'exact' })
                .eq('event_id', event.id)
                .limit(4);
             
             if (data) {
                 setAttendees(data.map((d: any) => ({ 
                     avatar_url: d.profiles?.avatar_url,
                     full_name: d.profiles?.full_name 
                 })));
                 setAttendeeCount(count || 0);
             }
        }
    }
    fetchAttendees();
  }, [event.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isPastEvent = new Date(event.date) < new Date();

  return (
    <div 
      onClick={() => router.push(`/events/${event.id}`)}
      className="block h-full group relative cursor-pointer"
    >
      <div className={`h-full flex flex-col bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] hover:border-primary dark:hover:border-primary ${isPastEvent ? 'opacity-80 grayscale-[0.5] hover:grayscale-0 hover:opacity-100' : ''}`}>
        {/* Header / Category */}
        <div className="border-b-2 border-black dark:border-neutral-700 p-3 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800 transition-colors">
           <span className="font-bold font-serif uppercase text-sm tracking-wide" style={{ color: 'var(--primary-color, #C8102E)' }}>
             {event.community.category || event.category}
           </span>
           {isPastEvent ? (
                <span className="bg-neutral-200 text-neutral-600 border-2 border-neutral-400 px-2 py-0.5 text-xs font-bold uppercase">
                    Tamamlandı
                </span>
           ) : isAttending && (
               <span className="bg-green-100 text-green-800 border-2 border-green-800 px-2 py-0.5 text-xs font-bold uppercase transform -rotate-2">
                   ✓ Katılıyorsun
               </span>
           )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-xl font-black font-serif text-black dark:text-white mb-3 leading-tight group-hover:underline decoration-2 underline-offset-2">
            {event.title}
          </h3>

          {/* Meta Information */}
          <div className="space-y-2 mb-4 text-sm font-medium border-l-2 border-neutral-200 dark:border-neutral-700 pl-3">
            <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-300">
              <Users size={16} />
              <Link 
                href={`/community/${event.community.id}`}
                onClick={(e) => e.stopPropagation()} 
                className="uppercase tracking-tight text-xs hover:underline hover:text-black dark:hover:text-white font-bold"
              >
                  {event.community.name}
              </Link>
            </div>
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <Calendar size={16} />
              <span>
                {formatDate(event.date)} · {event.time}
              </span>
            </div>
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <MapPin size={16} />
              <a 
                href="https://www.google.com/maps/search/?api=1&query=ODTÜ+Devrim+Stadyumu"
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                rel="noopener noreferrer"
                className="hover:underline hover:text-primary transition-colors"
               >
                {event.location}
               </a>
            </div>
          </div>

          {/* Excerpt */}
          <p className="text-neutral-600 dark:text-neutral-400 font-serif leading-relaxed line-clamp-3 mb-6 flex-1 text-sm">
            {event.excerpt}
          </p>

          {/* Action Footer */}
          <div className="mt-auto pt-4 border-t-2 border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
             
             {/* Attendees Preview */}
             {attendeeCount > 0 ? (
                 <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 items-center">
                        {attendees.map((attendee, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-white dark:bg-neutral-800 border border-white dark:border-neutral-700 flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-sm">
                                {attendee.avatar_url ? (
                                    <img src={attendee.avatar_url} alt="user" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-bold select-none" style={{ backgroundColor: 'var(--primary-color)' }}>
                                        {attendee.full_name ? attendee.full_name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {attendeeCount > attendees.length && (
                        <span className="text-xs text-neutral-500 font-bold uppercase tracking-tight">+{attendeeCount - attendees.length} Diğer</span>
                    )}
                 </div>
             ) : (
                <span className="text-[10px] text-neutral-400 font-bold uppercase whitespace-nowrap">Henüz katılımcı yok</span>
             )}

             <span className="text-sm font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all ml-auto dark:text-white">
                Detaylar 
                <span className="text-lg">→</span>
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}
