import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageSquare, Calendar, Users, Instagram, Twitter, Globe, ArrowLeft } from 'lucide-react';
import EventCard from '@/components/EventCard';
import { Event } from '@/types';
import FollowButton from '@/components/FollowButton';

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
           <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-24">
              <div className="w-24 h-24 bg-neutral-100 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-dashed border-neutral-300">
                  {community.logo_url ? (
                      <img src={community.logo_url} alt={community.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                      <Users size={32} className="text-neutral-400" />
                  )}
              </div>
              
              <h1 className="text-2xl font-black font-serif text-center mb-2 leading-tight">
                  {community.name}
              </h1>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 border-y-2 border-neutral-100 py-4 my-4 text-center">
                  <div>
                      <span className="block font-bold text-xl">{followerCount}</span>
                      <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">Takipçi</span>
                  </div>
                  <div>
                      <span className="block font-bold text-xl">{eventCount}</span>
                      <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">Etkinlik</span>
                  </div>
              </div>

              <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase mb-2">Hakkında</h3>
                  <p className="text-sm text-neutral-600 font-serif leading-relaxed">
                      {community.description || 'Bu topluluk hakkında henüz bir açıklama girilmemiş.'}
                  </p>
              </div>

              <div className="space-y-3">
                  <FollowButton communityId={community.id} initialIsFollowing={false} />
                  <div className="flex justify-center gap-4 text-neutral-400 pt-2">
                      <Instagram size={20} className="hover:text-black cursor-pointer" />
                      <Twitter size={20} className="hover:text-black cursor-pointer" />
                      <Globe size={20} className="hover:text-black cursor-pointer" />
                  </div>
              </div>
           </div>
        </div>

        {/* Right: Events */}
        <div className="lg:col-span-2">
            <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-6 flex items-center gap-2 font-serif">
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
                <div className="bg-neutral-50 border-2 border-dashed border-neutral-200 p-12 text-center rounded-lg">
                    <Calendar size={48} className="mx-auto text-neutral-300 mb-4" />
                    <h3 className="text-lg font-bold text-neutral-500 font-serif">Planlanmış etkinlik yok</h3>
                    <p className="text-neutral-400 text-sm mt-1">Bu topluluğun yakın zamanda etkinliği bulunmuyor.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
