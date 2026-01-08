-- Migration to add nickname to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Migration to add poll participation privacy (already exists in jsonb privacy_settings, but let's ensure defaults if any)
-- The application code handles defaults for privacy_settings jsonb.
