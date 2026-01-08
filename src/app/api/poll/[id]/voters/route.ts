import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Config error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let { data, error } = await supabase
      .from('poll_votes')
      .select(`
        option_index,
        profiles:user_id!inner (id, full_name, nickname, privacy_settings, is_archived)
      `)
      .eq('poll_id', pollId)
      .eq('profiles.is_archived', false) as any;

    if (error && error.message.includes('nickname')) {
        const fallback = await supabase
            .from('poll_votes')
            .select(`
                option_index,
                profiles:user_id!inner (id, full_name, privacy_settings, is_archived)
            `)
            .eq('poll_id', pollId)
            .eq('profiles.is_archived', false) as any;
        data = fallback.data;
        error = fallback.error;
    }

    if (error) throw error;

    const toTitleCase = (str: string) => {
      if (!str) return str;
      return str.split(' ').map(word => {
        if (!word) return word;
        return word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1).toLocaleLowerCase('tr-TR');
      }).join(' ');
    };

    const formattedVoters = ((data || []) as any[])
      .map((v: any) => {
        const p = v.profiles;
        if (!p) return null;

        const canShowName = p.privacy_settings?.show_polls !== false;
        const displayName = canShowName ? p.full_name : (p.nickname || 'Rumuzlu Öğrenci');
        
        return {
          option_index: v.option_index,
          user_id: p.id,
          display_name: toTitleCase(displayName)
        };
      })
      .filter(Boolean);

    return NextResponse.json({ voters: formattedVoters });
  } catch (error: any) {
    console.error('Voters API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
