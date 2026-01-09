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
  const [displayLimit, setDisplayLimit] = useState(5);
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
            <div className="bg-neutral-100 dark:bg-neutral-800 p-8 rounded-full mb-6">
                <Users size={48} className="text-neutral-400 dark:text-neutral-500" />
            </div>
            <h2 className="text-2xl font-black font-serif mb-2 dark:text-white">Henüz Bir Topluluk Yok</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md">
                Yönetim panelini kullanmaya başlamak için önce topluluğunuzu oluşturun.
            </p>
            <Link 
                href="/dashboard/settings" 
                className="bg-[var(--primary-color)] !text-white px-8 py-3 font-bold uppercase rounded hover:bg-[var(--primary-color-hover)] transition-colors shadow-lg"
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

         <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] transition-colors">
            <h3 className="text-xl font-black uppercase tracking-tight mb-8 border-b-2 border-neutral-100 dark:border-neutral-800 pb-2 dark:text-white">Son Aktiviteler</h3>
            {activityFeed.length > 0 ? (
                <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-[19px] top-2 bottom-8 w-0.5 bg-neutral-100 dark:bg-neutral-800"></div>

                    <div className="space-y-8">
                        {activityFeed.slice(0, displayLimit).map((activity) => (
                            <ActivityItem key={activity.id} item={activity} />
                        ))}
                    </div>
                    
                    {displayLimit < activityFeed.length && (
                        <div className="mt-12 text-center relative z-10">
                            <button 
                                onClick={() => setDisplayLimit(curr => curr + 10)}
                                className="px-6 py-2 bg-neutral-100 dark:bg-neutral-800 text-xs font-black uppercase text-neutral-600 dark:text-neutral-400 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all border-2 border-transparent hover:border-black dark:hover:border-white"
                            >
                                DAHA FAZLA YÜKLE
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-neutral-500 dark:text-neutral-400 italic text-center py-4">Henüz yeni bir aktivite yok.</p>
            )}
        </div>
    </div>
  );
}

 function ActivityItem({ item }: { item: any }) {
    const getIcon = () => {
        if (item.type === 'feedback') return <div className="w-10 h-10 rounded-full bg-yellow-400/10 text-yellow-500 flex items-center justify-center border-2 border-yellow-400/20"><Star size={18} fill="currentColor" /></div>;
        if (item.type === 'follower') return <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center border-2 border-blue-500/20"><Users size={18} fill="currentColor" /></div>;
        if (item.type === 'event_complete') return <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center border-2 border-green-500/20"><Calendar size={18} fill="currentColor" /></div>;
        return null;
    };

    return (
        <div className="flex gap-6 relative group">
            <div className="shrink-0 relative z-10 transition-transform group-hover:scale-110 duration-300">
                {getIcon()}
            </div>
            <div className="flex-1 pt-1 pb-4">
                <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white leading-relaxed">
                        {item.type === 'feedback' && (
                            <>
                                <span className="font-black hover:text-[var(--primary-color)] cursor-pointer transition-colors">{item.user}</span>, 
                                <span className="font-bold italic"> {item.event}</span> etkinliğine 
                                <span className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 rounded text-[10px] font-black uppercase border border-yellow-400/20">
                                    <Star size={10} fill="currentColor"/> {item.rating} Puan
                                </span> verdi.
                            </>
                        )}
                        {item.type === 'follower' && (
                            <>
                                <span className="font-black hover:text-[var(--primary-color)] cursor-pointer transition-colors">{item.user}</span> topluluğa katıldı.
                            </>
                        )}
                        {item.type === 'event_complete' && (
                            <>
                                <span className="font-black">{item.title}</span> etkinliği başarıyla tamamlandı.
                            </>
                        )}
                    </p>
                    <span className="text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-widest whitespace-nowrap ml-4">
                        {item.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </span>
                </div>
                {item.type === 'feedback' && item.comment && (
                   <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-3 border-l-2 border-yellow-400 rounded-r transition-colors italic">
                      "{item.comment}"
                   </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, sub, change }: any) {
    return (
        <div className="bg-white dark:bg-neutral-900 p-6 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm hover:border-[var(--primary-color)] dark:hover:border-[var(--primary-color)] transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg group-hover:bg-[var(--primary-color)] group-hover:text-white transition-colors dark:text-white">
                    {icon}
                </div>
                {change && <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">{change}</span>}
            </div>
            <h4 className="text-3xl font-black font-sans text-neutral-900 dark:text-white mb-1">{value}</h4>
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase text-neutral-500 dark:text-neutral-400 tracking-wide">{label}</span>
                {sub && <span className="text-xs text-neutral-400 dark:text-neutral-500">{sub}</span>}
            </div>
        </div>
    );
}
