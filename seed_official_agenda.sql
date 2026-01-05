
-- ==========================================
-- OFFICIAL AGENDA ENHANCEMENTS MIGRATION
-- ==========================================

-- 1. Official Documents Archive
CREATE TABLE IF NOT EXISTS public.official_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Yönetmelik', 'Form', 'Kılavuz', etc.
  file_url TEXT NOT NULL,
  year INTEGER NOT NULL,
  department TEXT, -- 'Rektörlük', 'ÖİDB', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.official_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Documents viewable by everyone" ON public.official_documents;
CREATE POLICY "Documents viewable by everyone" ON public.official_documents FOR SELECT USING (true);


-- 2. Announcement Reads (Tracking read status)
-- Note: announcement_id is TEXT to support both UUIDs (events) and custom string IDs (scraped news)
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  announcement_id TEXT NOT NULL, 
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, announcement_id)
);

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their reads" ON public.announcement_reads;
CREATE POLICY "Users can manage their reads" ON public.announcement_reads USING (auth.uid() = user_id);


-- 3. Topic Follows (Smart notifications/filtering)
CREATE TABLE IF NOT EXISTS public.topic_follows (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  topic_tag TEXT NOT NULL, -- 'akademik', 'spor', 'teknoloji', 'yemek'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, topic_tag)
);

ALTER TABLE public.topic_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their follows" ON public.topic_follows;
CREATE POLICY "Users can manage their follows" ON public.topic_follows USING (auth.uid() = user_id);


-- 4. Announcement Comments (Student Views)
CREATE TABLE IF NOT EXISTS public.announcement_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  announcement_id TEXT NOT NULL, 
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.announcement_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read comments" ON public.announcement_comments;
CREATE POLICY "Public read comments" ON public.announcement_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth insert comments" ON public.announcement_comments;
CREATE POLICY "Auth insert comments" ON public.announcement_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own delete comments" ON public.announcement_comments;
CREATE POLICY "Own delete comments" ON public.announcement_comments FOR DELETE USING (auth.uid() = user_id);


-- ==========================================
-- SEED DATA
-- ==========================================

-- Seed Documents
INSERT INTO public.official_documents (title, category, file_url, year, department) VALUES
('2025-2026 Akademik Takvimi', 'Takvim', 'https://oidb.metu.edu.tr/', 2025, 'ÖİDB'),
('Yaz Okulu Yönetmeliği', 'Yönetmelik', 'https://oidb.metu.edu.tr/', 2024, 'Rektörlük'),
('Öğrenci Toplulukları Kuruluş Formu', 'Form', '#', 2025, 'Kültür Müdürlüğü'),
('Erasmus Başvuru Kılavuzu', 'Kılavuz', '#', 2025, 'Dış İlişkiler'),
('Mazeret Sınavı Dilekçe Örneği', 'Form', '#', 2024, 'Fakülte Sekreterliği')
ON CONFLICT DO NOTHING;

-- Seed some comments for demo purposes (assuming we have a profile to link to, skipping for now to avoid FK errors if seed_fake_members not run recently, or we can use a known UUID if available. Better to leave empty.)
