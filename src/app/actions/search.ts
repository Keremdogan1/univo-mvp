
'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface SearchResults {
  events: any[];
  voices: any[];
  announcements: any[];
  users: any[];
}

function turkishUpper(str: string): string {
    const map: Record<string, string> = {
        'i': 'İ',
        'ı': 'I',
        'ş': 'Ş',
        'ğ': 'Ğ',
        'ü': 'Ü',
        'ö': 'Ö',
        'ç': 'Ç'
    };
    return str.split('').map(c => map[c.toLowerCase()] || c.toUpperCase()).join('');
}

export async function searchContent(query: string): Promise<SearchResults> {
  if (!query || query.length < 2) {
      return { events: [], voices: [], announcements: [], users: [] };
  }

  const searchQuery = `%${query}%`;
  const searchTrUpper = `%${turkishUpper(query)}%`;

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

  // 3. User search - combining variations
  // Note: Values in .or() filters should be double-quoted if they contain special characters
  const usersPromise = supabase
      .from('profiles')
      .select('id, full_name, avatar_url, department, class_year')
      .or(`full_name.ilike."${searchQuery}",full_name.ilike."${searchTrUpper}"`)
      .limit(5);

  const [eventsResult, voicesResult, usersResult] = await Promise.all([
      eventsPromise,
      voicesPromise,
      usersPromise
  ]);

  if (eventsResult.error) console.error('Search Events Error:', eventsResult.error);
  if (voicesResult.error) console.error('Search Voices Error:', voicesResult.error);
  if (usersResult.error) console.error('Search Users Error:', usersResult.error);

  return {
      events: eventsResult.data || [],
      voices: voicesResult.data || [],
      announcements: [],
      users: usersResult.data || []
  };
}
