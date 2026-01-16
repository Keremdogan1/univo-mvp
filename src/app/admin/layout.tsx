import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const sessionCookie = (await cookies()).get('univo_admin_session');

    if (!sessionCookie) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex">
            <AdminSidebar />
            <main className="flex-1 h-screen overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
