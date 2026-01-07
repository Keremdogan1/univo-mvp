import { createClient } from '@supabase/supabase-js';

// WARNING: This client bypasses RLS! Use only in server-side API routes.
export const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase Admin Key (SUPABASE_SERVICE_ROLE_KEY) is missing. Check your environment variables.');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
