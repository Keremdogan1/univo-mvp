-- 1. Add image_url column to campus_voices
ALTER TABLE public.campus_voices ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Storage Bucket Instructions (Run in Supabase Dashboard or via API if possible)
-- Name: post_images
-- Public: Yes
-- Policy: 
--   - SELECT: Allow public read
--   - INSERT: Allow authenticated upload
--   - DELETE: Allow owner to delete

-- SQL for Storage Policies (if manual setup is needed)
/*
INSERT INTO storage.buckets (id, name, public) VALUES ('post_images', 'post_images', true);

CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'post_images');
CREATE POLICY "Authenticated Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post_images' AND auth.role() = 'authenticated');
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE USING (bucket_id = 'post_images' AND auth.uid() = owner);
*/
