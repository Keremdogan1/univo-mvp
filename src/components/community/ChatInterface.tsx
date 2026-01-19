'use client';

import { useState, useRef } from 'react';
import { CommunityPost, requestPostPermission, createComment, getPostComments, getCommunityPosts, reactToPost, deletePost } from '@/app/actions/community-chat';
import PostComposer from './PostComposer';
import AdminRequestPanel from './AdminRequestPanel';
import { MessageSquare, Heart, Share2, MoreHorizontal, Hand, Send, Trash2, ShieldCheck, Flag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChatInterfaceProps {
    communityId: string;
    initialPosts: CommunityPost[];
    isAdmin: boolean;
    hasPermission: boolean; 
    pendingRequests: any[]; 
    communityAdminId?: string;
}

export default function ChatInterface({
    communityId,
    initialPosts,
    isAdmin,
    hasPermission,
    pendingRequests,
    communityAdminId
}: ChatInterfaceProps) {
    const { user } = useAuth();
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
                    <PostItem 
                        key={post.id} 
                        post={post} 
                        currentUserId={user?.id}
                        communityAdminId={communityAdminId}
                        onDeleted={fetchPosts}
                    />
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

function PostItem({ 
    post, 
    currentUserId, 
    communityAdminId,
    onDeleted 
}: { 
    post: CommunityPost; 
    currentUserId?: string;
    communityAdminId?: string;
    onDeleted?: () => void;
}) {
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentContent, setCommentContent] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    
    // Reaction State
    const [reactionCount, setReactionCount] = useState(post.reaction_count || 0);
    const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(post.user_reaction || null);

    const isOwner = post.user_id === currentUserId;
    const isCommunityAdmin = communityAdminId === post.user_id;
    const canDelete = isOwner || communityAdminId === currentUserId;

    const handleLike = async () => {
        const newReaction = userReaction === 'like' ? null : 'like';
        const prevReaction = userReaction;
        
        // Optimistic UI
        setUserReaction(newReaction);
        if (newReaction === 'like') {
            setReactionCount(prev => prev + 1);
        } else if (prevReaction === 'like') {
            setReactionCount(prev => prev - 1);
        }

        const result = await reactToPost(post.id, newReaction);
        if (!result.success) {
            // Revert
            setUserReaction(prevReaction);
            setReactionCount(post.reaction_count || 0);
            toast.error(result.message);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) return;
        
        const result = await deletePost(post.id, post.community_id);
        if (result.success) {
            toast.success('Gönderi silindi');
            if (onDeleted) onDeleted();
        } else {
            toast.error(result.message);
        }
    };

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
            const result = await createComment(post.id, commentContent);
            if (result.success) {
                setCommentContent('');
                // Refresh comments
                const data = await getPostComments(post.id);
                setComments(data);
                toast.success('Yorum yapıldı');
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Yorum yapılamadı');
        } finally {
            setSubmittingComment(false);
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] overflow-visible">
            <div className="p-4">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-200 overflow-hidden border-2 border-black dark:border-neutral-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={post.profiles?.avatar_url || '/placeholder-user.jpg'}
                                className="w-full h-full object-cover"
                                alt={post.profiles?.full_name}
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                    {post.profiles?.full_name}
                                    {isCommunityAdmin && (
                                        <span className="flex items-center gap-0.5 text-[#ff4b2b] dark:text-[#ff6b4b] text-[10px] bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/50">
                                            <ShieldCheck size={10} />
                                            Topluluk Sahibi
                                        </span>
                                    )}
                                </h4>
                                {post.is_announcement && (
                                    <span className="bg-black text-white dark:bg-white dark:text-black text-[10px] font-black px-2 py-0.5 rounded-none uppercase tracking-tighter">
                                        DUYURU
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                                {new Date(post.created_at).toLocaleDateString('tr-TR', {
                                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>

                    <div className="relative">
                        <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                            <MoreHorizontal size={20} className="text-neutral-400" />
                        </button>
                        
                        {showMenu && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] z-20 py-1">
                                    {canDelete && (
                                        <button 
                                            onClick={() => { setShowMenu(false); handleDelete(); }}
                                            className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                                        >
                                            <Trash2 size={14} />
                                            Gönderiyi Sil
                                        </button>
                                    )}
                                    <button 
                                        className="w-full px-4 py-2 text-left text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                                        onClick={() => setShowMenu(false)}
                                    >
                                        <Flag size={14} />
                                        Bildir
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="text-neutral-800 dark:text-neutral-200 text-sm whitespace-pre-wrap mb-4 font-serif leading-relaxed">
                    {post.content}
                </div>

                {post.media_url && (
                    <div className="mb-4 border-2 border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.media_url} className="w-full" alt="Post content" />
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 text-neutral-500 dark:text-neutral-400 pt-3 border-t-2 border-neutral-100 dark:border-neutral-800">
                    <button 
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-all ${userReaction === 'like' ? 'text-[#ff4b2b] scale-110' : 'hover:text-[#ff4b2b]'}`}
                    >
                        <Heart size={16} fill={userReaction === 'like' ? 'currentColor' : 'none'} />
                        <span>{reactionCount > 0 ? reactionCount : 'Beğen'}</span>
                    </button>
                    <button
                        onClick={loadComments}
                        className="flex items-center gap-1.5 text-xs font-bold hover:text-black dark:hover:text-white transition-colors"
                    >
                        <MessageSquare size={16} />
                        <span>{post.comment_count && post.comment_count > 0 ? post.comment_count : 'Yorumlar'}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-bold hover:text-black dark:hover:text-white transition-colors ml-auto">
                        <Share2 size={16} />
                    </button>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="bg-neutral-50 dark:bg-neutral-950/30 p-4 border-t-2 border-black dark:border-neutral-700">
                    {loadingComments ? (
                        <div className="text-center py-4">
                            <Loader2 size={24} className="animate-spin mx-auto text-black dark:text-white opacity-20" />
                        </div>
                    ) : (
                        <div className="space-y-4 mb-4">
                            {comments.map(comment => (
                                <div key={comment.id} className="group">
                                    <div className="flex gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden flex-shrink-0 border border-black dark:border-neutral-800">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={comment.profiles?.avatar_url || '/placeholder-user.jpg'}
                                                className="w-full h-full object-cover"
                                                alt="User"
                                            />
                                        </div>
                                        <div className="bg-white dark:bg-neutral-900 px-3 py-2 border-2 border-black dark:border-neutral-700 text-sm flex-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] relative">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="font-bold text-[11px] text-neutral-900 dark:text-neutral-200">
                                                    {comment.profiles?.full_name}
                                                    {comment.user_id === communityAdminId && (
                                                        <span className="ml-1.5 text-[#ff4b2b] text-[9px] font-black uppercase tracking-tighter">SAHİBİ</span>
                                                    )}
                                                </span>
                                                <span className="text-[9px] font-bold text-neutral-400 uppercase">
                                                    {new Date(comment.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-neutral-700 dark:text-neutral-300 font-serif leading-tight">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <div className="text-center py-4 border-2 border-dashed border-neutral-200 dark:border-neutral-800">
                                    <p className="text-xs text-neutral-400 italic font-serif">Henüz hiç yorum yapılmamış. İlk yorumu sen yap!</p>
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleComment} className="flex gap-2">
                        <textarea
                            className="flex-1 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 px-3 py-2 text-sm focus:outline-none font-serif min-h-[42px] max-h-32 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)]"
                            placeholder="Bir şeyler yaz..."
                            rows={1}
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            disabled={submittingComment}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleComment(e as any);
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!commentContent.trim() || submittingComment}
                            className="bg-black dark:bg-white text-white dark:text-black w-10 h-10 flex items-center justify-center disabled:opacity-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] flex-shrink-0"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

import { Loader2 } from 'lucide-react';
