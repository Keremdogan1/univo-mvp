
-- Check if columns exist and add them if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'quota') THEN
        ALTER TABLE events ADD COLUMN quota INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'image_url') THEN
        ALTER TABLE events ADD COLUMN image_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'registration_link') THEN
        ALTER TABLE events ADD COLUMN registration_link TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'maps_url') THEN
        ALTER TABLE events ADD COLUMN maps_url TEXT;
    END IF;
END $$;
