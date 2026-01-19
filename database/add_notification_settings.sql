-- Add notification_settings column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"likes": true, "comments": true, "mentions": true, "follows": true, "friend_requests": true}'::jsonb;
