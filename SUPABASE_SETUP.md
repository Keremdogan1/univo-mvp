# Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Choose a name (e.g., "univo-database")
4. Set a strong database password (save it somewhere safe!)
5. Choose a region close to you
6. Click "Create new project" and wait 2-3 minutes

## Step 2: Get API Keys

1. Once your project is created, go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the left menu
3. You'll see two important values:
   - **Project URL**: Looks like `https://xxxxx.supabase.co`
   - **anon public** key: A long string starting with `eyJ...`

## Step 3: Configure Environment Variables

Create a file named `.env.local` in the root directory (`campus-gazette/.env.local`) with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
```

Replace the values with your actual Project URL and anon public key.

## Step 4: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the SQL from `supabase-schema.sql` (will be created next)
4. Click "Run" to create all tables

## Step 5: Restart Dev Server

After adding the `.env.local` file:

```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

Your application will now be connected to Supabase!

## Troubleshooting

- **"Invalid API key"**: Make sure you copied the **anon public** key, not the service_role key
- **Connection failed**: Check that the Project URL is correct and includes `https://`
- **Tables not found**: Make sure you ran the SQL schema in Step 4
