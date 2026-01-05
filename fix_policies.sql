-- =============================================================
-- FIX RLS POLICIES FOR UNIVO
-- Run this script in your Supabase SQL Editor to fix 403 errors.
-- =============================================================

-- 1. COMMUNITIES: Allow users to create and update their communities
CREATE POLICY "Users can create communities"
  ON public.communities
  FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update their community"
  ON public.communities
  FOR UPDATE
  USING (auth.uid() = admin_id);

-- 2. EVENTS: Allow community admins to manage events
CREATE POLICY "Community admins can create events"
  ON public.events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE id = community_id
      AND admin_id = auth.uid()
    )
  );

CREATE POLICY "Community admins can update events"
  ON public.events
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE id = community_id
      AND admin_id = auth.uid()
    )
  );

CREATE POLICY "Community admins can delete events"
  ON public.events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE id = community_id
      AND admin_id = auth.uid()
    )
  );
