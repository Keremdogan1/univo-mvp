-- =========================================================
-- UNIVO - MASTER DATABASE SETUP (MIGRATION MIRROR)
-- Run this script in your NEW Supabase Project's SQL Editor
-- =========================================================

-- 0. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & AUTH SYNC
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  department TEXT,
  student_id TEXT UNIQUE,
  university TEXT DEFAULT 'metu',
  nickname TEXT,
  bio TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. COMMUNITIES
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  admin_id UUID REFERENCES public.profiles(id),
  university TEXT DEFAULT 'metu',
  is_chat_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Communities are viewable by everyone" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Users can create communities" ON public.communities FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "Admins can update their community" ON public.communities FOR UPDATE USING (auth.uid() = admin_id);

-- 3. EVENTS (OFFICIAL & COMMUNITY)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('event', 'announcement', 'workshop', 'talk')),
  community_id UUID REFERENCES public.communities(id),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.events FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.communities WHERE id = community_id AND admin_id = auth.uid()));

-- 4. CAMPUS VOICES
CREATE TABLE IF NOT EXISTS public.campus_voices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 300),
  is_anonymous BOOLEAN DEFAULT false,
  is_editors_choice BOOLEAN DEFAULT false,
  image_url TEXT,
  tags TEXT[],
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.campus_voices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Voices viewable by public" ON public.campus_voices FOR SELECT USING (moderation_status = 'approved' OR auth.uid() = user_id);
CREATE POLICY "Users can create voices" ON public.campus_voices FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. VOICES - REACTIONS & COMMENTS
CREATE TABLE IF NOT EXISTS public.voice_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  voice_id UUID REFERENCES public.campus_voices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'neutral', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voice_id, user_id)
);
ALTER TABLE public.voice_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions select" ON public.voice_reactions FOR SELECT USING (true);
CREATE POLICY "Reactions manage" ON public.voice_reactions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.voice_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  voice_id UUID REFERENCES public.campus_voices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.voice_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments select" ON public.voice_comments FOR SELECT USING (true);
CREATE POLICY "Comments manage" ON public.voice_comments FOR ALL USING (auth.uid() = user_id);

-- 6. COMMUNITY CHAT & PERMISSIONS
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT, media_url TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_post_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL, parent_id UUID REFERENCES public.community_post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_permission_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_permission_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts viewable" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Posts insert" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Comments viewable" ON public.community_post_comments FOR SELECT USING (true);

-- 7. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notify self view" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Notify insert" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 8. TRIGGERS (Auto-Profile Creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. INDEXES
CREATE INDEX IF NOT EXISTS idx_posts_comm_id ON public.community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_voices_univ ON public.profiles(university);
