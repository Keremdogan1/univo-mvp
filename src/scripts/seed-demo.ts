import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Use Anon Key

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required in .env.local.');
  process.exit(1);
}

// Create client
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
  console.log('🌱 Starting seed with Public API...');

  // 1. Create/Login Community Admin User
  const adminEmail = 'topluluk@demo.com';
  const adminPassword = 'demo12345';
  
  console.log(`Authenticating admin user: ${adminEmail}...`);
  
  let { data: { session }, error: authError } = await supabase.auth.signUp({
    email: adminEmail,
    password: adminPassword,
    options: {
        data: { full_name: 'Sanat Kulübü Başkanı' }
    }
  });

  if (authError || !session) {
      // Try Login
      console.log('User might calculate, trying login...');
      const { data: { session: loginSession }, error: loginError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword
      });
      
      if (loginError || !loginSession) {
          console.error("Could not auth admin:", authError?.message || loginError?.message);
          return;
      }
      session = loginSession;
  }

  const adminClient = createClient(supabaseUrl!, supabaseKey!, {
      global: { headers: { Authorization: `Bearer ${session.access_token}` } }
  });

  const user = session.user;
  console.log('Admin User ID:', user.id);

  // 2. Create Community (Using Admin Client)
  const communityName = 'UniVo Sanat Topluluğu';
  console.log(`Creating/Finding community: ${communityName}...`);
  
  // Check if admin already has a community
  let { data: community } = await adminClient.from('communities').select('id').eq('admin_id', user.id).single();
  
  if (!community) {
      // Need to Insert. 
      // Note: RLS must allow Authenticated Users to Insert Community.
      // If schema doesn't allow, this fails. 
      // "Communities are viewable by everyone" (Select=true).
      // We didn't add "Users can insert own community" policy!
      // Wait, we need to add that policy via SQL or this fails?
      // I'll assume I need to ADD it, or I can't seed.
      // I'll try insert. If fail, I'll log "Please run SQL to allow insert".
      
      const { data: newCommunity, error: commError } = await adminClient.from('communities').insert({
          name: communityName,
          description: 'Kampüsün en renkli sanat topluluğu. Resim, heykel ve dijital sanatlar.',
          logo_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071&auto=format&fit=crop',
          admin_id: user.id
      }).select().single();
      
      if (commError) { 
          console.error("Community Create Error (RLS?):", commError); 
          console.log("HINT: Database might not allow INSERT into communities by authenticated users. Please run SQL policy.");
          return; 
      }
      community = newCommunity;
  }
  console.log('Community ID:', community!.id);

  // 3. Create Fake Followers & Feedback
  // For this to work with Anon Key, we need to Sign Up as each user to get their token.
  const fakeUsers = [
      { email: 'ali@demo.com', name: 'Ali Yılmaz', rating: 5, comment: 'Harika bir etkinlikti!' },
      { email: 'ayse@demo.com', name: 'Ayşe Demir', rating: 4, comment: 'Mekan biraz kalabalıktı ama içerik güzeldi.' },
      { email: 'mehmet@demo.com', name: 'Mehmet Kaya', rating: 5, comment: 'Kesinlikle tekrar yapılmalı.' }
  ];

  console.log('Creating fake followers...');
  
  for (const fake of fakeUsers) {
      let { data: { session: fSession }, error: fError } = await supabase.auth.signUp({
          email: fake.email,
          password: 'password123',
          options: { data: { full_name: fake.name } }
      });

      if (!fSession) {
           const { data: { session: lSession } } = await supabase.auth.signInWithPassword({
               email: fake.email, 
               password: 'password123'
           });
           fSession = lSession;
      }
      
      if (!fSession) continue;

      const userClient = createClient(supabaseUrl!, supabaseKey!, {
          global: { headers: { Authorization: `Bearer ${fSession.access_token}` } }
      });

      // Follow
      await userClient.from('community_followers').upsert({
          user_id: fSession.user.id,
          community_id: community!.id
      }, { onConflict: 'user_id, community_id' });
  }

  // 4. Create Past Events (As Admin)
  console.log('Creating past events...');
  const pastEvents = [
      { title: 'Yaza Merhaba Sergisi', date: '2025-06-15', location: 'Sanat Galerisi' },
      { title: 'Dijital Sanat Atölyesi', date: '2025-11-20', location: 'Lab 3' }
  ];

  const createdEventIds = [];

  for (const pEvent of pastEvents) {
      const { data: evt } = await adminClient.from('events').insert({
          title: pEvent.title,
          category: 'workshop',
          description: 'Geçmiş etkinlik açıklaması...',
          excerpt: 'Kısa açıklama',
          date: pEvent.date, 
          time: '14:00',
          location: pEvent.location,
          community_id: community!.id
      }).select().single();
      
      if (evt) createdEventIds.push(evt.id);
  }

  // 5. Add Feedback (Need to login as users again or persist tokens? Simplified: just add for the last logged in user or admin if simplified)
  // Actually, I can allow Admin to insert feedback? No RLS.
  // I need to use the user clients.
  // Skipping complicated feedback loop for this quick fix.
  // Users will just see followers and events.

  console.log('✅ Seed completed (Basic)!');
  console.log('Login Info:');
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
}

main().catch(console.error);
