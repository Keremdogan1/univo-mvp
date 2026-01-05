-- =====================
-- EVENT FEEDBACK TABLE
-- =====================
CREATE TABLE public.event_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feedback is viewable by everyone"
  ON public.event_feedback FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own feedback"
  ON public.event_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_event_feedback_event_id ON public.event_feedback(event_id);
