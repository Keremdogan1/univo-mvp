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
    // 1. List all users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) throw error;

    const deleteAll = searchParams.get('all') === 'true';

    const invalidUsers = deleteAll ? users : users.filter(user => {
        const email = user.email || '';
        return !email.endsWith('@metu.edu.tr') && !email.endsWith('@student.metu.edu.tr');
    });

    const results = [];

    // 2. Delete them
    for (const user of invalidUsers) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (deleteError) {
            results.push({ email: user.email, status: 'failed', reason: deleteError.message });
        } else {
             // Also delete profile? (Cascade should handle it usually, but good to be sure)
             await supabaseAdmin.from('profiles').delete().eq('id', user.id);
             results.push({ email: user.email, status: 'deleted' });
        }
    }

    return NextResponse.json({
        total: users.length,
        invalidCount: invalidUsers.length,
        results
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
