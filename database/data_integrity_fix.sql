-- Fix university assignment for Bilkent users who have NULL in their profile
-- Detect by email domain (@bilkent.edu.tr or @ug.bilkent.edu.tr)
UPDATE public.profiles p
SET university = 'bilkent'
FROM auth.users u
WHERE p.id = u.id
  AND (u.email LIKE '%@bilkent.edu.tr' OR u.email LIKE '%@ug.bilkent.edu.tr')
  AND p.university IS NULL;

-- Ensure university column has a default if appropriate (optional, but good for safety)
-- ALTER TABLE public.profiles ALTER COLUMN university SET DEFAULT 'metu'; 
-- (Not setting default to avoid forcing ODTU on future Bilkent signups if logic fails)

-- Optional: Fix full_name if it's just numbers (if we have a better fallback)
-- This is harder without a source of truth, but we can at least identify them.
