-- Community Post Reactions Table
CREATE TABLE IF NOT EXISTS public.community_post_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.community_post_reactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Reactions are viewable by everyone"
  ON public.community_post_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can react"
  ON public.community_post_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update reaction"
  ON public.community_post_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove reaction"
  ON public.community_post_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_post_reactions_post_id ON public.community_post_reactions(post_id);

-- Ensure profiles has required columns for role management (already exists but for clarity)
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
