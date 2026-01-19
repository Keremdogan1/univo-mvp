-- Phase 5 structural alignment updates

-- 1. Add parent_id to community_post_comments for nesting
ALTER TABLE public.community_post_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.community_post_comments(id) ON DELETE CASCADE;

-- 2. Create community_comment_reactions table
CREATE TABLE IF NOT EXISTS public.community_comment_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  comment_id UUID REFERENCES public.community_post_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS for comment reactions
ALTER TABLE public.community_comment_reactions ENABLE ROW LEVEL SECURITY;

-- Policies for comment reactions
DROP POLICY IF EXISTS "Comment reactions viewable by everyone" ON public.community_comment_reactions;
CREATE POLICY "Comment reactions viewable by everyone"
  ON public.community_comment_reactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can react to comments" ON public.community_comment_reactions;
CREATE POLICY "Users can react to comments"
  ON public.community_comment_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update comment reaction" ON public.community_comment_reactions;
CREATE POLICY "Users can update comment reaction"
  ON public.community_comment_reactions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove comment reaction" ON public.community_comment_reactions;
CREATE POLICY "Users can remove comment reaction"
  ON public.community_comment_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_com_comment_reactions_comment_id ON public.community_comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_com_post_comments_parent_id ON public.community_post_comments(parent_id);
