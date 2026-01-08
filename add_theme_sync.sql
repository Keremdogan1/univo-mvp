-- Add theme_preference column to profiles table for theme synchronization
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme_preference JSONB DEFAULT '{"theme": "system", "colorTheme": "default"}';
