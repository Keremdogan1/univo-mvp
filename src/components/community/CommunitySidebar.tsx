'use client';

import { useState } from 'react';
import { Users, Instagram, Twitter, Globe } from 'lucide-react';
import FollowButton from '@/components/FollowButton';
import CommunityFollowersModal from './CommunityFollowersModal';

interface CommunitySidebarProps {
    community: any;
    followerCount: number;
    eventCount: number;
}

export default function CommunitySidebar({ community, followerCount, eventCount }: CommunitySidebarProps) {
    const [showFollowersModal, setShowFollowersModal] = useState(false);

    return (
        <div className="bg-white dark:bg-neutral-900 border-4 border-black dark:border-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] sticky top-24 transition-colors">
            
            {/* Logo */}
            <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-700">
                {community.logo_url ? (
                    <img src={community.logo_url} alt={community.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                    <Users size={32} className="text-neutral-400" />
                )}
            </div>
            
            {/* Name */}
            <h1 className="text-2xl font-black font-serif text-center mb-2 leading-tight dark:text-white">
                {community.name}
            </h1>

            {/* Stats - Follower Count is Clickable */}
            <div className="grid grid-cols-2 gap-2 border-y-2 border-neutral-100 dark:border-neutral-800 py-4 my-4 text-center">
                <div 
                    onClick={() => setShowFollowersModal(true)}
                    className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors p-1"
                >
                    <span className="block font-bold text-xl dark:text-white">{followerCount}</span>
                    <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">Takipçi</span>
                </div>
                <div className="p-1">
                    <span className="block font-bold text-xl dark:text-white">{eventCount}</span>
                    <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">Etkinlik</span>
                </div>
            </div>

            {/* Follow Button (Moved Above About) */}
            <div className="mb-6">
                 <FollowButton communityId={community.id} initialIsFollowing={false} />
            </div>

            {/* About Section */}
            <div className="mb-6">
                <h3 className="text-sm font-bold uppercase mb-2 dark:text-white">Hakkında</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-serif leading-relaxed">
                    {community.description || 'Bu topluluk hakkında henüz bir açıklama girilmemiş.'}
                </p>
            </div>

            {/* Social Icons (Moved to Bottom) */}
            <div className="flex justify-center gap-4 text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                {community.instagram_url && (
                    <a href={community.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-black dark:hover:text-white transition-colors p-2">
                        <Instagram size={20} />
                    </a>
                )}
                {community.twitter_url && (
                    <a href={community.twitter_url} target="_blank" rel="noopener noreferrer" className="hover:text-black dark:hover:text-white transition-colors p-2">
                        <Twitter size={20} />
                    </a>
                )}
                {community.website_url && (
                    <a href={community.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-black dark:hover:text-white transition-colors p-2">
                        <Globe size={20} />
                    </a>
                )}
            </div>

            <CommunityFollowersModal 
                communityId={community.id}
                isOpen={showFollowersModal}
                onClose={() => setShowFollowersModal(false)}
            />
        </div>
    );
}
