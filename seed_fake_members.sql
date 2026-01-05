-- ==========================================
-- 0. PRE-REQUISITE: CREATE MISSING TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.event_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_feedback' AND policyname = 'Feedback viewable by everyone') THEN
        CREATE POLICY "Feedback viewable by everyone" ON public.event_feedback FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_feedback' AND policyname = 'Users can create feedback') THEN
        CREATE POLICY "Users can create feedback" ON public.event_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- ==========================================
-- SEED FAKE MEMBERS & INTERACTION
-- Run this in Supabase SQL Editor
-- ==========================================

DO $$
DECLARE
  v_community_id UUID;
  v_user1 UUID;
  v_user2 UUID;
  v_user3 UUID;
  v_user4 UUID;
  v_user5 UUID;
  v_event_id UUID;
BEGIN
  -- 1. TARGET SPECIFIC COMMUNITY (Found via Dashboard Inspection)
  v_community_id := '66676a9f-9b66-48d2-82ae-93334726c6d5';
  
  -- SELECT id INTO v_community_id FROM public.communities ORDER BY created_at DESC LIMIT 1;
  
  IF v_community_id IS NULL THEN
    RAISE EXCEPTION 'No community found.';
  END IF;

  -- ==========================================
-- SEED DATA script
-- ==========================================

-- MIGRATION: Add category to communities if missing
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS category TEXT; -- Default to 'Genel' or null

-- 1. Helper function for consistent IDs (optional usage)il
  -- ==============================================================================
  -- HELPER LOGIC: Find or Create Users by Email
  -- Since we cannot easily loop with records in simplified PL/SQL, we repeat logic.
  -- ==============================================================================

  -- USER 1: Ali
  SELECT id INTO v_user1 FROM auth.users WHERE email = 'ali.yilmaz@sim.com';
  IF v_user1 IS NULL THEN
      v_user1 := uuid_generate_v4();
      INSERT INTO auth.users (id, email) VALUES (v_user1, 'ali.yilmaz@sim.com');
  END IF;
  
  -- USER 2: Ayse
  SELECT id INTO v_user2 FROM auth.users WHERE email = 'ayse.demir@sim.com';
  IF v_user2 IS NULL THEN
      v_user2 := uuid_generate_v4();
      INSERT INTO auth.users (id, email) VALUES (v_user2, 'ayse.demir@sim.com');
  END IF;

  -- USER 3: Mehmet
  SELECT id INTO v_user3 FROM auth.users WHERE email = 'mehmet.kaya@sim.com';
  IF v_user3 IS NULL THEN
      v_user3 := uuid_generate_v4();
      INSERT INTO auth.users (id, email) VALUES (v_user3, 'mehmet.kaya@sim.com');
  END IF;

  -- USER 4: Zeynep
  SELECT id INTO v_user4 FROM auth.users WHERE email = 'zeynep.sah@sim.com';
  IF v_user4 IS NULL THEN
      v_user4 := uuid_generate_v4();
      INSERT INTO auth.users (id, email) VALUES (v_user4, 'zeynep.sah@sim.com');
  END IF;

  -- USER 5: Can
  SELECT id INTO v_user5 FROM auth.users WHERE email = 'can.yildiz@sim.com';
  IF v_user5 IS NULL THEN
      v_user5 := uuid_generate_v4();
      INSERT INTO auth.users (id, email) VALUES (v_user5, 'can.yildiz@sim.com');
  END IF;

  -- 3. Upsert Profiles (With "Initials on Red" Avatars)
  INSERT INTO public.profiles (id, full_name, avatar_url) VALUES
    (v_user1, 'Ali Yılmaz', 'https://ui-avatars.com/api/?name=Ali+Yilmaz&background=C8102E&color=fff&length=1'),
    (v_user2, 'Ayşe Demir', 'https://ui-avatars.com/api/?name=Ayse+Demir&background=C8102E&color=fff&length=1'),
    (v_user3, 'Mehmet Kaya', 'https://ui-avatars.com/api/?name=Mehmet+Kaya&background=C8102E&color=fff&length=1'),
    (v_user4, 'Zeynep Şahin', 'https://ui-avatars.com/api/?name=Zeynep+Sahin&background=C8102E&color=fff&length=1'),
    (v_user5, 'Can Yıldız', 'https://ui-avatars.com/api/?name=Can+Yildiz&background=C8102E&color=fff&length=1')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url;

  -- 4. Follow Community (With Backdated Timestamps for Chart)
  INSERT INTO public.community_followers (community_id, user_id, created_at) VALUES
    (v_community_id, v_user1, NOW() - INTERVAL '60 days'),
    (v_community_id, v_user2, NOW() - INTERVAL '45 days'),
    (v_community_id, v_user3, NOW() - INTERVAL '30 days'),
    (v_community_id, v_user4, NOW() - INTERVAL '15 days'),
    (v_community_id, v_user5, NOW() - INTERVAL '2 days')
  ON CONFLICT (community_id, user_id) DO UPDATE SET created_at = EXCLUDED.created_at;

  -- 5. Add Feedback to Events
  -- Loop through events of this community
  FOR v_event_id IN SELECT id FROM public.events WHERE community_id = v_community_id
  LOOP
    -- User 1 Review
    INSERT INTO public.event_feedback (event_id, user_id, rating, comment) VALUES
      (v_event_id, v_user1, 5, 'Muhteşem bir organizasyondu!')
    ON CONFLICT DO NOTHING;
    
    -- User 2 Review (Randomize slightly)
    INSERT INTO public.event_feedback (event_id, user_id, rating, comment) VALUES
      (v_event_id, v_user2, 4, 'Güzeldi ama biraz daha uzun sürebilirdi.')
    ON CONFLICT DO NOTHING;

    -- User 3 Review
    INSERT INTO public.event_feedback (event_id, user_id, rating, comment) VALUES
      (v_event_id, v_user3, 5, 'Kesinlikle tekrar gelmek isterim.')
    ON CONFLICT DO NOTHING;

    -- Add Attendees (RSVP)
    INSERT INTO public.event_attendees (event_id, user_id, rsvp_status) VALUES
      (v_event_id, v_user1, 'going'),
      (v_event_id, v_user2, 'going'),
      (v_event_id, v_user3, 'going'),
      (v_event_id, v_user4, 'interested'),
      (v_event_id, v_user5, 'not_going') -- Mixed status
    ON CONFLICT DO NOTHING;
  END LOOP;
  
END $$;
