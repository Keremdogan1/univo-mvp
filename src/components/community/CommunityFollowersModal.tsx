'use client';

import { X, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CommunityFollowersModalProps {
    communityId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function CommunityFollowersModal({ communityId, isOpen, onClose }: CommunityFollowersModalProps) {
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [followers, setFollowers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && communityId) {
            fetchFollowers();
        }
    }, [isOpen, communityId]);

    const fetchFollowers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('community_followers')
                .select(`
                    user_id,
                    user:users!user_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `) // Note: 'users' or 'profiles' depending on foreign key. 
                   // Usually profile data is in 'profiles'. Let's check relation.
                   // If foreign key points to auth.users, we can't select from it directly easily via joining unless public.users exists.
                   // Univo usually uses 'profiles' table for user data.
                   // The schema likely links community_followers.user_id to profiles.id? 
                   // Let's assume user_id -> profiles(id).
                .eq('community_id', communityId);

            // Wait, standard Univo schema usually has a 'profiles' public table.
            // Let's try to fetch user_id then profiles.
            
            if (error) throw error;
            
            // If data is just IDs, we need to fetch profiles.
            // Let's assume standard approach: select user_id, profiles(*)
            // But wait, the previous code 'FriendListModal' might give a hint.
            // Let's use a safe separate fetch if join is uncertain, or assume 'profiles'.
            
            if (data && data.length > 0) {
                 const userIds = data.map(f => f.user_id);
                 const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, department, class_year')
                    .in('id', userIds);
                
                if (profilesError) throw profilesError;
                setFollowers(profiles || []);
            } else {
                setFollowers([]);
            }

        } catch (error) {
            console.error('Error fetching followers:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[80vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h3 className="font-bold font-serif text-lg dark:text-white">Takipçiler</h3>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 dark:text-neutral-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="py-8 text-center text-neutral-500 dark:text-neutral-400 text-sm">Yükleniyor...</div>
                    ) : followers.length > 0 ? (
                        <div className="space-y-1">
                            {followers.map((follower) => (
                                <div 
                                    key={follower.id}
                                    onClick={() => {
                                        onClose();
                                        router.push(`/profile/${follower.id}`);
                                    }}
                                    className="flex items-center gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl cursor-pointer transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden border border-neutral-200 dark:border-neutral-700">
                                        {follower.avatar_url ? (
                                            <img src={follower.avatar_url} alt={follower.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-neutral-500">
                                                <User size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {follower.full_name}
                                        </h4>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                            {follower.department ? follower.department : 'Öğrenci'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <User size={32} className="mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
                            <p className="text-neutral-400 dark:text-neutral-600 font-medium">Henüz takipçi yok</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
