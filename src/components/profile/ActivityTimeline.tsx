'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MessageSquare, Heart, MessageCircle } from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'event_attendance' | 'voice_post' | 'comment' | 'reaction';
  title?: string;
  content?: string;
  target_id?: string;
  created_at: string;
  metadata?: any;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

// Helper outside component or inside
function formatRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Şimdi';
    
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes} dk önce`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} saat önce`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} gün önce`;
    
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} hafta önce`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} ay önce`;
    
    const years = Math.floor(days / 365);
    return `${years} yıl önce`;
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
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={activity.id} className="relative pl-6 pb-6 border-l-2 border-neutral-200 dark:border-neutral-800 last:border-0 last:pb-0">
          
          {/* Timeline Dot */}
          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black dark:bg-white border-2 border-white dark:border-neutral-900"></div>
          
          {/* Card */}
          <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] p-4 transition-colors">
             <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center gap-2">
                    {activity.type === 'event_attendance' && <span className="bg-[#C8102E] text-white text-[10px] font-bold px-2 py-0.5 uppercase">Etkinlik</span>}
                    {activity.type === 'voice_post' && <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase">Paylaşım</span>}
                    {activity.type === 'comment' && <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase">Yorum</span>}
                    
                    <time className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                      {formatRelativeTime(activity.created_at)}
                    </time>
                 </div>
             </div>

             {/* Content */}
             <div className="space-y-2">
                {activity.type === 'event_attendance' && (
                    <div onClick={() => router.push(`/events/${activity.target_id}`)} className="cursor-pointer group">
                        <h4 className="font-bold font-serif text-lg text-neutral-900 dark:text-white group-hover:underline decoration-2 underline-offset-2">
                            {activity.title}
                        </h4>
                        {activity.metadata?.location && (
                            <div className="flex items-center gap-1 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mt-1">
                                <Calendar size={12} />
                                {activity.metadata.location}
                            </div>
                        )}
                    </div>
                )}

                {activity.type === 'voice_post' && (
                    <div>
                        <p className="font-serif italic text-lg text-neutral-800 dark:text-neutral-200 leading-relaxed">
                            "{activity.content}"
                        </p>
                    </div>
                )}

                {activity.type === 'comment' && (
                     <div>
                        <p className="text-sm text-neutral-500 mb-1">Şuna yorum yaptı:</p>
                        <p className="font-medium text-neutral-900 dark:text-neutral-200 border-l-2 border-neutral-300 dark:border-neutral-700 pl-3 italic">
                            "{activity.content}"
                        </p>
                     </div>
                )}
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}
