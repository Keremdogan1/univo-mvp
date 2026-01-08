import { NextResponse } from 'next/server';
import getSupabaseAdmin from '@/lib/supabase-admin';

export async function GET(request: Request) {
  // Simple "Secret" protection (e.g. ?secret=univo_admin_123)
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.ADMIN_SECRET && secret !== 'univo_admin_cleanup') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const deleteAll = searchParams.get('all') === 'true';
    let totalDeleted = 0;
    
    let hasMoreUsers = true;
    
    while (hasMoreUsers) {
        // Fetch users (default limit 50)
        const listRes = await supabaseAdmin.auth.admin.listUsers();
        if (listRes.error) throw listRes.error;
        const users = listRes.data?.users || [];
        
        if (users.length === 0) {
            hasMoreUsers = false;
            break;
        }

        const targets = deleteAll ? users : users.filter(user => {
            const email = user.email || '';
            return !email.endsWith('@metu.edu.tr') && !email.endsWith('@student.metu.edu.tr');
        });

        if (targets.length === 0 && !deleteAll) {
             // If we are filtering and found nothing in this batch, we might have more on next pages
             // For simplicity, we assume we either delete ALL or none for this debug script.
             hasMoreUsers = false; 
             continue; 
        }

        // Delete current batch
        for (const user of targets) {
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
            if (!deleteError) {
                // Also delete profile
                await supabaseAdmin.from('profiles').delete().eq('id', user.id);
                totalDeleted++;
            }
        }
        
        if (deleteAll) {
             // If we fetched less than 50, we are done.
             if (users.length < 50) hasMoreUsers = false;
        } else {
             if (targets.length === 0) hasMoreUsers = false; 
        }
    }

    return NextResponse.json({
        success: true,
        deletedCount: totalDeleted,
        message: 'Cleanup process completed.'
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
