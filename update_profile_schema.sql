-- =============================================
-- PROFILE ENHANCEMENTS MIGRATION
-- =============================================

-- 1. Create BADGES table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Lucide icon name or Image URL
  color TEXT, -- Hex code or CSS class
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone"
  ON public.badges FOR SELECT
  USING (true);

-- Only admins can manage badges (using service_role usually, or a specific admin flag)
-- For now, letting authenticated users insert for dev/demo purposes if needed, 
-- or strictly restrict. Let's restrict to service role or admin check if we had one.
-- keeping it open for dev for now or just generic read-only for users.

-- 2. Create USER_BADGES table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges are viewable by everyone"
  ON public.user_badges FOR SELECT
  USING (true);

-- 3. Add columns to PROFILES table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"show_email": false, "show_interests": true, "show_activities": true}',
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{"linkedin": "", "github": "", "website": "", "twitter": "", "instagram": ""}';

-- 4. Seed some initial badges
INSERT INTO public.badges (name, description, icon, color) VALUES
('Campus Explorer', 'İlk etkinliğine katılan öğrenci', 'Compass', '#C8102E'),
('Community Leader', 'Bir topluluk yöneten lider', 'Crown', '#F59E0B'),
('Bookworm', 'Kitap kulübü aktif üyesi', 'BookOpen', '#3B82F6'),
('Event Star', '5+ etkinliğe katılım sağlayan', 'Star', '#8B5CF6'),
('Early Bird', 'Sabah derslerine geç kalmayan', 'Sunrise', '#10B981')
ON CONFLICT DO NOTHING;
