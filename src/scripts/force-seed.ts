import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Using Anon Key is risky for inserts if RLS blocks, but we made policies "INSERT with true".
// So Anon Key should work for inserting events/followers IF the tables are public write or we simulate users.
// Actually, to insert 'followers', we need to be the user or admin.
// For this 'force' script, let's assume we can use the Anon Key and create ONE fake user to add data, 
// OR simpler:
// Use the 'setup-demo' logic but automated node script.
// Wait, `setup-demo` ran in browser with User Session.
// Here in Node, we don't have user session.
// We need to Log In as the Admin (topluluk@demo.com) to insert events.
// We need to Log In as other users to follow/feedback.

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
  console.log('Force Seeding Data for UniVo Sanat Topluluğu...');

  // 1. Get Community
  let { data: community } = await supabase.from('communities').select('id, admin_id, name').eq('name', 'UniVo Sanat Topluluğu').single();

  if (!community) {
      console.log("Community 'UniVo Sanat Topluluğu' not found. Checking any community...");
      const { data: allComms } = await supabase.from('communities').select('id, admin_id, name').limit(1);
      
      if (allComms && allComms.length > 0) {
          community = allComms[0];
          console.log(`Found another community: ${community!.name} (${community!.id}). Using this.`);
      } else {
          console.log("No communities found. Creating one...");
          // Need admin user
          const { data: { session } } = await supabase.auth.signInWithPassword({
                email: 'topluluk@demo.com',
                password: 'demo12345'
          });
          
          if (session) {
              const client = createClient(supabaseUrl!, supabaseKey!, { global: { headers: { Authorization: `Bearer ${session.access_token}` } } });
              const { data: newComm } = await client.from('communities').insert({
                  name: 'UniVo Sanat Topluluğu',
                  description: 'Demo Topluluk',
                  logo_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071&auto=format&fit=crop',
                  admin_id: session.user.id
              }).select().single();
              community = newComm;
          }
      }
  }

  if (!community) {
      console.error('Could not find or create community.');
      return;
  }
  console.log('Target Community:', community.name, community.id);

  // 2. Insert Events (needs RLS bypassing or Admin User)
  // Let's assume RLS for 'events' allows insert if we are the admin.
  // We need to sign in as admin.
  // Assuming 'topluluk@demo.com' / 'demo12345'
  const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'topluluk@demo.com',
      password: 'demo12345'
  });

  if (!session) {
      console.log('Could not login as default admin. Trying to insert as Anon (might fail if RLS strict)...');
  }

  const client = session ? createClient(supabaseUrl!, supabaseKey!, { global: { headers: { Authorization: `Bearer ${session.access_token}` } } }) : supabase;

  // Insert Events
  const events = [
      { title: 'Yaza Merhaba Sergisi', date: '2025-06-15', location: 'Sanat Galerisi' },
      { title: 'Dijital Sanat Atölyesi', date: '2025-11-20', location: 'Lab 3' },
      { title: 'Portre Çizim Teknikleri', date: '2025-10-05', location: 'Stüdyo 2' }
  ];

  for (const e of events) {
      await client.from('events').insert({
          title: e.title,
          date: e.date,
          location: e.location,
          community_id: community.id,
          description: 'Otomatik oluşturulan açıklama.',
          excerpt: 'Demo etkinlik.',
          category: 'workshop',
          time: '12:00'
      });
  }
  console.log('Events inserted.');

  // 3. Insert Followers (Need fake users)
  // We'll create 3 fake users and make them follow + feedback.
  for (let i=1; i<=3; i++) {
        const email = `fakefollower${i}@demo.com`;
        const pass = 'password123';
        
        // SignUp/Login
        let { data: { session: uSession } } = await supabase.auth.signUp({
            email, password: pass, options: { data: { full_name: `Sanatsever ${i}` } }
        });
        
        if (!uSession) {
             const { data: { session: lSession } } = await supabase.auth.signInWithPassword({ email, password: pass });
             uSession = lSession;
        }

        if (uSession) {
            const uClient = createClient(supabaseUrl!, supabaseKey!, { global: { headers: { Authorization: `Bearer ${uSession.access_token}` } } });
            
            // Follow
            await uClient.from('community_followers').upsert({
                user_id: uSession.user.id,
                community_id: community.id
            }, { onConflict: 'user_id, community_id' });

            // Feedback (find an event)
            const { data: evts } = await supabase.from('events').select('id').eq('community_id', community.id).limit(1);
            if (evts && evts[0]) {
                await uClient.from('event_feedback').insert({
                    event_id: evts[0].id,
                    user_id: uSession.user.id,
                    rating: 5,
                    comment: 'Harika bir etkinlikti!'
                });
            }
        }
  }
  console.log('Followers and Feedback inserted.');
}

main().catch(console.error);
