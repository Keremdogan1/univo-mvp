-- =====================
-- ADMIN PANEL SCHEMA
-- =====================

-- 1. Extend PROFILES table with is_banned column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_by TEXT;

-- 2. ADMIN IDENTITIES table
-- This table stores specific admin users who have passed the initial shared login
CREATE TABLE IF NOT EXISTS public.admin_identities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_name TEXT UNIQUE NOT NULL, -- e.g. "Salih"
  password_hash TEXT NOT NULL, -- We will store hashed password here
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.admin_identities ENABLE ROW LEVEL SECURITY;

-- Only strictly controlled access - in MVP this table is mainly accessed by Service Role API routes
CREATE POLICY "No public access to admin_identities"
  ON public.admin_identities
  USING (false);

-- 3. SYSTEM SETTINGS table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('daily_post_limit', '10', 'Maximum number of posts a user can share per day'),
  ('daily_comment_limit', '50', 'Maximum number of comments a user can make per day')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users if needed (e.g. to check limits on client side)
CREATE POLICY "Authenticated users can read settings"
  ON public.system_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins/service role can update
CREATE POLICY "No public update to system_settings"
  ON public.system_settings FOR UPDATE
  USING (false);

CREATE POLICY "No public insert to system_settings"
  ON public.system_settings FOR INSERT
  WITH CHECK (false);

-- 4. BANNED USERS LOG (Optional but good for audit)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_name TEXT NOT NULL,
    action TEXT NOT NULL,
    target_user_id UUID,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
