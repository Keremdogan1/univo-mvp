'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Attendee {
  id: string;
  user_id: string;
  profiles: {
    full_name: string;
    department?: string;
    avatar_url?: string;
  } | null;
}

interface AttendeesListProps {
  eventId: string;
}

export default function AttendeesList({ eventId }: AttendeesListProps) {
  const router = useRouter();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Define fetchAttendees with useCallback to be stable for useEffect dependencies
  const fetchAttendees = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          id,
          user_id,
          profiles (
            full_name,
            department,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .eq('rsvp_status', 'going');

      if (error) throw error;

      // Supabase might return joined data as an array, so we ensure it matches our interface
      const formattedData = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      }));

      setAttendees(formattedData as Attendee[]);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendees();

    // Listen for custom RSVP change event
    const handleRSVPChange = (event: CustomEvent) => {
       if (event.detail && event.detail.eventId === eventId) {
         fetchAttendees();
       }
    };

    window.addEventListener('rsvp-change', handleRSVPChange as EventListener);

    return () => {
      window.removeEventListener('rsvp-change', handleRSVPChange as EventListener);
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4 dark:text-white">Katılımcılar</h3>
        <p className="text-neutral-500">Yükleniyor...</p>
      </div>
    );
  }

  if (attendees.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4 dark:text-white">Katılımcılar</h3>
        <p className="text-neutral-500">Henüz kimse katılmadı. İlk katılan siz olun!</p>
      </div>
    );
  }

  const displayedAttendees = showAll ? attendees : attendees.slice(0, 8);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 transition-colors">
      <h3 className="font-semibold text-lg mb-4 dark:text-white">
        Katılımcılar ({attendees.length})
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayedAttendees.map((attendee) => (
          <div
            key={attendee.id}
            onClick={() => router.push(`/profile/${attendee.user_id}`)}
            className="flex flex-col items-center p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2 bg-primary"
              style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}
            >
              {attendee.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <p className="font-medium text-sm text-center line-clamp-1 dark:text-neutral-200">
              {attendee.profiles?.full_name || 'Kullanıcı'}
            </p>
            {attendee.profiles?.department && (
              <p className="text-xs text-neutral-500 text-center line-clamp-1">
                {attendee.profiles.department}
              </p>
            )}
          </div>
        ))}
      </div>

      {attendees.length > 8 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 w-full py-2 text-sm font-semibold hover:underline text-primary"
        >
          Tümünü Göster (+{attendees.length - 8})
        </button>
      )}

      {showAll && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-4 w-full py-2 text-sm font-semibold hover:underline text-primary"
        >
          Daha Az Göster
        </button>
      )}
    </div>
  );
}
