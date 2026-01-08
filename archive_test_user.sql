-- SQL to mark old test user as archived and remove from system views
-- First, find and archive any user that might be the test user
-- Based on the context, this is likely a user created before ODTU integration

-- Option 1: Mark as archived (recommended - preserves data integrity)
UPDATE public.profiles 
SET is_archived = true 
WHERE full_name ILIKE '%arşivlenmiş%' 
   OR full_name ILIKE '%arsivlenmis%'
   OR full_name ILIKE '%test%';

-- Option 2: If you want to completely remove (be careful with foreign keys)
-- First delete related records:
-- DELETE FROM poll_votes WHERE user_id IN (SELECT id FROM profiles WHERE is_archived = true);
-- DELETE FROM voice_reactions WHERE user_id IN (SELECT id FROM profiles WHERE is_archived = true);
-- DELETE FROM voice_comments WHERE user_id IN (SELECT id FROM profiles WHERE is_archived = true);
-- DELETE FROM campus_voices WHERE user_id IN (SELECT id FROM profiles WHERE is_archived = true);
-- DELETE FROM friendships WHERE requester_id IN (SELECT id FROM profiles WHERE is_archived = true) OR receiver_id IN (SELECT id FROM profiles WHERE is_archived = true);
-- DELETE FROM notifications WHERE user_id IN (SELECT id FROM profiles WHERE is_archived = true) OR actor_id IN (SELECT id FROM profiles WHERE is_archived = true);
-- Then delete profile:
-- DELETE FROM profiles WHERE is_archived = true;

-- To find the specific user, run this query first:
SELECT id, full_name, student_id, department, created_at, is_archived 
FROM profiles 
WHERE full_name ILIKE '%arşiv%' OR full_name ILIKE '%test%' OR student_id IS NULL;
