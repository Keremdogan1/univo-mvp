'use client';

import { useState, useRef } from 'react';
import { CommunityPost, requestPostPermission, createComment, getPostComments, getCommunityPosts } from '@/app/actions/community-chat';
import PostComposer from './PostComposer';
import AdminRequestPanel from './AdminRequestPanel';
import { MessageSquare, Heart, Share2, MoreHorizontal, Hand, Send } from 'lucide-react';
import { toast } from 'sonner';

interface ChatInterfaceProps {
    communityId: string;
    initialPosts: CommunityPost[];
    isAdmin: boolean;
    hasPermission: boolean; // if true (admin or approved), show composer
    pendingRequests: any[]; // Only passed if isAdmin
}

export default function ChatInterface({
    communityId,
    initialPosts,
    isAdmin,
    hasPermission,
    pendingRequests
}: ChatInterfaceProps) {
    const [posts, setPosts] = useState(initialPosts);

    const fetchPosts = async () => {
        const data = await getCommunityPosts(communityId);
        setPosts(data);
    };

    const handleRequestPermission = async () => {
        toast.promise(requestPostPermission(communityId), {
            loading: 'İstek gönderiliyor...',
            success: (data) => {
                if (!data.success) throw new Error(data.message);
                return 'Yöneticilere bildirim gönderildi. Onaylandığında bildirim alacaksınız.';
            },
            error: (err) => err.message || 'Bir hata oluştu'
        });
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Admin Panel */}
            {isAdmin && pendingRequests.length > 0 && (
                <AdminRequestPanel requests={pendingRequests} />
            )}

            {/* Input Area */}
            {hasPermission ? (
                <PostComposer
                    communityId={communityId}
                    onPostCreated={fetchPosts}
                    isAnnouncement={isAdmin} 
                />
            ) : (
            <div className="bg-neutral-50 dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-6 text-center mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                    <div className="w-12 h-12 bg-white dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3 border-2 border-black dark:border-neutral-600">
                        <Hand className="text-neutral-700 dark:text-neutral-300" size={24} />
                    </div>
                    <h3 className="font-bold font-serif text-lg mb-1 text-neutral-900 dark:text-neutral-100">Bir sorun mu var?</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4 font-serif">
                        Sadece yöneticiler ve izin verilen üyeler paylaşım yapabilir. Sormak istediğin bir soru varsa izin isteyebilirsin.
                    </p>
                    <button
                        onClick={handleRequestPermission}
                        className="text-white px-6 py-2.5 font-bold transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        style={{ backgroundColor: 'var(--primary-color)' }}
                    >
                        Sorum Var! ✋
                    </button>
                </div>
            )}

            {/* Feed */}
            <div className="space-y-6">
                {posts.map(post => (
                    <PostItem key={post.id} post={post} />
                ))}
                {posts.length === 0 && (
                    <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-20 text-black dark:text-white" />
                        <p className="font-serif italic font-medium">Henüz hiç paylaşım yapılmamış.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function PostItem({ post }: { post: CommunityPost }) {
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]); // Need type
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentContent, setCommentContent] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    const loadComments = async () => {
        if (showComments) {
            setShowComments(false);
            return;
        }
        setLoadingComments(true);
        setShowComments(true);
        try {
            const data = await getPostComments(post.id);
            setComments(data);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentContent.trim()) return;

        setSubmittingComment(true);
        try {
            await createComment(post.id, commentContent);
            setCommentContent('');
            // Refresh comments
            const data = await getPostComments(post.id);
            setComments(data);
        } catch (error) {
            toast.error('Yorum yapılamadı');
        } finally {
            setSubmittingComment(false);
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] overflow-hidden">
            <div className="p-4">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-200 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={post.profiles?.avatar_url || '/placeholder-user.jpg'}
                                className="w-full h-full object-cover"
                                alt={post.profiles?.full_name}
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                    {post.profiles?.full_name}
                                </h4>
                                {post.is_announcement && (
                                    <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Duyuru
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-neutral-500">
                                {new Date(post.created_at).toLocaleDateString('tr-TR', {
                                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="text-neutral-800 dark:text-neutral-200 text-sm whitespace-pre-wrap mb-4">
                    {post.content}
                </div>

                {post.media_url && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-neutral-100 dark:border-neutral-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.media_url} className="w-full" alt="Post content" />
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 text-neutral-500 dark:text-neutral-400 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <button className="flex items-center gap-1.5 text-xs font-medium hover:text-red-500 transition-colors">
                        <Heart size={16} />
                        Beğen
                    </button>
                    <button
                        onClick={loadComments}
                        className="flex items-center gap-1.5 text-xs font-medium hover:text-blue-500 transition-colors"
                    >
                        <MessageSquare size={16} />
                        Yorumlar
                    </button>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="bg-neutral-50 dark:bg-neutral-950/50 p-4 border-t border-neutral-100 dark:border-neutral-800">
                    {loadingComments ? (
                        <div className="text-center py-4">
                            <Loader2 size={20} className="animate-spin mx-auto text-neutral-400" />
                        </div>
                    ) : (
                        <div className="space-y-4 mb-4">
                            {comments.map(comment => (
                                <div key={comment.id} className="flex gap-2.5">
                                    <div className="w-6 h-6 rounded-full bg-neutral-200 overflow-hidden flex-shrink-0 mt-1">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={comment.profiles?.avatar_url || '/placeholder-user.jpg'}
                                            className="w-full h-full object-cover"
                                            alt="User"
                                        />
                                    </div>
                                    <div className="bg-white dark:bg-neutral-900 p-2.5 border-2 border-black dark:border-neutral-700 text-sm flex-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="font-bold text-xs text-neutral-900 dark:text-neutral-200">
                                                {comment.profiles?.full_name}
                                            </span>
                                            <span className="text-[10px] text-neutral-400">
                                                {new Date(comment.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-neutral-700 dark:text-neutral-300">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p className="text-center text-xs text-neutral-400 italic">İlk yorumu sen yap!</p>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleComment} className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 px-3 py-2 text-sm focus:outline-none"
                            placeholder="Yorum yaz..."
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            disabled={submittingComment}
                        />
                        <button
                            type="submit"
                            disabled={!commentContent.trim() || submittingComment}
                            className="bg-black dark:bg-white text-white dark:text-black p-2 disabled:opacity-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

import { Loader2 } from 'lucide-react';
