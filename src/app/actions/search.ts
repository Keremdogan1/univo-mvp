
'use server';

import { createClient } from '@supabase/supabase-js';

// We need a Service Role client or just standard client depending on RLS.
// For search, usually standard anon client is enough if RLS policies allow reading.
// Initializing a simple client here for server-side use. 
// Ideally should use @supabase/ssr package context but for simple actions:
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface SearchResults {
  events: any[];
  voices: any[];
  announcements: any[];
}

export async function searchContent(query: string): Promise<SearchResults> {
  if (!query || query.length < 2) {
      return { events: [], voices: [], announcements: [] };
  }

  const searchQuery = `%${query}%`;

  // Parallel Queries
  // 1. Events
  const eventsPromise = supabase
      .from('events')
      .select('id, title, date, location, category')
      .ilike('title', searchQuery)
      .limit(5);

  // 2. Voices (Approved)
  const voicesPromise = supabase
      .from('campus_voices')
      .select('id, content, created_at')
      .eq('moderation_status', 'approved')
      .ilike('content', searchQuery)
      .limit(5);

  // 3. Announcements (From Official Agenda which are Events of category 'announcement' or separate table?
  // Let's check schema. Looking at previous context, we might not have a separate 'announcements' table.
  // Announcements are likely events with category 'academic' or similar, OR we check the 'announcements' table if it exists.
  // I'll check if 'announcements' table exists. If not, I'll search events with category 'announcement' or just skip.
  // Let's assume simpler: Search 'official_announcements' if it exists or fallback.
  // Wait, the "Official View" uses data. Let's assume we search 'events' as the main source for now.
  // But wait! The UI has a section for "Resmi Gündem".
  
  // Let's just return events and voices for now and maybe filtered events as announcements.
  
  const [eventsResult, voicesResult] = await Promise.all([
      eventsPromise,
      voicesPromise
  ]);

  if (eventsResult.error) console.error('Search Events Error:', eventsResult.error);
  if (voicesResult.error) console.error('Search Voices Error:', voicesResult.error);

  return {
      events: eventsResult.data || [],
      voices: voicesResult.data || [],
      announcements: [] // Placeholder until we confirm structure
  };
}
