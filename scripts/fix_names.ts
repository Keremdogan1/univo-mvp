
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Helper to load env vars manually
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars: Record<string, string> = {};
        
        envFile.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
            }
        });
        return envVars;
    } catch (error) {
        console.error("Could not load .env.local file");
        return {};
    }
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// TitleCase Utility (Same as in src/lib/utils.ts)
function toTitleCase(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .split(" ")
    .map((word) => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1).toLocaleLowerCase("tr-TR"))
    .join(" ");
}

async function fixNames() {
    console.log('🔄 Starting Name Normalization...');

    // 1. Fetch all profiles
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log(`Checking ${profiles.length} profiles...`);
    let updatedCount = 0;

    for (const profile of profiles) {
        if (!profile.full_name) continue;

        const originalName = profile.full_name;
        const normalizedName = toTitleCase(originalName);

        if (originalName !== normalizedName) {
            console.log(`Fixing: "${originalName}" -> "${normalizedName}"`);
            
            // Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ full_name: normalizedName })
                .eq('id', profile.id);

            if (updateError) {
                console.error(`Failed to update ${originalName}:`, updateError.message);
            } else {
                updatedCount++;
                
                // Optional: Update Auth User Metadata as well if possible
                try {
                     const { error: authError } = await supabase.auth.admin.updateUserById(profile.id, {
                        user_metadata: { full_name: normalizedName }
                     });
                     if (authError) console.warn(`   Could not update auth metadata for ${normalizedName}: ${authError.message}`);
                     else console.log(`   + Auth Metadata updated.`);
                } catch (e) {
                    // Ignore auth update errors if service role permission insufficient or user not found
                }
            }
        }
    }

    console.log(`✅ Completed! Updated ${updatedCount} profiles.`);
}

fixNames();
