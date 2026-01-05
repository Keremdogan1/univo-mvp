'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Calendar, Star, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverview() {
  const { user } = useAuth();

  // State for stats
  const [stats, setStats] = useState({
      followers: 0,
      totalEvents: 0,
      avgRating: 0,
      feedbackCount: 0
  });

  // State for activity feed
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [hasCommunity, setHasCommunity] = useState(false);
  const [noCommunity, setNoCommunity] = useState(false);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  async function fetchStats() {
      // 1. Get Community ID
      const { data: communities } = await supabase.from('communities').select('id').eq('admin_id', user?.id).limit(1);
      const community = communities?.[0];
      
      if (!community) {
          setNoCommunity(true);
          return;
      }

      // 2. FETCH ALL DATA IN PARALLEL
      const [
          { count: followerCount, data: followersData },
          { count: eventCount, data: eventsData },
          { data: feedbackData }
      ] = await Promise.all([
          // Followers
          supabase.from('community_followers')
             .select('created_at, profiles:user_id(full_name)', { count: 'exact' })
             .eq('community_id', community.id)
             .order('created_at', { ascending: false }),
          
          // Events
          supabase.from('events')
             .select('id, title, date', { count: 'exact' })
             .eq('community_id', community.id)
             .order('date', { ascending: false }),

          // Feedback (Fetch ALL to mix in)
          supabase.from('event_feedback')
             .select('id, rating, created_at, comment, event_id, profiles:user_id(full_name), events:event_id(title)')
             .order('created_at', { ascending: false })
      ]);

      // 3. Process Stats
      let totalRating = 0;
      let countRating = 0;
      if (feedbackData) {
          const validEventIds = new Set((eventsData || []).map(e => e.id));
          const communityFeedbacks = feedbackData.filter(f => validEventIds.has(f.event_id)); // Use event_id directly
          
          countRating = communityFeedbacks.length;
          totalRating = communityFeedbacks.reduce((acc, curr) => acc + curr.rating, 0);
      }
      
      // RE-DO FETCHING FOR ACCURACY separate from Feed
      // We need to fetch specific items for the feed carefully.
      
      // A. Followers Feed
      const feedFollowers = (followersData || []).map((f: any) => ({
          type: 'follower',
          id: `fol-${f.created_at}`, // virtual ID
          date: new Date(f.created_at),
          user: Array.isArray(f.profiles) ? f.profiles[0]?.full_name : f.profiles?.full_name || 'Bir kullanıcı',
          text: 'topluluğa katıldı.'
      }));

      // B. Events Feed (Completed)
      const now = new Date();
      const feedEvents = (eventsData || []).filter((e: any) => new Date(e.date) < now).map((e: any) => ({
          type: 'event_complete',
          id: e.id,
          date: new Date(e.date), // Use event date as "completion" time
          title: e.title,
          text: 'etkinliği tamamlandı.'
      }));

      // C. Feedback Feed (We need to filter by community events)
      let validFeedbacks: any[] = [];
      if (eventsData && eventsData.length > 0) {
          const eIds = eventsData.map((e: any) => e.id);
           const { data: fdb } = await supabase
            .from('event_feedback')
            .select('id, rating, created_at, comment, event_id, profiles:user_id(full_name), events:event_id(title)')
            .in('event_id', eIds)
            .order('created_at', { ascending: false });
           
           if (fdb) {
               validFeedbacks = fdb;
               // Re-calculate rating based on strictly filtered data for accuracy
               countRating = fdb.length;
               totalRating = fdb.reduce((acc, curr) => acc + curr.rating, 0);
           }
      }
      
      const feedFeedback = validFeedbacks.map((f: any) => ({
          type: 'feedback',
          id: f.id,
          date: new Date(f.created_at),
          user: Array.isArray(f.profiles) ? f.profiles[0]?.full_name : f.profiles?.full_name || 'Anonim',
          event: Array.isArray(f.events) ? f.events[0]?.title : f.events?.title,
          rating: f.rating,
          text: `etkinliğine ${f.rating} puan verdi.` 
      }));

      // 4. Combine & Sort
      const allActivities = [...feedFollowers, ...feedEvents, ...feedFeedback]
          .sort((a, b) => b.date.getTime() - a.date.getTime());

      setActivityFeed(allActivities);
      
      setStats({
          followers: followerCount || 0,
          totalEvents: eventCount || 0,
          avgRating: countRating > 0 ? (totalRating / countRating) : 0,
          feedbackCount: countRating
      });
      setHasCommunity(true);
  }

  if (noCommunity) {
      // ... returning the same No Community component ...
      return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8">
            <div className="bg-neutral-100 p-8 rounded-full mb-6">
                <Users size={48} className="text-neutral-400" />
            </div>
            <h2 className="text-2xl font-black font-serif mb-2">Henüz Bir Topluluk Yok</h2>
            <p className="text-neutral-600 mb-8 max-w-md">
                Yönetim panelini kullanmaya başlamak için önce topluluğunuzu oluşturun.
            </p>
            <Link 
                href="/dashboard/settings" 
                className="bg-[#C8102E] !text-white px-8 py-3 font-bold uppercase rounded hover:bg-[#a60d26] transition-colors shadow-lg"
            >
                Topluluk Oluştur
            </Link>
        </div>
      );
  }

  return (
    <div>
        <h2 className="text-3xl font-black font-serif mb-8 text-neutral-900 border-b-4 border-black pb-4 inline-block">
            GENEL BAKIŞ
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard label="Takipçi Sayısı" value={stats.followers} icon={<Users size={24} />} />
            <StatCard label="Düzenlenen Etkinlik" value={stats.totalEvents} icon={<Calendar size={24} />} />
            <StatCard label="Ortalama Puan" value={stats.avgRating.toFixed(1)} icon={<Star size={24} />} sub={`(${stats.feedbackCount} değerlendirme)`} />
            <StatCard label="Etkileşim" value={stats.feedbackCount > 5 ? "Yüksek" : stats.feedbackCount > 0 ? "Orta" : "Düşük"} icon={<TrendingUp size={24} />} />
        </div>

        <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-neutral-200 pb-2">Son Aktiviteler</h3>
            {activityFeed.length > 0 ? (
                <>
                    <div className="space-y-4">
                        {activityFeed.slice(0, displayLimit).map((activity) => (
                            <ActivityItem key={activity.id} item={activity} />
                        ))}
                    </div>
                    
                    {displayLimit < activityFeed.length && (
                        <div className="mt-6 text-center">
                            <button 
                                onClick={() => setDisplayLimit(curr => curr + 10)}
                                className="text-xs font-bold uppercase text-neutral-500 hover:text-black hover:underline transition-all"
                            >
                                Daha Fazla Yükle
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <p className="text-neutral-500 italic">Henüz yeni bir aktivite yok.</p>
            )}
        </div>
    </div>
  );
}

function ActivityItem({ item }: { item: any }) {
    if (item.type === 'feedback') {
        return (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded border border-neutral-100">
                 <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0"></div>
                 <p className="text-sm text-neutral-700">
                    <span className="font-bold">{item.user}</span>, 
                    <span className="font-bold"> {item.event}</span> etkinliğine 
                    <span className="font-bold"> {item.rating} puan</span> verdi.
                 </p>
                 <span className="text-xs text-neutral-400 ml-auto whitespace-nowrap">{item.date.toLocaleDateString('tr-TR')}</span>
            </div>
        );
    }
    
    if (item.type === 'follower') {
        return (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded border border-neutral-100">
                 <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                 <p className="text-sm text-neutral-700">
                    <span className="font-bold">{item.user}</span> topluluğa katıldı.
                 </p>
                 <span className="text-xs text-neutral-400 ml-auto whitespace-nowrap">{item.date.toLocaleDateString('tr-TR')}</span>
            </div>
        );
    }

    if (item.type === 'event_complete') {
        return (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded border border-neutral-100">
                 <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                 <p className="text-sm text-neutral-700">
                    <span className="font-bold">{item.title}</span> etkinliği başarıyla tamamlandı.
                 </p>
                 <span className="text-xs text-neutral-400 ml-auto whitespace-nowrap">{item.date.toLocaleDateString('tr-TR')}</span>
            </div>
        );
    }
    return null;
}

function StatCard({ label, value, icon, sub, change }: any) {
    return (
        <div className="bg-white p-6 border-2 border-neutral-200 rounded-xl shadow-sm hover:border-[#C8102E] transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-neutral-100 rounded-lg group-hover:bg-[#C8102E] group-hover:text-white transition-colors">
                    {icon}
                </div>
                {change && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{change}</span>}
            </div>
            <h4 className="text-3xl font-black font-sans text-neutral-900 mb-1">{value}</h4>
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase text-neutral-500 tracking-wide">{label}</span>
                {sub && <span className="text-xs text-neutral-400">{sub}</span>}
            </div>
        </div>
    );
}
