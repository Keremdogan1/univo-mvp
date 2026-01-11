-- Add parent_id to voice_comments for nested replies
ALTER TABLE public.voice_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.voice_comments(id) ON DELETE CASCADE;

-- Create voice_comment_reactions table
CREATE TABLE IF NOT EXISTS public.voice_comment_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    comment_id UUID REFERENCES public.voice_comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.voice_comment_reactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Voice comment reactions are viewable by everyone" 
    ON public.voice_comment_reactions FOR SELECT USING (true);

CREATE POLICY "Users can insert voice comment reaction" 
    ON public.voice_comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update voice comment reaction" 
    ON public.voice_comment_reactions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete voice comment reaction" 
    ON public.voice_comment_reactions FOR DELETE USING (auth.uid() = user_id);
