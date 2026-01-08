'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, Calendar, MapPin, Quote, Heart, BookOpen, Edit, Globe, Lock, Linkedin, Github, Twitter, Instagram, Camera, Building2, Users, GraduationCap, BadgeCheck, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import EventFeedbackButton from '@/components/EventFeedbackButton';
import BadgeDisplay from '@/components/profile/BadgeDisplay';
import ActivityTimeline, { ActivityItem } from '@/components/profile/ActivityTimeline';
import FriendButton from '@/components/FriendButton';
import FriendListModal from '@/components/FriendListModal';
import FollowedCommunitiesModal from '@/components/profile/FollowedCommunitiesModal';
import { analyzeCourses, formatDetectionMessage } from '@/lib/course-analyzer';
import { toast } from 'sonner';

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
        show_friends: boolean;
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
    const [followedCommunitiesCount, setFollowedCommunitiesCount] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [showFriendsModal, setShowFriendsModal] = useState(false);
    const [showCommunitiesModal, setShowCommunitiesModal] = useState(false);
    const [detectionResult, setDetectionResult] = useState<any>(null);
    const [showDetectionCard, setShowDetectionCard] = useState(false);
    const [detecting, setDetecting] = useState(false);

    // Determine if viewing own profile
    const [targetId, setTargetId] = useState<string>(id);
    const isOwnProfile = user?.id === targetId;

    // New states for Lightbox and Long Press
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [showChangePhotoModal, setShowChangePhotoModal] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const longPressTriggered = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProfileData();
    }, [id, user]);

    useEffect(() => {
        if (isOwnProfile && user && profile && !loading) {
            handleProfileDetection();
        }
    }, [isOwnProfile, user, profile, loading]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handlePressStart = () => {
        longPressTriggered.current = false;
        timerRef.current = setTimeout(() => {
            longPressTriggered.current = true;
            if (isOwnProfile) {
                setShowChangePhotoModal(true);
            }
        }, 500); // 500ms for long press
    };

    const handlePressEnd = (e: React.MouseEvent | React.TouchEvent) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        // If not long press, open lightbox (only if avatar exists)
        if (!longPressTriggered.current && profile?.avatar_url) {
            setIsLightboxOpen(true);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
        setShowChangePhotoModal(false);
    };

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

            // 2. Fetch Database Badges (if exists)
            const { data: badgesData } = await supabase
                .from('user_badges')
                .select(`
            awarded_at,
            badge:badges (
                id, name, description, icon, color
            )
        `)
                .eq('user_id', resolvedId);

            // Start building achievement badges array
            const achievementBadges: any[] = [];
            const now = new Date().toISOString();


            // Profile Completed Badge - Only requires student_id, department, class_year
            const hasCompletedProfile = profileData?.student_id &&
                profileData?.department &&
                profileData?.class_year;
            if (hasCompletedProfile) {
                achievementBadges.push({
                    id: 'profile-complete',
                    name: 'Profil Tamamlandı',
                    description: 'Tüm profil bilgilerini eksiksiz doldurdu.',
                    icon: 'Sparkles',
                    color: '#8B5CF6',
                    awarded_at: profileData.updated_at || now
                });
            }

            // 3. Fetch Events & Activities
            // Fetch user's attending events with community category
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
            category,
            community:communities (
                id,
                name,
                category
            )
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

            // Fetch Followed Communities Count
            const { count: followed } = await supabase
                .from('community_followers')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', resolvedId);

            setFollowedCommunitiesCount(followed || 0);

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

            // === ACTIVITY-BASED BADGES (calculated after fetching activity data) ===

            // First Event Attended Badge
            if (attendanceData && attendanceData.length > 0) {
                const firstEvent = attendanceData.sort((a: any, b: any) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )[0];
                achievementBadges.push({
                    id: 'first-event',
                    name: 'İlk Etkinlik',
                    description: 'İlk etkinliğine katılım sağladı!',
                    icon: 'Calendar',
                    color: '#10B981',
                    awarded_at: firstEvent.created_at || now
                });
            }

            // First Post Made Badge - Check if user has EVER made a post (including deleted ones)
            // Query all voices including deleted to check if badge should persist
            const { count: totalPostsEver } = await supabase
                .from('campus_voices')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', resolvedId);

            if (totalPostsEver && totalPostsEver > 0) {
                // Get first post date from current posts, or use account creation date
                const firstPostDate = voicesData && voicesData.length > 0
                    ? voicesData.sort((a: any, b: any) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    )[0].created_at
                    : profileData?.created_at || now;
                achievementBadges.push({
                    id: 'first-post',
                    name: 'İlk Paylaşım',
                    description: 'Kampüsün Sesi\'nde ilk paylaşımını yaptı!',
                    icon: 'MessageSquare',
                    color: '#F59E0B',
                    awarded_at: firstPostDate
                });
            }

            // Community Follower Badge
            if (followed && followed > 0) {
                achievementBadges.push({
                    id: 'community-follower',
                    name: 'Topluluk Takipçisi',
                    description: 'Bir topluluk takip etmeye başladı!',
                    icon: 'Users',
                    color: '#EC4899',
                    awarded_at: now
                });
            }

            // Active Commenter Badge (5+ comments)
            if (commentsData && commentsData.length >= 5) {
                achievementBadges.push({
                    id: 'active-commenter',
                    name: 'Aktif Yorumcu',
                    description: 'Paylaşımlara 5\'ten fazla yorum yaptı!',
                    icon: 'Heart',
                    color: '#EF4444',
                    awarded_at: now
                });
            }

            // Early Adopter Badge (profile created before 2026-02-01)
            const createdAt = profileData?.created_at ? new Date(profileData.created_at) : null;
            if (createdAt && createdAt < new Date('2026-02-01')) {
                achievementBadges.push({
                    id: 'early-adopter',
                    name: 'Öncü Kullanıcı',
                    description: 'Univo\'nun ilk kullanıcılarından biri!',
                    icon: 'Flame',
                    color: '#F97316',
                    awarded_at: profileData.created_at
                });
            }

            // Combine Database Badges with Achievement Badges
            const dbBadges = badgesData ? badgesData.map((item: any) => ({
                ...item.badge,
                awarded_at: item.awarded_at
            })) : [];

            // Merge without duplicates (by id)
            const allBadges = [...achievementBadges];
            dbBadges.forEach((dbBadge: any) => {
                if (!allBadges.find(b => b.id === dbBadge.id)) {
                    allBadges.push(dbBadge);
                }
            });

            setBadges(allBadges);

        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileDetection = async () => {
        if (!user || detecting || sessionStorage.getItem('univo_detection_dismissed')) return;

        // Check if already confirmed
        if (user.user_metadata.profile_confirmed) return;

        try {
            setDetecting(true);
            const response = await fetch('/api/profile/detect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

            const data = await response.json();
            console.log('Detection Raw Data:', data);
            if (data.success && data.detection && (data.detection.detectedClass || data.detection.isPrep)) {
                setDetectionResult(data.detection);
                // Only show card if the detected info is DIFFERENT from current profile
                const isDifferent = data.detection.detectedDepartment !== profile?.department ||
                    data.detection.detectedClass !== profile?.class_year;

                console.log('Detection Check:', { isDifferent, detected: data.detection, current: { dept: profile?.department, class: profile?.class_year } });

                if (isDifferent) {
                    setShowDetectionCard(true);
                }
            }
        } catch (err) {
            console.error('Detection error:', err);
        } finally {
            setDetecting(false);
        }
    };

    const dismissDetection = () => {
        setShowDetectionCard(false);
        // Optional: Store in session to not show again until refresh
        sessionStorage.setItem('univo_detection_dismissed', 'true');
    };

    const confirmDetection = async () => {
        if (!user || !detectionResult) return;

        try {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    department: detectionResult.detectedDepartment,
                    class_year: detectionResult.detectedClass
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            const { error: authError } = await supabase.auth.updateUser({
                data: { profile_confirmed: true }
            });

            if (authError) throw authError;

            toast.success('Profil bilgileriniz güncellendi!');
            setShowDetectionCard(false);
            // Update local profile state immediately
            setProfile(prev => prev ? {
                ...prev,
                department: detectionResult.detectedDepartment,
                class_year: detectionResult.detectedClass
            } : null);
            fetchProfileData();
        } catch (err: any) {
            toast.error('Güncelleme hatası: ' + err.message);
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

            toast.success('Profil fotoğrafı güncellendi');

            // Refresh router to update Header/Nav Bar
            router.refresh();

        } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error('Fotoğraf yüklenirken bir hata oluştu');
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

    const cleanDept = (dept?: string) => {
        if (!dept) return 'Bölüm Belirtilmemiş';
        return dept
            .replace(/\.base/gi, '')
            .replace(/base/gi, '')
            .replace(/dbe/gi, '')
            .replace(/\.hazırlık/gi, '')
            .replace(/hazırlık/gi, '')
            .split('.')
            .filter(Boolean)
            .join(' ')
            .trim() || 'Hazırlık';
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] py-12 px-4 transition-colors">

            {/* Lightbox Modal */}
            {isLightboxOpen && profile?.avatar_url && (
                <div
                    className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
                        <img
                            src={profile.avatar_url}
                            alt={profile.full_name}
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        />
                        <button
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
                        >
                            <X size={32} />
                        </button>
                    </div>
                </div>
            )}

            {/* Change Photo Confirmation Modal */}
            {showChangePhotoModal && (
                <div className="fixed inset-0 z-[10001] bg-black/50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 max-w-xs w-full shadow-xl border border-neutral-200 dark:border-neutral-800">
                        <h3 className="text-lg font-bold text-center mb-4 text-neutral-900 dark:text-white">Profil fotoğrafını değiştirmek ister misiniz?</h3>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowChangePhotoModal(false)}
                                className="flex-1 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                            >
                                Hayır
                            </button>
                            <button
                                onClick={triggerFileInput}
                                className="flex-1 py-2.5 rounded-lg bg-[var(--primary-color,#C8102E)] text-white font-bold hover:opacity-90"
                            >
                                Evet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Identity & Social */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden relative group transition-colors">
                        <div className="h-32 w-full absolute top-0 left-0 opacity-20" style={{ backgroundImage: 'radial-gradient(currentColor 2px, transparent 2px)', backgroundSize: '20px 20px', color: 'var(--primary-color)' }} />

                        <div className="pt-12 px-6 pb-6 text-center relative z-10">
                            <div
                                className={`w-28 h-28 mx-auto relative group/avatar transition-transform active:scale-95 ${profile.avatar_url ? 'cursor-zoom-in' : ''} ${isOwnProfile ? 'cursor-pointer' : ''}`}
                                onMouseDown={handlePressStart}
                                onMouseUp={handlePressEnd}
                                onTouchStart={handlePressStart}
                                onTouchEnd={handlePressEnd}
                                onMouseLeave={handlePressEnd} // Cancel if drag out
                            >
                                <div className="w-full h-full rounded-full p-1 border-2 border-neutral-100 dark:border-neutral-700 shadow-sm bg-transparent overflow-hidden select-none">
                                    {profile.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt={profile.full_name}
                                            className="w-full h-full rounded-full object-cover pointer-events-none" // prevent img drag
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-full flex items-center justify-center text-white text-3xl font-bold bg-primary" style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}>
                                            {profile.full_name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Hidden Input for Upload */}
                                {isOwnProfile && (
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                        disabled={isUploading}
                                    />
                                )}

                                {/* Status Indicator (Optional) */}
                                {isUploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-20">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                    </div>
                                )}
                            </div>

                            <h2 className="text-2xl font-bold font-serif text-neutral-900 dark:text-white mt-4 mb-2">
                                {profile.full_name.split(' ').map(word => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1).toLocaleLowerCase('tr-TR')).join(' ')}
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-widest mb-6">
                                {(() => {
                                    const dept = cleanDept(profile.department);
                                    const classYr = profile.class_year || 'Sınıf Belirtilmemiş';
                                    // Avoid "Hazırlık • Hazırlık" duplication
                                    if (dept === 'Hazırlık' && classYr === 'Hazırlık') {
                                        return 'İngilizce Hazırlık Programı';
                                    }
                                    return `${dept} • ${classYr}`;
                                })()}
                            </p>

                            <div className="flex justify-center gap-2 mb-6 border-t border-b border-neutral-100 dark:border-neutral-800 py-3">
                                {(isOwnProfile || profile.privacy_settings?.show_friends !== false) && (
                                    <button
                                        onClick={() => setShowFriendsModal(true)}
                                        className="flex-1 text-center hover:bg-neutral-50 dark:hover:bg-neutral-800 px-2 py-2 rounded-lg transition-colors border-r border-neutral-100 dark:border-neutral-800"
                                    >
                                        <div className="text-lg font-bold text-neutral-900 dark:text-white">{friendCount}</div>
                                        <div className="text-[10px] text-neutral-500 uppercase tracking-tighter font-bold">Arkadaş</div>
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowCommunitiesModal(true)}
                                    className="flex-1 text-center hover:bg-neutral-50 dark:hover:bg-neutral-800 px-2 py-2 rounded-lg transition-colors"
                                >
                                    <div className="text-lg font-bold text-neutral-900 dark:text-white">{followedCommunitiesCount}</div>
                                    <div className="text-[10px] text-neutral-500 uppercase tracking-tighter font-bold">Topluluk</div>
                                </button>
                            </div>

                            <FriendListModal
                                userId={targetId}
                                isOpen={showFriendsModal}
                                onClose={() => setShowFriendsModal(false)}
                                isOwnProfile={isOwnProfile}
                            />

                            <FollowedCommunitiesModal
                                userId={targetId}
                                isOpen={showCommunitiesModal}
                                onClose={() => setShowCommunitiesModal(false)}
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

                    {/* 1. Profile Completion Warning Card (Moved Up) */}
                    {isOwnProfile && profile && (() => {
                        // Check if profile is incomplete - only requires department + class_year
                        const validDepts = ['Bilgisayar Mühendisliği', 'Elektrik-Elektronik Mühendisliği', 'Makina Mühendisliği', 'İnşaat Mühendisliği', 'Endüstri Mühendisliği', 'Havacılık ve Uzay Mühendisliği', 'Kimya Mühendisliği', 'Çevre Mühendisliği', 'Gıda Mühendisliği', 'Jeoloji Mühendisliği', 'Maden Mühendisliği', 'Metalurji ve Malzeme Mühendisliği', 'Petrol ve Doğalgaz Mühendisliği', 'Mimarlık', 'Şehir ve Bölge Planlama', 'Endüstriyel Tasarım', 'Psikoloji', 'Sosyoloji', 'Felsefe', 'Tarih', 'İktisat', 'İşletme', 'Siyaset Bilimi ve Kamu Yönetimi', 'Uluslararası İlişkiler', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'İstatistik', 'Moleküler Biyoloji ve Genetik', 'İngilizce Öğretmenliği', 'Okul Öncesi Eğitimi', 'Bilgisayar ve Öğretim Teknolojileri Eğitimi', 'Fen Bilgisi Öğretmenliği', 'İlköğretim Matematik Öğretmenliği', 'Beden Eğitimi ve Spor', 'Diğer', 'İngilizce Hazırlık Programı'];
                        const validClasses = ['Hazırlık', '1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf', 'Yüksek Lisans', 'Doktora', 'Mezun'];

                        const hasValidDept = profile.department && validDepts.includes(profile.department);
                        const hasValidClass = profile.class_year && validClasses.includes(profile.class_year);

                        // Profile is incomplete only if dept OR class is missing/invalid
                        const isIncomplete = !hasValidDept || !hasValidClass;

                        return isIncomplete ? (
                            <div className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-800/50 rounded-xl p-6">
                                <div className="flex gap-4">
                                    <div className="p-3 bg-amber-100 dark:bg-amber-800/30 text-amber-600 dark:text-amber-400 rounded-full shrink-0 h-fit">
                                        <Users size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold font-serif mb-1 text-amber-900 dark:text-amber-100">
                                            Profilini Tamamla!
                                        </h3>
                                        <p className="text-sm text-amber-800/80 dark:text-amber-200/60 mb-4 leading-relaxed">
                                            Görünüşe göre profilin henüz tam değil. Profilini tamamlarsan mavi doğrulama rozeti kazanırsın!
                                        </p>
                                        <button
                                            onClick={() => router.push(`/profile/${targetId}/edit`)}
                                            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors shadow-sm"
                                        >
                                            Bilgilerimi Güncelle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null;
                    })()}

                    {/* 2. Topluluk Sahibi misiniz? (Moved Up) */}
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
                                    window.location.href = 'mailto:dogan.kerem@metu.edu.tr?subject=Topluluk Yönetim Paneli Başvurusu&body=Merhaba,%0D%0A%0D%0ATopluluk adı:%0D%0ATopluluk açıklaması:%0D%0AÜniversite:%0D%0AIletişim bilgileri:%0D%0A';
                                }}
                                className="w-full py-2.5 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm hover:opacity-90"
                                style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}
                            >
                                <Building2 size={16} />
                                Başvuru Yap
                            </button>
                        </div>
                    )}

                    {/* 3. AI Profile Detection Card */}
                    {isOwnProfile && showDetectionCard && detectionResult && (
                        <div className="bg-primary/5 dark:bg-primary/10 border-2 border-primary/30 rounded-xl p-6 relative overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <GraduationCap size={80} className="rotate-12" />
                            </div>

                            <h3 className="text-lg font-bold font-serif mb-2 text-primary dark:text-primary-light flex items-center gap-2">
                                <span className="p-1 bg-primary text-white rounded-md"><BookOpen size={16} /></span>
                                Profilini Güncelleyelim mi?
                            </h3>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4 leading-relaxed">
                                ODTÜClass derslerini analiz ettik. Bilgilerin şu şekilde görünüyor:
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={confirmDetection}
                                    className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                                >
                                    Evet, Doğru
                                </button>
                                <button
                                    onClick={dismissDetection}
                                    className="flex-1 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    Kapat
                                </button>
                            </div>
                            <button
                                onClick={() => router.push(`/profile/${targetId}/edit`)}
                                className="w-full mt-2 py-1.5 text-xs text-neutral-500 hover:text-primary transition-colors hover:underline"
                            >
                                Bilgiler Yanlış, Kendim Düzenleyeceğim
                            </button>
                        </div>
                    )}

                    {/* 4. Interests Widget (Moved to Bottom) */}
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

                {/* Right Column: Bio, Badges & Activities */}
                <div className="lg:col-span-2 space-y-8">
                    {/* 1. Bio Section */}
                    {profile.bio && (
                        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6 relative overflow-hidden transition-colors">
                            <Quote size={40} className="absolute top-2 right-2 text-neutral-100 dark:text-neutral-800 -z-10 transform rotate-12" />
                            <h2 className="text-lg font-bold font-serif mb-3 text-primary">Hakkımda</h2>
                            <p className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed italic border-l-4 border-primary pl-4">
                                {profile.bio}
                            </p>
                        </div>
                    )}

                    {/* 2. Badges Section */}
                    {badges.length > 0 && (
                        <BadgeDisplay badges={badges} />
                    )}

                    {/* 3. Activity Timeline */}
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

                    {/* 4. Upcoming Events */}
                    {showActivities && (
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
                                            <span className="inline-block px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] uppercase rounded font-bold mb-3 tracking-wider">
                                                {(event as any).community?.category || (event.category === 'EVENT' ? 'Etkinlik' : event.category) || 'Etkinlik'}
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
                    )}
                </div>
            </div>
        </div>
    );
}
