-- 1. Create the 'avatars' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Add 'nickname' column to 'profiles' table if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'nickname') then
        alter table profiles add column nickname text;
    end if;
end $$;

-- 3. Add 'is_archived' column to 'profiles' table (used in Polls)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'is_archived') then
        alter table profiles add column is_archived boolean default false;
    end if;
end $$;

-- 4. Storage Policies (Safe Drop & Recreate)

-- Policy: Public Read Access
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
drop policy if exists "Public Access" on storage.objects; -- Drop potential alternate name
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Policy: Upload Access
drop policy if exists "Anyone can upload an avatar." on storage.objects;
drop policy if exists "Upload Access" on storage.objects;
create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );
  
-- Policy: Update Access
drop policy if exists "Anyone can update their own avatar." on storage.objects;
drop policy if exists "Update Access" on storage.objects;
create policy "Anyone can update their own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' );

-- Update Events Table with new management fields
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'quota') THEN
        ALTER TABLE events ADD COLUMN quota INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'image_url') THEN
        ALTER TABLE events ADD COLUMN image_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'registration_link') THEN
        ALTER TABLE events ADD COLUMN registration_link TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'maps_url') THEN
        ALTER TABLE events ADD COLUMN maps_url TEXT;
    END IF;
END $$;
