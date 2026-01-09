-- Add social media columns to communities table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'instagram_url') THEN
        ALTER TABLE communities ADD COLUMN instagram_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'twitter_url') THEN
        ALTER TABLE communities ADD COLUMN twitter_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'website_url') THEN
        ALTER TABLE communities ADD COLUMN website_url TEXT;
    END IF;
END $$;
