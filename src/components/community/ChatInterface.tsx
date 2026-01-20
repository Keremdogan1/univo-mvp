'use client';

import { useState, useRef, useEffect } from 'react';
import { CommunityPost, CommunityPostComment, requestPostPermission, createComment, getPostComments, getCommunityPosts, reactToPost, deletePost, reactToComment, updateComment, deleteComment } from '@/app/actions/community-chat';
import PostComposer from './PostComposer';
import AdminRequestPanel from './AdminRequestPanel';
import { MessageSquare, Share2, MoreHorizontal, Hand, Send, Trash2, Flag, ArrowBigUp, ArrowBigDown, Loader2, Edit2, User, MoreVertical, ChevronDown, ChevronUp, ShieldCheck, BadgeCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { ThreadConnector, BranchConnector } from '../ui/ThreadConnectors';

// Relative time formatter to match VoiceView
const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Şimdi';
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes} dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} sa önce`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} gün önce`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} hf önce`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} ay önce`;
    const years = Math.floor(days / 365);
    return `${years} yıl önce`;
};

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
    const [comments, setComments] = useState<CommunityPostComment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentContent, setCommentContent] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    
    // Connection Line Refs
    const rootContainerRef = useRef<HTMLDivElement>(null);
    const postOwnerAvatarRef = useRef<HTMLDivElement>(null);
    const rootAvatarRefs = useRef<(HTMLDivElement | null)[]>([]);
    
    // Reaction State
    const [reactionCount, setReactionCount] = useState(post.reaction_count || 0);
    const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(post.user_reaction || null);

    const isOwner = post.user_id === currentUserId;
    const isCommunityAdminPost = communityAdminId === post.user_id;
    const canManagePost = isOwner || communityAdminId === currentUserId;

    const handleReaction = async (type: 'like' | 'dislike') => {
        const newReaction = userReaction === type ? null : type;
        const prevReaction = userReaction;
        const prevCount = reactionCount;
        
        setUserReaction(newReaction);
        
        let countDiff = 0;
        if (prevReaction === 'like') countDiff -= 1;
        if (prevReaction === 'dislike') countDiff += 1;
        if (newReaction === 'like') countDiff += 1;
        if (newReaction === 'dislike') countDiff -= 1;
        
        setReactionCount(prev => prev + countDiff);

        const result = await reactToPost(post.id, newReaction);
        if (!result.success) {
            setUserReaction(prevReaction);
            setReactionCount(prevCount);
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

    const refreshComments = async () => {
        setLoadingComments(true);
        try {
            const data = await getPostComments(post.id);
            setComments(data);
        } finally {
            setLoadingComments(false);
        }
    };

    const toggleComments = async () => {
        if (showComments) {
            setShowComments(false);
            return;
        }
        setShowComments(true);
        await refreshComments();
    };

    const handleComment = async (e: React.FormEvent, parentId: string | null = null, content: string = commentContent) => {
        if (e) e.preventDefault();
        const textToSubmit = content || commentContent;
        if (!textToSubmit.trim()) return;

        setSubmittingComment(true);
        try {
            const result = await createComment(post.id, textToSubmit, parentId);
            if (result.success) {
                setCommentContent('');
                setReplyingTo(null);
                await refreshComments();
                toast.success('Yorum gönderildi');
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
        <div className="bg-white dark:bg-[#0a0a0a] border-2 border-black dark:border-neutral-700 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] overflow-visible relative z-20 transition-colors">
            <div className="p-4">
                <div className="flex gap-4 items-stretch">
                    {/* Avatar Column */}
                    <div className="flex flex-col items-center shrink-0 relative">
                        <div 
                            ref={postOwnerAvatarRef}
                            className="w-10 h-10 rounded-full bg-neutral-200 overflow-hidden border-2 border-black dark:border-neutral-700 relative z-20"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={post.profiles?.avatar_url || '/placeholder-user.jpg'}
                                className="w-full h-full object-cover"
                                alt={post.profiles?.full_name}
                            />
                        </div>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Link href={`/profile/${post.user_id}`} className="font-bold text-sm text-neutral-900 dark:text-neutral-100 hover:underline">
                                        {post.profiles?.full_name}
                                    </Link>
                                    {isCommunityAdminPost && (
                                        <div className="group/badge relative flex items-center">
                                            <BadgeCheck size={16} className="text-[var(--primary-color)] fill-red-50 dark:fill-red-950/30" />
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] font-bold rounded opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                                Topluluk Sahibi
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
                                            </div>
                                        </div>
                                    )}
                                    {post.profiles?.department && (
                                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium capitalize">
                                            <span className="mx-1 opacity-50">|</span>
                                            {[post.profiles.department, post.profiles.class_year].filter(Boolean).join(' • ')}
                                        </span>
                                    )}
                                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-serif">
                                        <span className="mx-1 opacity-50">|</span>
                                        {formatRelativeTime(post.created_at)}
                                    </span>
                                    {post.is_announcement && (
                                        <span className="bg-black text-white dark:bg-white dark:text-black text-[10px] font-black px-2 py-0.5 rounded-none uppercase tracking-tighter ml-1">
                                            DUYURU
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="relative">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                    className="p-1 px-1.5 text-neutral-400 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    <MoreVertical size={16} />
                                </button>
                                
                                {showMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] z-20 py-1">
                                            {isOwner ? (
                                                <>
                                                    <button 
                                                        className="w-full px-4 py-2 text-left text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                                                        onClick={() => { setShowMenu(false); /* Implement edit if needed */ }}
                                                    >
                                                        <Edit2 size={14} /> Düzenle
                                                    </button>
                                                    <button 
                                                        onClick={() => { setShowMenu(false); handleDelete(); }}
                                                        className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={14} /> Gönderiyi Sil
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <Link 
                                                        href={`/profile/${post.user_id}`}
                                                        className="w-full px-4 py-2 text-left text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                                                    >
                                                        <User size={14} /> Profili Gör
                                                    </Link>
                                                    {communityAdminId === currentUserId && !isOwner && (
                                                        <button 
                                                            onClick={() => { setShowMenu(false); handleDelete(); }}
                                                            className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                                                        >
                                                            <Trash2 size={14} /> Gönderiyi Sil (Yönetici)
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="w-full px-4 py-2 text-left text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                                                        onClick={() => { setShowMenu(false); /* Implement report */ }}
                                                    >
                                                        <Flag size={14} /> Bildir
                                                    </button>
                                                </>
                                            )}
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
                            <div className="mb-4 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={post.media_url} className="w-full h-auto max-h-[500px] object-contain cursor-pointer transition-transform hover:scale-[1.01]" alt="Post content" />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 text-neutral-500 dark:text-neutral-400 pt-3 border-t-2 border-neutral-100 dark:border-neutral-800">
                            <div className="flex items-center gap-0.5 bg-neutral-50 dark:bg-neutral-900 rounded-full px-1.5 py-1 border border-neutral-100 dark:border-neutral-800">
                                <button 
                                    onClick={() => handleReaction('like')}
                                    className={`p-1.5 rounded-full transition-all flex items-center justify-center w-8 h-8 hover:bg-white dark:hover:bg-black hover:shadow-sm ${userReaction === 'like' ? 'text-green-600' : 'text-neutral-400 dark:text-neutral-500 hover:text-green-600'}`}
                                >
                                    <ArrowBigUp size={20} fill={userReaction === 'like' ? 'currentColor' : 'none'} />
                                </button>
                                <span className={`text-sm font-bold min-w-[1.5rem] text-center ${
                                    reactionCount > 0 ? 'text-green-600' : 
                                    reactionCount < 0 ? 'text-red-600' : 'text-neutral-500 dark:text-neutral-500'
                                }`}>
                                    {reactionCount}
                                </span>
                                <button 
                                    onClick={() => handleReaction('dislike')}
                                    className={`p-1.5 rounded-full transition-all flex items-center justify-center w-8 h-8 hover:bg-white dark:hover:bg-black hover:shadow-sm ${userReaction === 'dislike' ? 'text-red-600' : 'text-neutral-400 dark:text-neutral-500 hover:text-red-600'}`}
                                >
                                    <ArrowBigDown size={20} className={userReaction === 'dislike' ? 'fill-current' : ''} />
                                </button>
                            </div>
                            <button
                                onClick={toggleComments}
                                className={`flex items-center gap-2 group transition-colors uppercase text-xs font-bold px-3 py-1.5 rounded-full ${showComments ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white'}`}
                            >
                                <MessageSquare size={16} />
                                <span>{post.comment_count && post.comment_count > 0 ? post.comment_count : 'Yorumlar'}</span>
                            </button>
                             <button
                                 onClick={(e) => {
                                     e.stopPropagation();
                                     navigator.clipboard.writeText(`${window.location.origin}/community/${post.community_id}?post=${post.id}`);
                                     toast.success('Link kopyalandı!');
                                 }}
                                 className="flex items-center gap-2 group text-neutral-400 dark:text-neutral-500 hover:text-green-500 transition-colors ml-auto"
                             >
                                 <div className="p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20">
                                     <Share2 size={18} />
                                 </div>
                             </button>
                        </div>

                        {/* Comments Section - Inside Content Column for exact alignment */}
                        {showComments && (
                            <div ref={rootContainerRef} className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-900 w-full animate-in slide-in-from-top-2 relative overflow-visible">
                                {/* Main Rail from Post Owner to last root comment */}
                                <ThreadConnector 
                                    containerRef={rootContainerRef}
                                    startRef={postOwnerAvatarRef}
                                    endRefs={rootAvatarRefs}
                                    offsetX={-36} // Positioned relative to Content Column (starts at gap-4 + avatar center)
                                />

                                {loadingComments && comments.length === 0 ? (
                                    <div className="text-center py-4">
                                        <Loader2 size={24} className="animate-spin mx-auto text-black dark:text-white opacity-20" />
                                    </div>
                                ) : (
                                    <div className="space-y-4 mb-4 overflow-visible relative">
                                        {comments.map((comment, idx) => (
                                            <CommentItem 
                                                key={comment.id}
                                                comment={comment}
                                                post={post}
                                                currentUserId={currentUserId}
                                                communityAdminId={communityAdminId}
                                                onCommentAction={refreshComments}
                                                replyingTo={replyingTo}
                                                setReplyingTo={setReplyingTo}
                                                submittingComment={submittingComment}
                                                containerRef={rootContainerRef}
                                                offsetX={-36}
                                                onAvatarRef={(el) => { rootAvatarRefs.current[idx] = el; }}
                                            />
                                        ))}
                                        {comments.length === 0 && (
                                            <div className="text-center py-8 border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-xl">
                                                <p className="text-sm text-neutral-400 italic font-serif">Henüz hiç yorum yapılmamış. İlk yorumu sen yap!</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!replyingTo && (
                                    <form onSubmit={(e) => handleComment(e)} className="flex gap-2">
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
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CommentItem({ 
    comment, 
    post, 
    currentUserId, 
    communityAdminId, 
    onCommentAction,
    depth = 0,
    replyingTo,
    setReplyingTo,
    submittingComment,
    containerRef,
    offsetX = 0,
    onAvatarRef
}: { 
    comment: CommunityPostComment; 
    post: CommunityPost;
    currentUserId?: string;
    communityAdminId?: string;
    onCommentAction: () => void;
    depth?: number;
    replyingTo: string | null;
    setReplyingTo: (id: string | null) => void;
    submittingComment: boolean;
    containerRef?: React.RefObject<HTMLDivElement | null>;
    offsetX?: number;
    onAvatarRef?: (el: HTMLDivElement | null) => void;
}) {
    const avatarRef = useRef<HTMLDivElement>(null);
    const childContainerRef = useRef<HTMLDivElement>(null);
    const childAvatarRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (onAvatarRef) onAvatarRef(avatarRef.current);
    }, [onAvatarRef]);

    const isOwner = comment.user_id === currentUserId;
    const isCommunityAdminComment = communityAdminId === comment.user_id;
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [replyContent, setReplyContent] = useState('');
    
    const [reactionCount, setReactionCount] = useState(comment.reaction_count || 0);
    const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(comment.user_reaction || null);

    const handleReaction = async (type: 'like' | 'dislike') => {
        const newReaction = userReaction === type ? null : type;
        const prevReaction = userReaction;
        const prevCount = reactionCount;
        
        setUserReaction(newReaction);
        let countDiff = 0;
        if (prevReaction === 'like') countDiff -= 1;
        if (prevReaction === 'dislike') countDiff += 1;
        if (newReaction === 'like') countDiff += 1;
        if (newReaction === 'dislike') countDiff -= 1;
        setReactionCount(prev => prev + countDiff);

        const result = await reactToComment(comment.id, newReaction);
        if (!result.success) {
            setUserReaction(prevReaction);
            setReactionCount(prevCount);
            toast.error(result.message);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
        const result = await deleteComment(comment.id);
        if (result.success) {
            toast.success('Yorum silindi');
            onCommentAction();
        } else {
            toast.error(result.message);
        }
    };

    const handleUpdate = async () => {
        if (!editContent.trim()) return;
        const result = await updateComment(comment.id, editContent);
        if (result.success) {
            toast.success('Yorum güncellendi');
            setIsEditing(false);
            onCommentAction();
        } else {
            toast.error(result.message);
        }
    };

    const handleSubmitReply = async (content: string) => {
        if (!content.trim()) return;
        
        try {
            const result = await createComment(post.id, content, comment.id);
            if (result.success) {
                setReplyContent('');
                setReplyingTo(null);
                onCommentAction();
                toast.success('Yanıt gönderildi');
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Yanıt gönderilemedi');
        }
    };

    const isReplying = replyingTo === comment.id;

    return (
        <div className="flex flex-col relative">
            <div className="flex gap-3 relative group/comment">
                {/* Branch line to this avatar (if within a thread) */}
                {containerRef && (
                    <BranchConnector 
                        containerRef={containerRef}
                        avatarRef={avatarRef}
                        offsetX={offsetX}
                    />
                )}

                {/* Avatar Column */}
                <div className="flex flex-col items-center shrink-0">
                    <div 
                        ref={avatarRef}
                        className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden flex-shrink-0 border border-black dark:border-neutral-800 z-20"
                    >
                        <img
                            src={comment.profiles?.avatar_url || '/placeholder-user.jpg'}
                            className="w-full h-full object-cover"
                            alt="User"
                        />
                    </div>
                </div>

                {/* Content Column */}
                <div className="bg-white dark:bg-[#0a0a0a] px-4 py-3 border-2 border-black dark:border-neutral-700 text-sm flex-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] rounded-xl relative group z-20">
                    <div className="flex justify-between items-baseline mb-1">
                        <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-bold text-[11px] text-neutral-900 dark:text-neutral-200">
                                {comment.profiles?.full_name}
                            </span>
                            {isCommunityAdminComment && (
                                <div className="group/badge relative flex items-center">
                                    <BadgeCheck size={14} className="text-[var(--primary-color)] fill-red-50 dark:fill-red-950/30" />
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] font-bold rounded opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                        Topluluk Sahibi
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
                                    </div>
                                </div>
                            )}
                            {comment.profiles?.department && (
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium capitalize">
                                    <span className="mx-1 opacity-50">|</span>
                                    {[comment.profiles.department, comment.profiles.class_year].filter(Boolean).join(' • ')}
                                </span>
                            )}
                            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">
                                <span className="mx-1 opacity-50">|</span>
                                {formatRelativeTime(comment.created_at)}
                            </span>
                        </div>
                        <div className="relative">
                            <button onClick={() => setShowMenu(!showMenu)} className="p-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal size={14} className="text-neutral-400" />
                            </button>
                                {showMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                        <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] z-20 py-1">
                                            {isOwner ? (
                                                <>
                                                    <button onClick={() => { setShowMenu(false); setIsEditing(true); }} className="w-full px-3 py-1.5 text-left text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2">
                                                        <Edit2 size={12} /> Düzenle
                                                    </button>
                                                    <button onClick={() => { setShowMenu(false); handleDelete(); }} className="w-full px-3 py-1.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2">
                                                        <Trash2 size={12} /> Sil
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <Link href={`/profile/${comment.user_id}`} className="w-full px-3 py-1.5 text-left text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2">
                                                        <User size={12} /> Profil
                                                    </Link>
                                                    <button className="w-full px-3 py-1.5 text-left text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2">
                                                        <Flag size={12} /> Bildir
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                    {isEditing ? (
                        <div className="mt-2">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 p-2 text-sm font-serif focus:outline-none"
                                rows={2}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setIsEditing(false)} className="text-[10px] font-bold uppercase text-neutral-500 hover:text-black dark:hover:text-white">İptal</button>
                                <button onClick={handleUpdate} className="text-[10px] font-bold uppercase bg-black dark:bg-white text-white dark:text-black px-2 py-1 rounded-sm">Kaydet</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-neutral-700 dark:text-neutral-300 font-serif leading-tight">
                            {comment.content}
                        </p>
                    )}

                    {/* Bottom row: Reactions & Reply */}
                    <div className="flex items-center gap-4 mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/50">
                        <div className="flex items-center gap-0.5 bg-neutral-50 dark:bg-neutral-900 rounded-full px-1 py-0.5 border border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => handleReaction('like')} className={`p-1 rounded-full transition-all flex items-center justify-center w-6 h-6 hover:bg-white dark:hover:bg-black hover:shadow-sm ${userReaction === 'like' ? 'text-green-600' : 'text-neutral-400 dark:text-neutral-500 hover:text-green-600'}`}>
                                <ArrowBigUp size={16} fill={userReaction === 'like' ? 'currentColor' : 'none'} />
                            </button>
                            <span className={`text-[10px] font-bold min-w-[0.5rem] text-center ${reactionCount > 0 ? 'text-green-600' : reactionCount < 0 ? 'text-red-600' : 'text-neutral-500 dark:text-neutral-500'}`}>
                                {reactionCount}
                            </span>
                            <button onClick={() => handleReaction('dislike')} className={`p-1 rounded-full transition-all flex items-center justify-center w-6 h-6 hover:bg-white dark:hover:bg-black hover:shadow-sm ${userReaction === 'dislike' ? 'text-red-600' : 'text-neutral-400 dark:text-neutral-500 hover:text-red-600'}`}>
                                <ArrowBigDown size={16} className={userReaction === 'dislike' ? 'fill-current' : ''} />
                            </button>
                        </div>
                        <button 
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className={`text-[10px] font-black tracking-widest uppercase transition-colors ${replyingTo === comment.id ? 'text-black dark:text-white' : 'text-neutral-400 hover:text-black dark:hover:text-white'}`}
                        >
                            YANITLA
                        </button>
                    </div>
                </div>
            </div>

            {/* Reply Form */}
            {isReplying && (
                <div className="mt-2 ml-2 relative">
                    <div className="absolute top-0 -left-[calc(1.75rem+2px)] w-8 h-4 border-l-[2px] border-b-[2px] border-neutral-200 dark:border-neutral-800 rounded-bl-xl z-10" />
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmitReply(replyContent);
                            setReplyContent('');
                            setReplyingTo(null);
                        }} 
                        className="flex gap-2 animate-in fade-in slide-in-from-top-1 relative z-20 pt-1"
                    >
                        <input
                            type="text"
                            autoFocus
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={`@${comment.profiles?.full_name} yanıt ver...`}
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 text-xs focus:outline-none focus:border-[#ff4b2b] dark:focus:border-[#ff6b4b] font-serif dark:text-white transition-colors rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)]"
                        />
                        <button 
                            type="submit"
                            disabled={submittingComment || !replyContent.trim()}
                            className="p-1.5 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 transition-colors rounded-lg border-2 border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)]"
                        >
                            <Send size={14} />
                        </button>
                    </form>
                </div>
            )}

            {/* Children */}
            {comment.children && comment.children.length > 0 && (
                <div ref={childContainerRef} className="relative mt-4 ml-7">
                    <ThreadConnector 
                        containerRef={childContainerRef}
                        startRef={avatarRef}
                        endRefs={childAvatarRefs}
                        offsetX={16 - 28} // Aligns with parent's avatar rail center
                    />
                    
                    {comment.children?.map((child, childIdx) => (
                        <div key={child.id} className="relative mb-4">
                            <CommentItem 
                                key={child.id}
                                comment={child}
                                post={post}
                                currentUserId={currentUserId}
                                communityAdminId={communityAdminId}
                                onCommentAction={onCommentAction}
                                depth={depth + 1}
                                replyingTo={replyingTo}
                                setReplyingTo={setReplyingTo}
                                submittingComment={submittingComment}
                                containerRef={childContainerRef}
                                offsetX={16 - 28}
                                onAvatarRef={(el) => { childAvatarRefs.current[childIdx] = el; }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
