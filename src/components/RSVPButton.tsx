'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface RSVPButtonProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventDescription: string;
}

export default function RSVPButton({ 
  eventId,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  eventDescription
}: RSVPButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'going' | 'not_going' | null>(null);
  const [loading, setLoading] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  
  // New state for confirmation step
  const [confirming, setConfirming] = useState(false);

  // Helper to generate Google Calendar URL
  const getGoogleCalendarUrl = () => {
    try {
      // Parse the date - format is YYYY-MM-DD
      const [year, month, day] = eventDate.split('-');
      const [startTime] = eventTime.split('-'); // Looking for "HH:MM - HH:MM" or just "HH:MM"
      const [hours, minutes] = startTime.trim().split(':');
      
      const startDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );
      
      // Assume 1 hour duration
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      
      const formatGoogleDate = (date: Date) => {
        const pad = (num: number) => num.toString().padStart(2, '0');
        return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
      };
      
      const startDateStr = formatGoogleDate(startDate);
      const endDateStr = formatGoogleDate(endDate);
      
      const url = new URL('https://calendar.google.com/calendar/render');
      url.searchParams.append('action', 'TEMPLATE');
      url.searchParams.append('text', eventTitle);
      url.searchParams.append('dates', `${startDateStr}/${endDateStr}`);
      url.searchParams.append('details', eventDescription);
      url.searchParams.append('location', eventLocation);
      
      return url.toString();
    } catch (e) {
      console.error('Error generating calendar URL:', e);
      return '#';
    }
  };

  const fetchRSVPStatus = async () => {
    if (!user || !eventId) return;

    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select('rsvp_status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (data) {
        setStatus(data.rsvp_status as 'going' | 'not_going');
      }
    } catch (error) {
      // No RSVP yet
      setStatus(null);
    }
  };

  const fetchAttendeeCount = async () => {
    if (!eventId) return;

    try {
      const { count, error } = await supabase
        .from('event_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('rsvp_status', 'going');

      if (!error && count !== null) {
        setAttendeeCount(count);
      }
    } catch (error) {
      console.error('Error fetching attendee count:', error);
    }
  };

  // Fetch current RSVP status and count on mount
  useEffect(() => {
    if (user) {
      fetchRSVPStatus();
    }
    fetchAttendeeCount();
  }, [eventId, user]);

  const handleRSVP = async (newStatus: 'going' | 'not_going') => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Step 1: If clicking "Katıl", just show confirmation
    if (newStatus === 'going' && !confirming && status !== 'going') {
      setConfirming(true);
      return;
    }

    setLoading(true);

    try {
      // If clicking "İptal Et" (not_going), always remove the RSVP
      if (newStatus === 'not_going') {
        await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);
        
        // Update count if they were going
        if (status === 'going') {
          setAttendeeCount(Math.max(0, attendeeCount - 1));
        }
        setStatus(null);
        setConfirming(false); // Reset confirmation state on cancel
      } else if (newStatus === 'going') {
        // If clicking "Katılıyorum" (confirming), insert or update
        const { error } = await supabase
          .from('event_attendees')
          .upsert({
            event_id: eventId,
            user_id: user.id,
            rsvp_status: newStatus,
          });

        if (error) throw error;

        // Only increment count if they weren't already going
        if (status !== 'going') {
          setAttendeeCount(attendeeCount + 1);
        }
        setStatus(newStatus);
        setConfirming(false);
      }
      
      // Notify other components (like AttendeesList) that RSVP changed
      window.dispatchEvent(new CustomEvent('rsvp-change', { detail: { eventId } }));
      router.refresh();

    } catch (error) {
      console.error('Error updating RSVP:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-bold font-serif text-lg mb-1">Bu etkinliğe katılacak mısınız?</h3>
          <p className="text-sm text-neutral-600 font-medium">
            Şu an <span className="text-black font-bold text-base">{attendeeCount}</span> kişi katılıyor
          </p>
        </div>
      </div>

      <div className="w-full">
         {/* Success/Status Message Area */}
         {status === 'going' ? (
           <div className="flex flex-col gap-4 animate-fade-in">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-800 dark:border-green-500 flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(22,101,52,1)] dark:shadow-[4px_4px_0px_0px_rgba(34,197,94,0.3)]">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="font-black text-green-900 dark:text-green-100 uppercase tracking-wide text-sm">Kaydınız Alındı</p>
                  <p className="text-xs text-green-800 dark:text-green-300 font-medium mt-0.5">Etkinlik gününü not etmeyi unutmayın!</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                 <a 
                    href={getGoogleCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-white dark:bg-neutral-900 border-2 border-primary text-primary py-2 font-bold text-sm uppercase hover:bg-primary hover:text-white transition-colors"
                  >
                    Google Takvime Ekle
                  </a>
                  <button
                    onClick={() => handleRSVP('not_going')}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-bold text-neutral-400 hover:text-primary transition-colors"
                  >
                    İptal Et
                  </button>
              </div>
           </div>
         ) : (
           <div className="flex flex-col gap-3">
             {/* Main Action Button */}
             <button
               onClick={() => handleRSVP('going')}
               disabled={loading}
               className={`w-full py-4 font-black uppercase tracking-wider text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 text-white ${
                 confirming ? 'bg-[#ea2626] animate-pulse' : 'bg-primary hover:bg-neutral-800'
               }`}
             >
               {loading ? 'İşleniyor...' : (confirming ? 'Onaylıyor musunuz?' : 'KATIL')}
             </button>
             
             {/* Cancel Confirmation Button */}
             {confirming && (
               <button
                 onClick={() => setConfirming(false)}
                 disabled={loading}
                 className="w-full py-2 font-bold text-neutral-500 hover:text-black uppercase text-xs tracking-widest"
               >
                 Vazgeç
               </button>
             )}
             
             {/* Helper text for confirmation */}
             {confirming && !status && (
               <p className="text-center text-xs font-bold text-red-600 animate-pulse uppercase">
                 Kayıt işlemini tamamlamak için butona tekrar basın
               </p>
             )}
           </div>
         )}
      </div>
    </div>
  );
}
