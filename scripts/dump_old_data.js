const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const OLD_URL = "https://oqgdnywowtfjenjmrmwi.supabase.co";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZ2RueXdvd3RmamVuam1ybXdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAyNjY4MCwiZXhwIjoyMDgyNjAyNjgwfQ.ujQ3-3izWOoBXcONKeAmlZJnOdYzj9o8tZzyIAzata8";

const supabase = createClient(OLD_URL, OLD_KEY);

const tables = [
  'profiles',
  'communities',
  'events',
  'campus_voices',
  'voice_reactions',
  'voice_comments',
  'community_posts',
  'community_post_comments',
  'community_comment_reactions',
  'community_permission_requests',
  'notifications'
];

async function dumpData() {
  let fullSql = "-- DATA MIGRATION SCRIPT\nSET session_replication_role = 'replica';\n\n";

  for (const table of tables) {
    console.log(`Fetching ${table}...`);
    const { data, error } = await supabase.from(table).select('*');
    
    if (error) {
      console.error(`Error fetching ${table}:`, error);
      continue;
    }

    if (!data || data.length === 0) continue;

    fullSql += `-- Table: ${table}\n`;
    for (const row of data) {
      const columnsArr = Object.keys(row);
      const columnsStr = columnsArr.join(', ');
      const values = columnsArr.map(col => {
        const v = row[col];
        if (v === null) return 'NULL';
        
        // Handle TEXT[] columns
        if (Array.isArray(v) && (col === 'tags' || col === 'links')) {
          return `ARRAY[${v.map(item => `'${String(item).replace(/'/g, "''")}'`).join(', ')}]::TEXT[]`;
        }
        
        // Handle JSONB and other objects
        if (typeof v === 'object') {
          return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
        }
        
        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
        return v;
      }).join(', ');
      
      fullSql += `INSERT INTO public.${table} (${columnsStr}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
    }
    fullSql += "\n";
  }

  fullSql += "\nSET session_replication_role = 'origin';";
  fs.writeFileSync('database/DATA_MIGRATION.sql', fullSql);
  console.log('Finished! Saved to database/DATA_MIGRATION.sql');
}

dumpData();
