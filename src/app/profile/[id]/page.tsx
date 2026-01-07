'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { User, Calendar, MapPin, Quote, Heart, BookOpen, Edit, Globe, Lock, Linkedin, Github, Twitter, Instagram, Camera, Building2, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import EventFeedbackButton from '@/components/EventFeedbackButton';
import BadgeDisplay from '@/components/profile/BadgeDisplay';
import ActivityTimeline, { ActivityItem } from '@/components/profile/ActivityTimeline';
import FriendButton from '@/components/FriendButton';
import FriendListModal from '@/components/FriendListModal';

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
  const [friendCount, setFriendCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  
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

      // Fetch Friend Count
      const { count: friends } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_id.eq.${resolvedId},receiver_id.eq.${resolvedId}`);

      setFriendCount(friends || 0);

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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user!.id}/${fileName}`;

      setIsUploading(true);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update Profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user!.id);

      if (updateError) {
        throw updateError;
      }

      // Update Local State
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      
      // Toast notification would be good here but not imported
      alert('Profil fotoğrafı güncellendi');

    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Fotoğraf yüklenirken bir hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
           <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--primary-color, #C8102E)', borderTopColor: 'transparent' }}></div>
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
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] py-12 px-4 transition-colors">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Identity & Social */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden relative group transition-colors">
                <div className="h-32 w-full absolute top-0 left-0 opacity-20" style={{ backgroundImage: 'radial-gradient(currentColor 2px, transparent 2px)', backgroundSize: '20px 20px', color: 'var(--primary-color)' }} />
                
                <div className="pt-12 px-6 pb-6 text-center relative z-10">
                    <div className="w-28 h-28 mx-auto relative group/avatar">
                        <div className="w-full h-full rounded-full p-1 border-2 border-neutral-100 dark:border-neutral-700 shadow-sm bg-transparent overflow-hidden">
                            {profile.avatar_url ? (
                                <img 
                                    src={profile.avatar_url} 
                                    alt={profile.full_name} 
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full flex items-center justify-center text-white text-3xl font-bold bg-primary" style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}>
                                    {profile.full_name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Camera Overlay for Owner */}
                        {isOwnProfile && (
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover/avatar:opacity-100 cursor-pointer transition-opacity z-20">
                                {isUploading ? (
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                ) : (
                                    <Camera size={24} />
                                )}
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleAvatarUpload} 
                                    className="hidden" 
                                    disabled={isUploading}
                                />
                            </label>
                        )}
                    </div>
                    
                    <h1 className="text-2xl font-bold font-serif text-neutral-900 dark:text-white mb-1">{profile.full_name}</h1>
                    <p className="text-primary dark:text-primary-light font-medium text-sm mb-4">
                        {profile.class_year || 'Öğrenci'} {profile.department ? `· ${profile.department}` : ''}
                    </p>

                    <div className="flex justify-center gap-6 mb-6 border-t border-b border-neutral-100 dark:border-neutral-800 py-3">
                        <button 
                            onClick={() => setShowFriendsModal(true)}
                            className="text-center hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 py-2 rounded-lg transition-colors"
                        >
                            <div className="text-lg font-bold text-neutral-900 dark:text-white">{friendCount}</div>
                            <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Arkadaş</div>
                        </button>
                    </div>

                    <FriendListModal 
                        userId={targetId}
                        isOpen={showFriendsModal}
                        onClose={() => setShowFriendsModal(false)}
                        isOwnProfile={isOwnProfile}
                    />

                    {/* Friend Button - Only for other users' profiles */}
                    {!isOwnProfile && (
                        <FriendButton 
                            targetUserId={targetId}
                            variant="profile"
                            onFriendshipChange={(status) => {
                                if (status === 'accepted' || status === 'none') {
                                    fetchProfileData();
                                }
                            }}
                        />
                    )}

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
                                <a href={profile.social_links.website} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-primary transition-colors">
                                    <Globe size={20} />
                                </a>
                            )}
                        </div>
                    )}



                    {isOwnProfile && (
                        <button
                            onClick={() => router.push(`/profile/${targetId}/edit`)}
                            className="w-full py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            <Edit size={16} />
                            Profili Düzenle
                        </button>
                    )}
                </div>
            </div>

            {isOwnProfile && (
                <div 
                    className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6 transition-colors"
                    style={{ border: '2px solid var(--primary-color, #C8102E)' }}
                >
                    <h3 className="text-lg font-bold font-serif mb-2 text-neutral-800 dark:text-neutral-200">
                        Topluluk Sahibi misiniz?
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                        Kampüsünüzde bir topluluk yönetiyorsanız, Univo üzerinden etkinliklerinizi duyurabilir ve üyelerinizle iletişimde kalabilirsiniz.
                    </p>
                    <button
                        onClick={() => {
                            // For now, just mailto. Can be replaced with a modal/form later
                            window.location.href = 'mailto:admin@univo.app?subject=Topluluk Yönetim Paneli Başvurusu&body=Merhaba,%0D%0A%0D%0ATopluluk adı:%0D%0ATopluluk açıklaması:%0D%0AÜniversite:%0D%0AIletişim bilgileri:%0D%0A';
                        }}
                        className="w-full py-2.5 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm hover:opacity-90"
                        style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}
                    >
                        <Building2 size={16} />
                        Başvuru Yap
                    </button>
                </div>
            )}

            {/* Interests Widget */}
            {showInterests && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6 transition-colors">
                    <h3 className="text-lg font-bold font-serif mb-4 flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
                    <Heart size={20} className="text-primary" />
                    İlgi Alanları
                    </h3>
                    {profile.interests && profile.interests.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {profile.interests.map(interest => (
                                <span key={interest} className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors cursor-default">
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
                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8 relative overflow-hidden transition-colors">
                    <Quote size={80} className="absolute top-4 right-4 text-neutral-100 dark:text-neutral-800 -z-10 transform rotate-12" />
                    <h2 className="text-xl font-bold font-serif mb-4 text-primary">Hakkımda</h2>
                    <p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed italic border-l-4 border-primary pl-4">
                        {profile.bio}
                    </p>
                </div>
            )}

            {/* Activity Timeline (New) */}
            {showActivities && activities.length > 0 && (
                 <div>
                    <h2 className="text-2xl font-bold font-serif mb-6 flex items-center gap-3 dark:text-white">
                        <BookOpen size={28} className="text-neutral-900 dark:text-white" />
                        Aktivite Zaman Çizelgesi
                    </h2>
                    <ActivityTimeline activities={activities} />
                    <div className="my-8 border-t border-neutral-200"></div>
                 </div>
            )}

            {/* Activities Section */}
            <div>
                 <h2 className="text-2xl font-bold font-serif mb-6 flex items-center gap-3 dark:text-white">
                    <Calendar size={28} className="text-neutral-900 dark:text-white" />
                    Yaklaşan Etkinlikler
                 </h2>

                 {upcomingEvents.length === 0 ? (
                    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8 text-center mb-8">
                         <p className="text-neutral-500 dark:text-neutral-400">Yaklaşan etkinlik bulunamadı.</p>
                    </div>
                 ) : (
                    <div className="grid md:grid-cols-2 gap-4 mb-10">
                        {upcomingEvents.map((event) => (
                            <div
                                key={event.id}
                                onClick={() => router.push(`/events/${event.id}`)}
                                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all cursor-pointer group"
                            >
                                <span className="inline-block px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs rounded font-medium mb-3">
                                    {event.category}
                                </span>
                                <h3 className="font-bold text-lg mb-2 text-neutral-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                                    {event.title}
                                </h3>
                                <div className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-primary" />
                                        <span>{new Date(event.date).toLocaleDateString('tr-TR')} · {event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-primary" />
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
