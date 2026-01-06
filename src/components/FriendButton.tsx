'use client';

import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, UserX, Clock, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface FriendButtonProps {
  targetUserId: string;
  onFriendshipChange?: (status: 'none' | 'pending' | 'accepted') => void;
  variant?: 'default' | 'menu-item' | 'profile';
}

export default function FriendButton({ 
  targetUserId, 
  onFriendshipChange,
  variant = 'default'
}: FriendButtonProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [isSentByMe, setIsSentByMe] = useState(false);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkFriendshipStatus();
    }
  }, [user, targetUserId]);

  const checkFriendshipStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/users/${targetUserId}/friend-request`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
        setIsSentByMe(data.isSentByMe);
        setFriendshipId(data.friendshipId);
      }
    } catch (error) {
      console.error('Error checking friendship status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendRequest = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/users/${targetUserId}/friend-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        setStatus('pending');
        setIsSentByMe(true);
        if (onFriendshipChange) onFriendshipChange('pending');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelRequest = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/users/${targetUserId}/friend-request`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        setStatus('none');
        setFriendshipId(null);
        if (onFriendshipChange) onFriendshipChange('none');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const respondToRequest = async (action: 'accept' | 'reject', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user || !friendshipId) return;
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/friend-requests/${friendshipId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        if (action === 'accept') {
          setStatus('accepted');
          if (onFriendshipChange) onFriendshipChange('accepted');
        } else {
          setStatus('none');
          setFriendshipId(null);
          if (onFriendshipChange) onFriendshipChange('none');
        }
      }
    } catch (error) {
      console.error(`Error responding to request (${action}):`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Styles based on variant
  const getButtonStyles = (type: 'action' | 'pending' | 'friend') => {
    if (variant === 'menu-item') {
      return "w-full text-left px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2 transition-colors";
    }
    
    if (variant === 'profile') {
        const base = "w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm mb-4";
        switch (type) {
            case 'action': return `${base} bg-[#C8102E] text-white hover:bg-[#A00D25]`;
            case 'pending': return `${base} bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200`;
            case 'friend': return `${base} bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-[#C8102E] hover:text-[#C8102E] hover:bg-[#C8102E]/5 dark:hover:bg-[#C8102E]/10`;
        }
    }
    
    // Default styles
    switch (type) {
      case 'action': // Add/Accept
        return "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-[#C8102E] text-white hover:bg-[#A00D25] transition-colors shadow-sm";
      case 'pending':
        return "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors";
      case 'friend': 
        return "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-red-100 hover:text-red-700 hover:border-red-200 transition-all group";
    }
  };

  // Don't show button if not logged in or viewing own profile
  if (!user || user.id === targetUserId) {
    return null;
  }

  if (isLoading) {
    if (variant === 'menu-item') return <div className="px-4 py-2 text-sm text-neutral-400">Yükleniyor...</div>;
    return <div className="w-32 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>;
  }

  if (status === 'accepted') {
    return (
      <button
        onClick={cancelRequest}
        className={getButtonStyles('friend')}
      >
        <UserCheck size={variant === 'menu-item' ? 14 : 18} className="group-hover:hidden" />
        <UserX size={variant === 'menu-item' ? 14 : 18} className="hidden group-hover:block" />
        <span className="group-hover:hidden">Arkadaşsınız</span>
        <span className="hidden group-hover:inline">Arkadaşlıktan Çıkar</span>
      </button>
    );
  }

  if (status === 'pending') {
    if (isSentByMe) {
      return (
        <button
          onClick={cancelRequest} 
          className={getButtonStyles('pending')}
        >
          <Clock size={variant === 'menu-item' ? 14 : 18} />
          İstek Gönderildi
        </button>
      );
    } else {
      // Received request - For menu item, maybe just show "Accept" or simplified view
      if (variant === 'menu-item') {
         return (
             <button
                onClick={(e) => respondToRequest('accept', e)}
                className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 text-[#C8102E] flex items-center gap-2 transition-colors"
             >
                <UserPlus size={14} />
                İsteği Kabul Et
             </button>
         );
      }

      return (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => respondToRequest('accept', e)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg font-bold text-sm bg-[#C8102E] text-white hover:bg-[#A00D25] transition-colors"
          >
            <Check size={16} />
            Kabul Et
          </button>
          <button
            onClick={(e) => respondToRequest('reject', e)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg font-bold text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 transition-colors"
          >
            <X size={16} />
            Reddet
          </button>
        </div>
      );
    }
  }

  // Not friends
  return (
    <button
      onClick={sendRequest}
      className={variant === 'menu-item' ? 
        "w-full text-left px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-2 transition-colors" : 
        getButtonStyles('action')}
    >
      <UserPlus size={variant === 'menu-item' ? 14 : 18} />
      Arkadaş Ekle
    </button>
  );
}
