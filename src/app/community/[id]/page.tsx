import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, ArrowLeft } from 'lucide-react';
import EventCard from '@/components/EventCard';
import { Event } from '@/types';
import CommunitySidebar from '@/components/community/CommunitySidebar';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getCommunity(id: string) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return null;
  return data;
}

// Fetch events for this community
// We need to fetch from 'events' table, but currently we are using mockEvents in some places.
// However, the schema has an 'events' table. Let's assume we should fetch from there or fallback to empty if generic.
// For MVP, if no real events are in DB, we might want to show some mock ones filtered by community name? 
// No, let's stick to true implementation: Fetch from DB.
async function getCommunityEvents(communityId: string) {
   const supabase = createClient(supabaseUrl, supabaseKey);
   const { data, error } = await supabase
     .from('events')
     .select(`
        *,
        community:community_id (id, name, logo_url)
     `)
     .eq('community_id', communityId)
     .order('date', { ascending: true });

   if (error) return [];
   
   // Map DB result to Event interface if needed, or mostly it matches
   return data.map((e: any) => ({
      ...e,
      date: e.date.replace('2025', '2026'), // Hot-fix: Ensure old seed data appears as 2026
      community: e.community // Ensure nested structure matches expected Event type
   })) as Event[];
}

async function getFollowerCount(communityId: string) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { count } = await supabase
        .from('community_followers')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId);
    return count || 0;
}

export default async function CommunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const community = await getCommunity(id);
  const events = await getCommunityEvents(id);
  const followerCount = await getFollowerCount(id);

  if (!community) {
    notFound(); 
  }

  // Calculate generic stats for MVP
  const eventCount = events.length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Link */}
      <Link href="/?view=community" className="inline-flex items-center gap-2 text-neutral-500 hover:text-black mb-6 font-bold uppercase text-xs tracking-widest transition-colors">
        <ArrowLeft size={16} />
        Topluluk Meydanı'na Dön
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Profile Info */}
        <div className="lg:col-span-1">
             <CommunitySidebar 
                community={community} 
                followerCount={followerCount} 
                eventCount={eventCount} 
             />
        </div>

        {/* Right: Events */}
        <div className="lg:col-span-2">
            <h2 className="text-xl font-bold border-b-2 border-black dark:border-white pb-2 mb-6 flex items-center gap-2 font-serif dark:text-white">
                <Calendar size={20} />
                Yaklaşan Etkinlikler
            </h2>

            {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {events.map((event) => (
                        <div key={event.id} className="h-[400px]">
                            <EventCard event={event} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-neutral-50 dark:bg-neutral-900 border-2 border-dashed border-neutral-200 dark:border-neutral-800 p-12 text-center rounded-lg">
                    <Calendar size={48} className="mx-auto text-neutral-300 dark:text-neutral-700 mb-4" />
                    <h3 className="text-lg font-bold text-neutral-500 dark:text-neutral-400 font-serif mb-2">Planlanmış etkinlik yok</h3>
                    <p className="text-neutral-400 dark:text-neutral-600 text-sm">Bu topluluğun yakın zamanda etkinliği bulunmuyor.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
