'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MessageSquare, Heart, MessageCircle } from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'event_attendance' | 'voice_post' | 'comment' | 'reaction'; // Expanded types
  title?: string; // For events
  content?: string; // For voices/comments
  target_id?: string; // ID to link to
  created_at: string;
  metadata?: any; // Extra info (e.g. event location, voice category)
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const router = useRouter();

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 text-sm">
        Henüz bir aktivite yok.
      </div>
    );
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
      {activities.map((activity, index) => (
        <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          
          {/* Icon / Bullet */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-neutral-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
            {activity.type === 'event_attendance' && <Calendar size={18} className="text-[#C8102E]" />}
            {activity.type === 'voice_post' && <MessageSquare size={18} className="text-blue-500" />}
            {activity.type === 'comment' && <MessageCircle size={18} className="text-green-500" />}
            {activity.type === 'reaction' && <Heart size={18} className="text-pink-500" />}
          </div>
          
          {/* Card */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-1">
               <time className="font-mono text-xs text-neutral-400 mb-1">
                 {new Date(activity.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
               </time>
               
               {activity.type === 'event_attendance' && (
                 <div onClick={() => router.push(`/events/${activity.target_id}`)} className="cursor-pointer">
                    <span className="text-xs font-bold text-[#C8102E] uppercase tracking-wider">Etkinlik Katılımı</span>
                    <h4 className="font-bold text-neutral-900 mt-1">"{activity.title}" etkinliğine katılıyor</h4>
                    {activity.metadata?.location && (
                      <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
                        {activity.metadata.location}
                      </p>
                    )}
                 </div>
               )}

               {activity.type === 'voice_post' && (
                 <div className="cursor-default">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Paylaşım</span>
                    <p className="text-neutral-800 mt-1 italic">"{activity.content}"</p>
                 </div>
               )}

               {activity.type === 'comment' && (
                  <div className="cursor-default">
                    <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Yorum</span>
                    <p className="text-neutral-600 mt-1 text-sm">Bir gönderiye yorum yaptı:</p>
                    <p className="text-neutral-800 mt-1">"{activity.content}"</p>
                  </div>
               )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
