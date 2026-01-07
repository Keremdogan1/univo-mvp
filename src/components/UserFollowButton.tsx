'use client';

import { useState, useEffect } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface UserFollowButtonProps {
  targetUserId: string;
  initialFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean, followerCount: number) => void;
}

export default function UserFollowButton({ 
  targetUserId, 
  initialFollowing = false,
  onFollowChange 
}: UserFollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkFollowStatus();
    }
  }, [user, targetUserId]);

  const checkFollowStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newFollowingState = !isFollowing;
        setIsFollowing(newFollowingState);
        
        if (onFollowChange) {
          onFollowChange(newFollowingState, data.followerCount);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if not logged in or viewing own profile
  if (!user || user.id === targetUserId) {
    return null;
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50 ${
        isFollowing
          ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-700'
          : 'bg-primary text-white hover:bg-primary-hover'
      }`}
    >
      {isFollowing ? (
        <>
          <UserMinus size={16} />
          Takipten Çıkar
        </>
      ) : (
        <>
          <UserPlus size={16} />
          Takip Et
        </>
      )}
    </button>
  );
}
