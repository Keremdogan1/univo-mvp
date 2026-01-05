
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adminEmail = "keremdogan.9@gmail.com"; 

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  console.log('🧹 Starting community cleanup...');

  // 1. Get Admin User ID
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('full_name', 'Kerem Doğan') // Secondary check if email is unsure
    .single();

  if (userError || !userData) {
    console.error('Could not find Kerem Doğan profile:', userError?.message);
    // Try by email if name fails (requires admin auth, or we just trust the profile)
    return;
  }

  const keremId = userData.id;
  console.log('Admin ID found:', keremId);

  // 2. Delete non-admin communities
  const { data: deleted, error: deleteError } = await supabase
    .from('communities')
    .delete()
    .neq('admin_id', keremId)
    .select();

  if (deleteError) {
    console.error('Error deleting communities:', deleteError.message);
  } else {
    console.log(`✅ Deleted ${deleted?.length || 0} unauthorized communities.`);
    if (deleted && deleted.length > 0) {
      deleted.forEach(c => console.log(`- Removed: ${c.name}`));
    }
  }
}

cleanup().catch(console.error);
