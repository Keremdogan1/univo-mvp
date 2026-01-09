'use client';

import React from 'react';
import { Award, Star, BookOpen, Crown, Compass, Sunrise, Zap, BadgeCheck, Calendar, MessageSquare, Users, Heart, Trophy, Sparkles, Target, Flame } from 'lucide-react';

// Mapping string icon names to Lucide components
const IconMap: Record<string, React.ElementType> = {
  Award,
  Star,
  BookOpen,
  Crown,
  Compass,
  Sunrise,
  Zap,
  BadgeCheck,
  Calendar,
  MessageSquare,
  Users,
  Heart,
  Trophy,
  Sparkles,
  Target,
  Flame,
};

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  awarded_at?: string;
}

interface BadgeDisplayProps {
  badges: Badge[];
  showTitle?: boolean;
}

export default function BadgeDisplay({ badges, showTitle = true }: BadgeDisplayProps) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6 mb-6 transition-colors">
      {showTitle && (
        <h3 className="text-lg font-bold font-serif mb-4 flex items-center gap-2 text-neutral-800 dark:text-white">
          <Trophy size={20} className="text-amber-500" />
          Rozetler ve Başarılar
        </h3>
      )}
      
      <div className="flex flex-wrap gap-4">
        {badges.map((badge) => {
          const IconComponent = IconMap[badge.icon] || Award;
          
          return (
            <div 
              key={badge.id} 
              className="group relative flex flex-col items-center justify-center p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-default border border-transparent hover:border-neutral-100 dark:hover:border-neutral-700"
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-sm"
                style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
              >
                <IconComponent size={24} />
              </div>
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 text-center leading-tight max-w-[80px]">
                {badge.name}
              </span>
              
              {/* Tooltip - Modern Theme */}
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-neutral-800 text-black dark:text-white text-xs rounded-xl py-3 px-4 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[20000] shadow-xl border border-neutral-200 dark:border-neutral-700 transform group-hover:translate-y-0 translate-y-2">
                <p className="font-bold mb-1 font-sans text-sm">{badge.name}</p>
                <p className="text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed">{badge.description}</p>
                {badge.awarded_at && (
                  <p className="text-neutral-400 dark:text-neutral-500 mt-2 text-[10px] font-bold border-t border-neutral-100 dark:border-neutral-700 pt-2 flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(badge.awarded_at).toLocaleDateString('tr-TR')}
                  </p>
                )}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white dark:border-t-neutral-800 w-0 h-0 drop-shadow-sm"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
