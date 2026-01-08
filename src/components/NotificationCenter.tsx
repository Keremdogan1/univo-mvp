'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  actor: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Real-time subscription for new notifications
      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Notification change detected:', payload.eventType);
            fetchNotifications(); // Refresh both list and count for any change
          }
        )
        .subscribe((status) => {
          console.log(`Notification subscription status for ${user.id}:`, status);
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/notifications?limit=10', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched notifications:', data.notifications?.length, 'Unread:', data.unreadCount);
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error('Fetch notifications failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFriendRequest = async (actorId: string, action: 'accept' | 'reject', notificationId: string) => {
    setActingId(notificationId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Get friendship ID
      const statusRes = await fetch(`/api/users/${actorId}/friend-request`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const statusData = await statusRes.json();
      
      if (!statusData.friendshipId) {
        console.error('Friendship not found');
        return;
      }

      // 2. Respond to request
      const response = await fetch(`/api/friend-requests/${statusData.friendshipId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        // Mark notification as read (or delete it)
        markAsRead(notificationId);
      }
    } catch (error) {
      console.error(`Error handling friend request (${action}):`, error);
    } finally {
      setActingId(null);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins}d önce`;
    if (diffHours < 24) return `${diffHours}s önce`;
    if (diffDays < 7) return `${diffDays}g önce`;
    return date.toLocaleDateString('tr-TR');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <Bell size={20} className="text-neutral-700 dark:text-neutral-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute right-0 sm:right-0 left-0 sm:left-auto top-[64px] sm:top-full sm:mt-2 mx-auto sm:mx-0 w-[calc(100%-32px)] sm:w-80 bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] z-50 max-h-[calc(100vh-180px)] sm:max-h-[500px] flex flex-col">
          <div className="p-4 border-b-2 border-black dark:border-white flex justify-between items-center">
            <h3 className="font-bold font-serif text-lg dark:text-white">Bildirimler</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={isLoading}
                className="text-xs font-bold hover:underline disabled:opacity-50"
                style={{ color: 'var(--primary-color, #C8102E)' }}
              >
                Tümünü Okundu İşaretle
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                Henüz bildirim yok
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
                    !notification.read ? 'bg-neutral-50/50 dark:bg-white/[0.02]' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {notification.actor && (
                      <Link href={`/profile/${notification.actor.id}`}>
                        <div 
                          className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0"
                          style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}
                        >
                          {notification.actor.full_name?.charAt(0) || '?'}
                        </div>
                      </Link>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-800 dark:text-neutral-200 mb-1">
                        {notification.message}
                      </p>
                      
                      {notification.type === 'friend_request' && !notification.read && notification.actor ? (
                        <div className="flex gap-2 mt-2 mb-1">
                          <button
                            onClick={() => handleFriendRequest(notification.actor!.id, 'accept', notification.id)}
                            disabled={actingId === notification.id}
                            className="text-white text-xs font-bold px-3 py-1.5 rounded-md hover:opacity-90 transition-colors disabled:opacity-50"
                            style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}
                          >
                            {actingId === notification.id ? '...' : 'Kabul Et'}
                          </button>
                          <button
                            onClick={() => handleFriendRequest(notification.actor!.id, 'reject', notification.id)}
                            disabled={actingId === notification.id}
                            className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                          >
                            {actingId === notification.id ? '...' : 'Reddet'}
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {getRelativeTime(notification.created_at)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-start gap-1">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors group"
                          title="Okundu işaretle"
                        >
                          <Check size={16} className="text-neutral-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
