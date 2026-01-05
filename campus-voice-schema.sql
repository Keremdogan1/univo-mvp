-- =====================
-- CAMPUS VOICES TABLE
-- =====================
CREATE TABLE public.campus_voices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  is_anonymous BOOLEAN DEFAULT false,
  is_editors_choice BOOLEAN DEFAULT false,
  tags TEXT[], -- Array of strings for tags e.g. ['library', 'food']
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.campus_voices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voices are viewable by everyone"
  ON public.campus_voices FOR SELECT
  USING (moderation_status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can create voices"
  ON public.campus_voices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own voices"
  ON public.campus_voices FOR DELETE
  USING (auth.uid() = user_id);

-- =====================
-- VOICE REACTIONS TABLE
-- =====================
CREATE TABLE public.voice_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  voice_id UUID REFERENCES public.campus_voices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'neutral', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voice_id, user_id)
);

ALTER TABLE public.voice_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions are viewable by everyone"
  ON public.voice_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can react"
  ON public.voice_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update reaction"
  ON public.voice_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove reaction"
  ON public.voice_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================
-- VOICE COMMENTS TABLE
-- =====================
CREATE TABLE public.voice_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  voice_id UUID REFERENCES public.campus_voices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.voice_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.voice_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can comment"
  ON public.voice_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.voice_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_campus_voices_user_id ON public.campus_voices(user_id);
CREATE INDEX idx_campus_voices_created_at ON public.campus_voices(created_at);
CREATE INDEX idx_voice_reactions_voice_id ON public.voice_reactions(voice_id);
CREATE INDEX idx_voice_comments_voice_id ON public.voice_comments(voice_id);
