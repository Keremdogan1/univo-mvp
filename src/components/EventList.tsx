import { useState, useEffect } from 'react';
import { Event } from '@/types';
import EventCard from './EventCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface EventListProps {
  events: Event[];
}

export default function EventList({ events }: EventListProps) {
  const { user } = useAuth();
  const [attendingEventIds, setAttendingEventIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchAttendingEvents() {
      if (!user) {
        setAttendingEventIds(new Set());
        return;
      }

      const { data, error } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', user.id)
        .eq('rsvp_status', 'going');

      if (!error && data) {
        setAttendingEventIds(new Set(data.map(item => item.event_id)));
      }
    }

    fetchAttendingEvents();
  }, [user]);

  if (events.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500 text-lg">
          Bu kategoride henüz etkinlik bulunmuyor.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard 
          key={event.id} 
          event={event} 
          isAttending={attendingEventIds.has(event.id)}
        />
      ))}
    </div>
  );
}
