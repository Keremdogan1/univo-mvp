-- Update default value for notification_settings
ALTER TABLE profiles 
ALTER COLUMN notification_settings 
SET DEFAULT '{"likes": true, "comments": true, "mentions": true, "follows": true, "friend_requests": true, "email_subscription": true}'::jsonb;

-- Update existing rows to include email_subscription if missing
UPDATE profiles 
SET notification_settings = notification_settings || '{"email_subscription": true}'::jsonb 
WHERE (notification_settings->>'email_subscription') IS NULL;
