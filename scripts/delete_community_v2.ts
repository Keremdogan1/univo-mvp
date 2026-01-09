
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parser
function getEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const env: Record<string, string> = {};
        envFile.split('\n').forEach(line => {
            const [key, val] = line.split('=');
            if (key && val) env[key.trim()] = val.trim().replace(/"/g, ''); // Simple cleanup
        });
        return env;
    } catch (e) {
        console.error('Could not read .env.local');
        return {};
    }
}

const env = getEnv();
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase keys in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteCommunity() {
    console.log('Searching for community...');
    try {
        const { data: communities } = await supabase
            .from('communities')
            .select('id, name')
            .ilike('name', 'UniVo Sanat Topluluğu'); 

        if (!communities || communities.length === 0) {
            console.log('Community not found.');
            return;
        }

        console.log(`Found ${communities.length} communities.`);

        for (const comm of communities) {
            // First delete events
            await supabase.from('events').delete().eq('community_id', comm.id);
            // Then community
            const { error } = await supabase
                .from('communities')
                .delete()
                .eq('id', comm.id);
            
            if (error) {
                console.error(`Error deleting ${comm.name}:`, error);
            } else {
                console.log(`Deleted: ${comm.name}`);
            }
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

deleteCommunity();
