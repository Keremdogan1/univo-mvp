'use client';

import { useState, useEffect } from 'react';
import { Star, Lock } from 'lucide-react';
import EventFeedbackModal from './EventFeedbackModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function EventFeedbackButton({ eventId, eventTitle }: { eventId: string, eventTitle: string }) {
    const { user } = useAuth();
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [canRate, setCanRate] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        
        const checkAttendance = async () => {
            const { data } = await supabase
                .from('event_attendees')
                .select('rsvp_status')
                .eq('event_id', eventId)
                .eq('user_id', user.id)
                .eq('rsvp_status', 'going')
                .single();
            
            setCanRate(!!data);
            setLoading(false);
        };
        checkAttendance();
    }, [user, eventId]);

    if (loading) return <div className="h-12 w-full bg-neutral-100 animate-pulse"></div>;

    if (!canRate) {
        return (
            <div className="w-full bg-white/80 border-2 border-dashed border-neutral-300 text-neutral-500 font-bold py-3 uppercase flex items-center justify-center gap-2 cursor-not-allowed select-none">
                <Lock size={18} />
                <span>Katılım Sağlanmadı</span>
            </div>
        );
    }

    return (
        <>
            <button 
                onClick={() => setIsFeedbackOpen(true)}
                className="w-full bg-yellow-400 text-black font-bold py-3 uppercase hover:bg-yellow-500 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
                <Star size={20} className="fill-black" />
                Değerlendir
            </button>
            <EventFeedbackModal 
                isOpen={isFeedbackOpen} 
                onClose={() => setIsFeedbackOpen(false)} 
                eventId={eventId}
                eventTitle={eventTitle}
            />
        </>
    );
}
