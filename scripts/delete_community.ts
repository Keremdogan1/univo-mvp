
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteCommunity() {
    console.log('Searching for community...');
    try {
        const { data: communities, error: searchError } = await supabase
            .from('communities')
            .select('id, name')
            .ilike('name', 'UniVo Sanat Topluluğu'); // ilike for case-insensitive

        if (searchError) {
            console.error('Search error:', searchError);
            return;
        }

        if (!communities || communities.length === 0) {
            console.log('Community not found.');
            return;
        }

        console.log(`Found ${communities.length} communities. Deleting...`);

        for (const comm of communities) {
            // Delete related events/followers first if strict FK (though usually cascade)
            // Assuming cascade or simple delete
            const { error: deleteError } = await supabase
                .from('communities')
                .delete()
                .eq('id', comm.id);
            
            if (deleteError) {
                console.error(`Error deleting ${comm.name} (${comm.id}):`, deleteError);
            } else {
                console.log(`Deleted: ${comm.name} (${comm.id})`);
            }
        }
    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

deleteCommunity();
