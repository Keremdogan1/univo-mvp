'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function FollowButton({ communityId, initialIsFollowing }: { communityId: string, initialIsFollowing: boolean }) {
    const { user } = useAuth();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function checkStatus() {
            if (!user) return;
            const { data } = await supabase
                .from('community_followers')
                .select('id')
                .eq('user_id', user.id)
                .eq('community_id', communityId)
                .single();
            if (data) setIsFollowing(true);
        }
        checkStatus();
    }, [user, communityId]);

    const handleFollow = async () => {
        if (!user) {
            alert("Lütfen giriş yapın.");
            return;
        }

        setLoading(true);
        if (isFollowing) {
            // Unfollow
            const { error } = await supabase
                .from('community_followers')
                .delete()
                .eq('user_id', user.id)
                .eq('community_id', communityId);
            
            if (!error) setIsFollowing(false);
        } else {
            // Follow
            const { error } = await supabase
                .from('community_followers')
                .insert({ user_id: user.id, community_id: communityId });
            
            if (!error) setIsFollowing(true);
        }
        setLoading(false);
    };

    return (
        <button 
            onClick={handleFollow}
            disabled={loading}
            className={`w-full py-3 font-bold uppercase text-sm transition-colors border-2 ${
                isFollowing 
                ? 'bg-white text-black border-black hover:bg-neutral-100' 
                : 'bg-black text-white border-black hover:bg-neutral-800'
            }`}
        >
            {loading ? 'İşleniyor...' : (isFollowing ? 'Takip Ediliyor' : 'Takip Et')}
        </button>
    );
}
