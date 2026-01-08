-- Migration to add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Ensure RLS is updated if needed, but for these columns simple select/update is enough.
