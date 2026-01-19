-- Backfill Notifications for Existing Comments
-- This script generates notifications for all past comments that don't have notifications yet.
-- Run this ONCE after deploying the notification system upgrade.

-- Insert notifications for voice_comments that are NOT self-comments and don't have existing notifications
INSERT INTO notifications (user_id, actor_id, type, message, metadata, created_at, read)
SELECT 
    cv.user_id as user_id,           -- Voice owner receives notification
    vc.user_id as actor_id,          -- Commenter is the actor
    CASE 
        WHEN vc.parent_id IS NOT NULL THEN 'voice_reply'
        ELSE 'voice_comment'
    END as type,
    CASE 
        WHEN vc.parent_id IS NOT NULL THEN 'Yorumunuza yanıt verdi'
        ELSE 'Gönderinize yorum yaptı'
    END as message,
    jsonb_build_object(
        'voice_id', vc.voice_id,
        'comment_id', vc.id,
        'parent_id', vc.parent_id,
        'backfilled', true
    ) as metadata,
    vc.created_at as created_at,     -- Use original comment time
    true as read                      -- Mark as read so users aren't spammed
FROM voice_comments vc
JOIN campus_voices cv ON cv.id = vc.voice_id
WHERE 
    -- Don't notify yourself
    vc.user_id != cv.user_id
    -- Check if notification already exists for this comment
    AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.metadata->>'comment_id' = vc.id::text
        AND n.type IN ('voice_comment', 'voice_reply')
    );

-- Also backfill reply notifications (notify parent comment owner, not voice owner)
INSERT INTO notifications (user_id, actor_id, type, message, metadata, created_at, read)
SELECT 
    parent_vc.user_id as user_id,    -- Parent comment owner receives notification
    vc.user_id as actor_id,          -- Replier is the actor
    'voice_reply' as type,
    'Yorumunuza yanıt verdi' as message,
    jsonb_build_object(
        'voice_id', vc.voice_id,
        'comment_id', vc.id,
        'parent_id', vc.parent_id,
        'backfilled', true
    ) as metadata,
    vc.created_at as created_at,
    true as read
FROM voice_comments vc
JOIN voice_comments parent_vc ON parent_vc.id = vc.parent_id
WHERE 
    vc.parent_id IS NOT NULL
    AND vc.user_id != parent_vc.user_id
    AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.metadata->>'comment_id' = vc.id::text
        AND n.type = 'voice_reply'
        AND n.user_id = parent_vc.user_id
    );

-- Report how many notifications were created
-- Run this SELECT after the INSERTs to see the count:
-- SELECT COUNT(*) as backfilled_count FROM notifications WHERE metadata->>'backfilled' = 'true';
