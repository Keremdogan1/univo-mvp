'use client';

import { useState, useEffect } from 'react';
import { X, Search, UserX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Friend {
  id: string;
  full_name: string;
  avatar_url: string | null;
  department?: string;
  university?: string;
  friendshipId: string;
  friendsSince: string;
}

interface FriendListModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  isOwnProfile: boolean;
}

export default function FriendListModal({ userId, isOpen, onClose, isOwnProfile }: FriendListModalProps) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen, userId]);

  const fetchFriends = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {};
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/users/${userId}/friends`, { headers, cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        if (data.isPrivate) {
            setError('Bu kullanıcının arkadaş listesi gizli.');
        } else {
            throw new Error(data.error || 'Failed to fetch friends');
        }
      } else {
        setFriends(data.friends || []);
      }
    } catch (err: any) {
      console.error('Error fetching friends:', err);
      setError(err.message || 'Arkadaş listesi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Arkadaşlıktan çıkarmak istediğine emin misin?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/users/${friendId}/friend-request`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        setFriends(prev => prev.filter(f => f.id !== friendId));
      }
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  };

  if (!isOpen) return null;

  const filteredFriends = friends.filter(friend => 
    friend.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="text-lg font-bold font-serif dark:text-white">Arkadaşlar</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Arkadaşlarda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] transition-all dark:text-white"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-neutral-200 rounded-full animate-spin mx-auto mb-2" style={{ borderTopColor: 'var(--primary-color, #C8102E)' }}></div>
              <p className="text-sm text-neutral-500">Yükleniyor...</p>
            </div>
          ) : error ? (
             <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
                <p>{error}</p>
             </div>
          ) : filteredFriends.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
              {searchQuery ? 'Sonuç bulunamadı.' : 'Henüz arkadaş yok.'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFriends.map((friend) => (
                <Link 
                  key={friend.id} 
                  href={`/profile/${friend.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group"
                >
                  <div 
                    className={`w-12 h-12 rounded-full overflow-hidden shrink-0 ${friend.avatar_url ? 'bg-neutral-200 dark:bg-neutral-700' : 'bg-primary text-white'}`}
                    style={!friend.avatar_url ? { backgroundColor: 'var(--primary-color, #C8102E)' } : undefined}
                  >
                    {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt={friend.full_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-lg">
                            {friend.full_name?.charAt(0)}
                        </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-neutral-900 dark:text-white truncate">{friend.full_name}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {friend.department || (friend.university || 'Öğrenci')}
                    </p>
                  </div>

                  {isOwnProfile && (
                    <button
                        onClick={(e) => removeFriend(friend.id, e)}
                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Arkadaşlıktan Çıkar"
                    >
                        <UserX size={18} />
                    </button>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
