-- Create event_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.event_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Feedback viewable by everyone"
  ON public.event_feedback FOR SELECT
  USING (true);

CREATE POLICY "Users can create feedback"
  ON public.event_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Optional: Allow users to delete their own feedback
CREATE POLICY "Users can delete own feedback"
  ON public.event_feedback FOR DELETE
  USING (auth.uid() = user_id);
