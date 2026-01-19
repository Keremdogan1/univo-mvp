-- Backfill Notifications for Existing Comments (Without metadata column)
-- This script generates notifications for all past comments.
-- Run this ONCE after deploying the notification system upgrade.

-- Insert notifications for voice_comments (top-level comments to voice owner)
INSERT INTO notifications (user_id, actor_id, type, message, created_at, read)
SELECT 
    cv.user_id as user_id,           -- Voice owner receives notification
    vc.user_id as actor_id,          -- Commenter is the actor
    'voice_comment' as type,
    'Gönderinize yorum yaptı' as message,
    vc.created_at as created_at,     -- Use original comment time
    true as read                      -- Mark as read so users aren't spammed
FROM voice_comments vc
JOIN campus_voices cv ON cv.id = vc.voice_id
WHERE 
    vc.parent_id IS NULL              -- Only top-level comments
    AND vc.user_id != cv.user_id      -- Don't notify yourself
    AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.user_id = cv.user_id 
        AND n.actor_id = vc.user_id
        AND n.type = 'voice_comment'
        AND n.created_at = vc.created_at
    );

-- Insert notifications for replies (notify parent comment owner)
INSERT INTO notifications (user_id, actor_id, type, message, created_at, read)
SELECT 
    parent_vc.user_id as user_id,    -- Parent comment owner receives notification
    vc.user_id as actor_id,          -- Replier is the actor
    'voice_reply' as type,
    'Yorumunuza yanıt verdi' as message,
    vc.created_at as created_at,
    true as read
FROM voice_comments vc
JOIN voice_comments parent_vc ON parent_vc.id = vc.parent_id
WHERE 
    vc.parent_id IS NOT NULL
    AND vc.user_id != parent_vc.user_id
    AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.user_id = parent_vc.user_id 
        AND n.actor_id = vc.user_id
        AND n.type = 'voice_reply'
        AND n.created_at = vc.created_at
    );

-- Check count after running:
-- SELECT type, COUNT(*) FROM notifications WHERE read = true GROUP BY type;
