-- Helper script to update the demo user's email
-- Run this in your Supabase SQL Editor

DO $$
DECLARE
    v_user_id UUID;
    v_target_email TEXT := 'dogan.kerem@metu.edu.tr';
    v_old_email TEXT := 'kerem.dogan111@gmail.com';
BEGIN
    -- 1. Find user by old email
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_old_email;

    IF v_user_id IS NOT NULL THEN
        -- 2. Update email
        UPDATE auth.users SET email = v_target_email WHERE id = v_user_id;

        -- 3. Also update profile full name if needed for consistency
        UPDATE public.profiles SET full_name = 'Kerem Doğan' WHERE id = v_user_id;
        
        RAISE NOTICE 'Updated user % from % to %', v_user_id, v_old_email, v_target_email;
    ELSE
        -- Fallback: check if target already exists just in case
        SELECT id INTO v_user_id FROM auth.users WHERE email = v_target_email;
        IF v_user_id IS NOT NULL THEN
            RAISE NOTICE 'User % already exists. No action needed.', v_target_email;
        ELSE
            RAISE NOTICE 'User with email % not found.', v_old_email;
        END IF;
    END IF;
END $$;
