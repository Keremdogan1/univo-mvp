'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { User, Calendar, MapPin, Quote, Heart, BookOpen, Edit, Globe, Lock, Linkedin, Github, Twitter, Instagram } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import EventFeedbackButton from '@/components/EventFeedbackButton';
import BadgeDisplay from '@/components/profile/BadgeDisplay';
import ActivityTimeline, { ActivityItem } from '@/components/profile/ActivityTimeline';

interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  department?: string;
  student_id?: string;
  class_year?: string;
  bio?: string;
  interests?: string[];
  privacy_settings?: {
    show_email: boolean;
    show_interests: boolean;
    show_activities: boolean;
  };
  social_links?: {
    linkedin?: string;
    github?: string;
    website?: string;
    twitter?: string;
    instagram?: string;
  };
}

interface EventAttendance {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<EventAttendance[]>([]);
  const [pastEvents, setPastEvents] = useState<EventAttendance[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Determine if viewing own profile
  const [targetId, setTargetId] = useState<string>(id);
  const isOwnProfile = user?.id === targetId;

  useEffect(() => {
    fetchProfileData();
  }, [id, user]); // Added user to dependency to ensure correct isOwnProfile logic if user loads late

  const fetchProfileData = async () => {
    try {
      let resolvedId = id;
      
      // UUID Check & Slug Logic (Same as before)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (!isUUID) {
         const decodedId = decodeURIComponent(id);
         let matchedUser = false;
         
         if (user && user.user_metadata?.full_name) {
             const currentUserSlug = user.user_metadata.full_name.toLowerCase().replace(/\s+/g, '-');
             if (decodedId === currentUserSlug || id === currentUserSlug) {
                 resolvedId = user.id;
                 matchedUser = true;
             }
         }
         
         if (!matchedUser) {
             // Mock User Fallback
             setProfile({
                id: 'mock-id',
                full_name: decodedId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
                department: 'Öğrenci',
                class_year: 'Lisans',
                bio: 'Bu bir deneme profilidir.',
                interests: ['Kampüs', 'Sanat'],
            });
            setLoading(false);
            return;
         }
      }
      
      setTargetId(resolvedId);

      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', resolvedId)
        .single();
      
      if (profileError) throw profileError;
      setProfile(profileData);

      // 2. Fetch Badges (if exists)
      const { data: badgesData } = await supabase
        .from('user_badges')
        .select(`
            awarded_at,
            badge:badges (
                id, name, description, icon, color
            )
        `)
        .eq('user_id', resolvedId);

      if (badgesData) {
          const formattedBadges = badgesData.map((item: any) => ({
              ...item.badge,
              awarded_at: item.awarded_at
          }));
          setBadges(formattedBadges);
      }

      // 3. Fetch Events & Activities
      // Fetch user's attending events
      const { data: attendanceData } = await supabase
        .from('event_attendees')
        .select(`
          created_at,
          rsvp_status,
          events (
            id,
            title,
            date,
            time,
            location,
            category
          )
        `)
        .eq('user_id', resolvedId);

      // Fetch User's Voices (Share)
      const { data: voicesData } = await supabase
        .from('campus_voices')
        .select(`
            id,
            content,
            created_at,
            tags
        `)
        .eq('user_id', resolvedId)
        .eq('moderation_status', 'approved');

      // Fetch User's Comments
      const { data: commentsData } = await supabase
        .from('voice_comments')
        .select(`
            id,
            content,
            created_at,
            voice_id
        `)
        .eq('user_id', resolvedId);

      if (attendanceData) {
        // Process Events for Display
        const eventsList: EventAttendance[] = attendanceData
            .filter((item: any) => item.rsvp_status === 'going' && item.events) 
            .map((item: any) => ({
                ...item.events,
                date: item.events.date.replace('2025', '2026') 
            }));
        
        const now = new Date();
        const upcoming: EventAttendance[] = [];
        const past: EventAttendance[] = [];
        eventsList.forEach(event => {
            if (new Date(event.date) < now) past.push(event);
            else upcoming.push(event);
        });
        setUpcomingEvents(upcoming);
        setPastEvents(past);

        // Process Event Attendance for Activity Feed
        // Only if privacy allows OR is own profile
        const showActivities = isOwnProfile || profileData.privacy_settings?.show_activities !== false;
        
        if (showActivities) {
            const eventActivities: ActivityItem[] = attendanceData
                .filter((item: any) => item.rsvp_status === 'going' && item.events)
                .map((item: any) => ({
                    id: `evt-${item.events.id}`,
                    type: 'event_attendance',
                    title: item.events.title,
                    created_at: item.created_at || item.events.date, // Use RSVP time or event time
                    target_id: item.events.id,
                    metadata: { location: item.events.location }
                }));
            
            const voiceActivities: ActivityItem[] = (voicesData || []).map((voice: any) => ({
                id: `voice-${voice.id}`,
                type: 'voice_post',
                content: voice.content,
                created_at: voice.created_at,
                target_id: voice.id,
                metadata: { tags: voice.tags }
            }));

            const commentActivities: ActivityItem[] = (commentsData || []).map((comment: any) => ({
                id: `comment-${comment.id}`,
                type: 'comment',
                content: comment.content,
                created_at: comment.created_at,
                target_id: comment.voice_id
            }));

            const allActivities = [...eventActivities, ...voiceActivities, ...commentActivities];
            setActivities(allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        }
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
           <div className="w-16 h-16 border-4 border-[#C8102E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
           <p className="text-neutral-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-20">Profil bulunamadı.</div>;
  }

  const showInterests = isOwnProfile || profile.privacy_settings?.show_interests !== false;
  const showActivities = isOwnProfile || profile.privacy_settings?.show_activities !== false;

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Identity & Social */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden relative group">
                <div className="h-32 bg-[#C8102E]/5 w-full absolute top-0 left-0 bg-[radial-gradient(#C8102E_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                
                <div className="pt-12 px-6 pb-6 text-center relative z-10">
                    <div className="w-28 h-28 mx-auto bg-white rounded-full p-1 border-2 border-neutral-100 shadow-sm mb-4">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#C8102E] to-[#990c23] flex items-center justify-center text-white text-3xl font-bold">
                            {profile.full_name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    
                    <h1 className="text-2xl font-bold font-serif text-neutral-900 mb-1">{profile.full_name}</h1>
                    <p className="text-[#C8102E] font-medium text-sm mb-4">
                        {profile.class_year || 'Öğrenci'} {profile.department ? `· ${profile.department}` : ''}
                    </p>

                    {/* Social Links */}
                    {profile.social_links && Object.values(profile.social_links).some(v => v) && (
                        <div className="flex justify-center gap-3 mb-4">
                            {profile.social_links.linkedin && (
                                <a href={`https://linkedin.com/in/${profile.social_links.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-blue-700 transition-colors">
                                    <Linkedin size={20} />
                                </a>
                            )}
                             {profile.social_links.github && (
                                <a href={`https://github.com/${profile.social_links.github}`} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-neutral-900 transition-colors">
                                    <Github size={20} />
                                </a>
                            )}
                             {profile.social_links.twitter && (
                                <a href={`https://twitter.com/${profile.social_links.twitter}`} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-blue-400 transition-colors">
                                    <Twitter size={20} />
                                </a>
                            )}
                             {profile.social_links.instagram && (
                                <a href={`https://instagram.com/${profile.social_links.instagram}`} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-pink-600 transition-colors">
                                    <Instagram size={20} />
                                </a>
                            )}
                            {profile.social_links.website && (
                                <a href={profile.social_links.website} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-[#C8102E] transition-colors">
                                    <Globe size={20} />
                                </a>
                            )}
                        </div>
                    )}

                    {isOwnProfile && (
                        <button
                            onClick={() => router.push(`/profile/${targetId}/edit`)}
                            className="w-full py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-neutral-700 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            <Edit size={16} />
                            Profili Düzenle
                        </button>
                    )}
                </div>
            </div>

            {/* Interests Widget */}
            {showInterests && (
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h3 className="text-lg font-bold font-serif mb-4 flex items-center gap-2 text-neutral-800">
                    <Heart size={20} className="text-[#C8102E]" />
                    İlgi Alanları
                    </h3>
                    {profile.interests && profile.interests.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {profile.interests.map(interest => (
                                <span key={interest} className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium hover:bg-[#C8102E]/10 hover:text-[#C8102E] transition-colors cursor-default">
                                    {interest}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-500 italic">Henüz ilgi alanı belirtilmemiş.</p>
                    )}
                </div>
            )}
        </div>

        {/* Right Column: Bio & Activities */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Badges Section */}
            {badges.length > 0 && (
                <BadgeDisplay badges={badges} />
            )}

            {/* Bio / Headline Section */}
            {profile.bio && (
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 relative overflow-hidden">
                    <Quote size={80} className="absolute top-4 right-4 text-neutral-100 -z-10 transform rotate-12" />
                    <h2 className="text-xl font-bold font-serif mb-4 text-[#C8102E]">Hakkımda</h2>
                    <p className="text-lg text-neutral-700 leading-relaxed italic border-l-4 border-[#C8102E] pl-4">
                        {profile.bio}
                    </p>
                </div>
            )}

            {/* Activity Timeline (New) */}
            {showActivities && activities.length > 0 && (
                 <div>
                    <h2 className="text-2xl font-bold font-serif mb-6 flex items-center gap-3">
                        <BookOpen size={28} className="text-neutral-900" />
                        Aktivite Zaman Çizelgesi
                    </h2>
                    <ActivityTimeline activities={activities} />
                    <div className="my-8 border-t border-neutral-200"></div>
                 </div>
            )}

            {/* Activities Section */}
            <div>
                 <h2 className="text-2xl font-bold font-serif mb-6 flex items-center gap-3">
                    <Calendar size={28} className="text-neutral-900" />
                    Yaklaşan Etkinlikler
                 </h2>

                 {upcomingEvents.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center mb-8">
                         <p className="text-neutral-500">Yaklaşan etkinlik bulunamadı.</p>
                    </div>
                 ) : (
                    <div className="grid md:grid-cols-2 gap-4 mb-10">
                        {upcomingEvents.map((event) => (
                            <div
                                key={event.id}
                                onClick={() => router.push(`/events/${event.id}`)}
                                className="bg-white border border-neutral-200 rounded-xl p-5 hover:border-[#C8102E] hover:shadow-md transition-all cursor-pointer group"
                            >
                                <span className="inline-block px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded font-medium mb-3">
                                    {event.category}
                                </span>
                                <h3 className="font-bold text-lg mb-2 text-neutral-900 group-hover:text-[#C8102E] transition-colors line-clamp-1">
                                    {event.title}
                                </h3>
                                <div className="space-y-1 text-sm text-neutral-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-[#C8102E]" />
                                        <span>{new Date(event.date).toLocaleDateString('tr-TR')} · {event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-[#C8102E]" />
                                        <span>{event.location}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 )}
            </div>
        </div>
      </div>
    </div>
  );
}
