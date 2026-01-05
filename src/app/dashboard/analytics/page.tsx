'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Star, MessageSquare, User } from 'lucide-react';

function AnalyticsContent() {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [followersData, setFollowersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'ALL' | '1M' | '2W' | '3M'>('ALL');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  async function fetchData() {
    // ... existing fetch logic unchanged, just keeping it here ...
    // To save tokens, I will assume the fetch logic is fine and just needs to be preserved.
    // However, since I'm doing a huge replace, I have to provide the code.
    // I will copy the fetch logic from the previous file view.
    
    try {
        const { data: communities } = await supabase.from('communities').select('id').eq('admin_id', user?.id).limit(1);
        const community = communities?.[0];
        if (!community) return;

        // 1. Fetch Events & Attendance
        const { data: events } = await supabase
            .from('events')
            .select(`
                id, 
                title, 
                date,
                event_attendees(count)
            `)
            .eq('community_id', community.id)
            .order('date', { ascending: true });

        if (events) {
            const chartData = events.map(e => ({
                name: e.title,
                timestamp: new Date(e.date).getTime(),
                katilimci: e.event_attendees?.[0]?.count || 0,
                dateObj: new Date(e.date)
            }));
            setAttendanceData(chartData);
        }

        // 2. Fetch Detailed Feedback
        if (events && events.length > 0) {
            const eventIds = events.map(e => e.id);
            const { data: feedbacks } = await supabase
                .from('event_feedback')
                .select(`
                    id,
                    rating,
                    comment,
                    created_at,
                    user_id,
                    profiles:user_id (full_name, avatar_url),
                    events:event_id (title)
                `)
                .in('event_id', eventIds)
                .order('created_at', { ascending: false });
            
            if (feedbacks) {
                setFeedbackList(feedbacks);
            }
        }

        // 3. Fetch Follower Growth
        const { data: followers } = await supabase
            .from('community_followers')
            .select('created_at')
            .eq('community_id', community.id)
            .order('created_at', { ascending: true });

        if (followers) {
            const fData = followers.map((f, index) => ({
                timestamp: new Date(f.created_at).getTime(),
                count: index + 1,
                dateObj: new Date(f.created_at)
            }));
            setFollowersData(fData);
        }

    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  }

  const getFilteredData = (data: any[]) => {
      if (timeRange === 'ALL') return data;
      
      const now = new Date();
      let threshold = new Date();
      
      if (timeRange === '2W') threshold.setDate(now.getDate() - 14);
      if (timeRange === '1M') threshold.setMonth(now.getMonth() - 1);
      if (timeRange === '3M') threshold.setMonth(now.getMonth() - 3);

      return data.filter(item => item.dateObj >= threshold);
  };

  const filteredAttendance = getFilteredData(attendanceData);
  const filteredFollowers = getFilteredData(followersData);

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="space-y-8">
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <h2 className="text-3xl font-black font-serif">Analizler</h2>
            <div className="flex bg-white rounded-lg border border-neutral-300 p-1 shadow-sm">
                {(['2W', '1M', '3M', 'ALL'] as const).map((r) => (
                    <button
                        key={r}
                        onClick={() => setTimeRange(r)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                            timeRange === r 
                            ? 'bg-black text-white shadow-md' 
                            : 'text-neutral-500 hover:bg-neutral-100'
                        }`}
                    >
                        {r === '2W' ? 'Son 2 Hafta' : r === '1M' ? 'Son 1 Ay' : r === '3M' ? 'Son 3 Ay' : 'Tümü'}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Event Attendance Chart */}
            <div>
                <h3 className="text-xl font-bold font-serif mb-4">Etkinlik Katılımı</h3>
                <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filteredAttendance}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis 
                                dataKey="timestamp" 
                                type="number" 
                                domain={['dataMin', 'dataMax']} 
                                tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('tr-TR')}
                                height={60} 
                                angle={-30} 
                                textAnchor="end"
                                tick={{fontSize: 12}}
                            />
                            <YAxis />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: '2px solid black' }}
                                labelFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('tr-TR')}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="katilimci" 
                                name="Katılımcı Sayısı"
                                stroke="#C8102E" 
                                strokeWidth={3} 
                                dot={{ fill: '#C8102E', strokeWidth: 2 }}
                                activeDot={{ r: 8 }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Follower Growth Chart */}
            <div>
                <h3 className="text-xl font-bold font-serif mb-4">Takipçi Gelişimi</h3>
                <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filteredFollowers}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis 
                                dataKey="timestamp" 
                                type="number" 
                                domain={['dataMin', 'dataMax']} 
                                tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('tr-TR')}
                                height={60} 
                                angle={-30} 
                                textAnchor="end"
                                tick={{fontSize: 12}}
                            />
                            <YAxis allowDecimals={false} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: '2px solid black' }}
                                labelFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('tr-TR')}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="count" 
                                name="Toplam Takipçi"
                                stroke="#4F46E5" 
                                strokeWidth={3} 
                                dot={false}
                                activeDot={{ r: 8 }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-3xl font-black font-serif mb-6 flex items-center gap-3">
                <MessageSquare size={32} />
                Gelen Değerlendirmeler
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {feedbackList.length > 0 ? feedbackList.map((item) => (
                    <div key={item.id} className="bg-white p-6 border border-neutral-200 rounded-xl shadow-sm hover:border-black transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden border border-neutral-200">
                                    {item.profiles?.avatar_url ? (
                                        <img src={item.profiles.avatar_url} alt="user" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} className="text-neutral-400" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-neutral-900">{item.profiles?.full_name || 'Anonim'}</h4>
                                    <span className="text-xs text-neutral-500 block">{item.events?.title}</span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={14} className={i < item.rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"} />
                                ))}
                            </div>
                        </div>
                        <p className="text-neutral-700 text-sm leading-relaxed mb-3">
                            "{item.comment}"
                        </p>
                        <span className="text-xs text-neutral-400 font-medium">
                            {new Date(item.created_at).toLocaleDateString('tr-TR')}
                        </span>
                    </div>
                )) : (
                    <div className="col-span-full text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
                        <MessageSquare size={48} className="mx-auto text-neutral-300 mb-4" />
                        <p className="text-neutral-500 font-bold">Henüz değerlendirme yapılmamış.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <AnalyticsContent />
    </Suspense>
  );
}
