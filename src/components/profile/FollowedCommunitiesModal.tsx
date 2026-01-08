'use client';

import { useState, useEffect } from 'react';
import { X, Building2, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Community {
  id: string;
  name: string;
  category: string;
  logo_url: string | null;
}

interface FollowedCommunitiesModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function FollowedCommunitiesModal({ userId, isOpen, onClose }: FollowedCommunitiesModalProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      fetchFollowedCommunities();
    }
  }, [isOpen, userId]);

  const fetchFollowedCommunities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_followers')
        .select(`
          community:communities (
            id,
            name,
            category,
            logo_url
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      setCommunities(data?.map((item: any) => item.community) || []);
    } catch (error) {
      console.error('Error fetching followed communities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <h3 className="text-lg font-bold font-serif flex items-center gap-2 dark:text-white">
            <Building2 size={20} className="text-primary" />
            Takip Edilen Topluluklar
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading ? (
            <div className="p-8 text-center text-neutral-500">Yükleniyor...</div>
          ) : communities.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">Henüz bir topluluk takip edilmiyor.</div>
          ) : (
            <div className="space-y-1">
              {communities.map((community) => (
                <Link
                  key={community.id}
                  href={`/community/${community.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-700">
                    {community.logo_url ? (
                      <img src={community.logo_url} alt={community.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={24} className="text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-neutral-900 dark:text-white truncate group-hover:text-primary transition-colors">
                      {community.name}
                    </h4>
                    <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                      {community.category}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
