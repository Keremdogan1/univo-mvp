import { getCommunityPosts, getPendingRequests, checkUserPermission } from '@/app/actions/community-chat';
import ChatInterface from '@/components/community/ChatInterface';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function CommunityChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const postsData = getCommunityPosts(id);
    const permissionData = checkUserPermission(id);

    // Fetch community admin_id for role labeling
    const supabase = await (await import('@/lib/supabase-server')).createClient();
    const { data: community } = await supabase
        .from('communities')
        .select('admin_id')
        .eq('id', id)
        .maybeSingle();

    // Parallel fetch
    const [posts, permission] = await Promise.all([postsData, permissionData]);

    const { hasPermission, isAdmin } = permission;

    // Only fetch pending requests if admin
    let pendingRequests = [];
    if (isAdmin) {
        pendingRequests = await getPendingRequests(id);
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href={`/community/${id}`}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                >
                    <ArrowLeft size={20} className="text-neutral-600 dark:text-neutral-400" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black font-serif flex items-center gap-2 uppercase tracking-tight text-black dark:text-white transition-colors">
                        <MessageSquare className="text-black dark:text-white" />
                        Topluluk Sohbeti
                    </h1>
                    <p className="text-neutral-500 text-sm">
                        Üyelerle iletişime geç, sorularını sor ve duyuruları takip et.
                    </p>
                </div>
            </div>

            <ChatInterface
                communityId={id}
                initialPosts={posts}
                isAdmin={isAdmin}
                hasPermission={hasPermission}
                pendingRequests={pendingRequests}
                communityAdminId={community?.admin_id}
            />
        </div>
    );
}
