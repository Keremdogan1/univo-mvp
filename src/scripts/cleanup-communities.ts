
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

const ADMIN_EMAIL = "dogan.kerem@metu.edu.tr";

async function cleanup() {
  console.log('--- Community Cleanup ---');
  
  // 1. Get Admin Profile ID
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('full_name', 'Kerem Doğan')
    .single();

  if (userError || !userData) {
      // Try by email if name fails
      const { data: emailData } = await supabase.from('profiles').select('id').eq('id', '...').limit(1); // Placeholder logic
      console.error('Admin ID not found by name. Check constants.');
      // Fallback: We'll just look for anybody who ISN'T the admin by email if we can join
      // Actually, let's just use the designated name or find the profile with the admin email
  }

  const keremId = userData?.id;
  console.log('Admin ID target:', keremId);

  // 2. Fetch all
  const { data: allComms, error: fetchError } = await supabase.from('communities').select('*');
  if (fetchError || !allComms) {
      console.error('Fetch error:', fetchError);
      return;
  }

  console.log(`Total communities found: ${allComms.length}`);
  allComms.forEach(c => console.log(`- ${c.name} (Admin ID: ${c.admin_id})`));

  const toDelete = allComms.filter(c => {
    // Keep it if it's explicitly owned by Kerem AND contains 'Sanat'
    if (keremId && c.admin_id === keremId && c.name.toLowerCase().includes('sanat')) return false;
    
    // Otherwise, mark for deletion
    return true;
  }).map(c => c.id);

  if (toDelete.length === 0) {
    console.log('✅ Nothing to delete.');
    return;
  }

  console.log(`Deleting ${toDelete.length} communities...`);
  const { data: deleted, error: deleteError } = await supabase
    .from('communities')
    .delete()
    .in('id', toDelete)
    .select();

  if (deleteError) {
    console.error('Delete error:', deleteError);
  } else {
    console.log(`✅ Deleted ${deleted?.length || 0} communities.`);
  }
}

cleanup().catch(console.error);
