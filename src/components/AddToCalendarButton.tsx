'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface AddToCalendarButtonProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventDescription: string;
}

export default function AddToCalendarButton({
  eventId,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  eventDescription,
}: AddToCalendarButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isAttending, setIsAttending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAttendance();
  }, [eventId, user]);

  const checkAttendance = async () => {
    if (!user || !eventId) {
      setIsAttending(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select('rsvp_status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('rsvp_status', 'going')
        .single();

      setIsAttending(!!data);
    } catch (error) {
      setIsAttending(false);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddToCalendar = () => {
    // Check if user is logged in
    if (!user) {
      alert('Takvime eklemek için önce giriş yapmalısınız!');
      router.push('/login');
      return;
    }

    // Check if user is attending the event
    if (!isAttending) {
      alert('Takvime eklemek için önce etkinliğe katılmalısınız!');
      return;
    }

    // Parse the date - format is YYYY-MM-DD from mock data
    const [year, month, day] = eventDate.split('-');
    const [startTime] = eventTime.split('-'); // Take start time only
    const [hours, minutes] = startTime.trim().split(':');
    
    // Create start date
    const startDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );
    
    // Assume 1 hour duration if not specified
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    
    // Format dates for Google Calendar (YYYYMMDDTHHmmss)
    const formatGoogleDate = (date: Date) => {
      const pad = (num: number) => num.toString().padStart(2, '0');
      return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
    };
    
    const startDateStr = formatGoogleDate(startDate);
    const endDateStr = formatGoogleDate(endDate);
    
    // Build Google Calendar URL
    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.append('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.append('text', eventTitle);
    googleCalendarUrl.searchParams.append('dates', `${startDateStr}/${endDateStr}`);
    googleCalendarUrl.searchParams.append('details', eventDescription);
    googleCalendarUrl.searchParams.append('location', eventLocation);
    
    // Open in new tab
    window.open(googleCalendarUrl.toString(), '_blank');
  };

  // Only show button if user is logged in and attending
  if (loading || !user || !isAttending) {
    return null;
  }

  return (
    <button
      onClick={handleAddToCalendar}
      style={{ borderColor: '#C8102E', color: '#C8102E' }}
      className="inline-flex items-center gap-2 px-6 py-2.5 border-2 rounded-lg font-semibold hover:bg-neutral-50 transition-colors"
    >
      <Calendar size={20} />
      <span>Google Takvime Ekle</span>
    </button>
  );
}
