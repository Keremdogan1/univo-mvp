'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowBigUp, ArrowBigDown, Edit2, Trash2, MoreVertical, Share2, MessageSquare, Send, X, Globe, Lock, ChevronDown, ChevronUp, Tag, Filter, User, Calendar, Award, Ghost } from 'lucide-react';
import { toast } from 'sonner';
import FriendButton from '../FriendButton';

// ThreadConnector: Vertical line connecting parent to last child
export const ThreadConnector = ({ 
    containerRef, 
    startRef, 
    endRefs,
    offsetX = 0
}: { 
    containerRef: React.RefObject<HTMLDivElement | null>;
    startRef: React.RefObject<HTMLDivElement | null>;
    endRefs: React.RefObject<(HTMLDivElement | null)[]>;
    offsetX?: number;
}) => {
    const [geometry, setGeometry] = useState({ startY: 0, endY: 0, visible: false });
    
    useEffect(() => {
        const calculate = () => {
            if (!containerRef.current || !startRef.current) return;
            
            const containerRect = containerRef.current.getBoundingClientRect();
            const startRect = startRef.current.getBoundingClientRect();
            const startCenterY = startRect.top + startRect.height / 2 - containerRect.top;
            
            const endElements = endRefs.current?.filter(el => el !== null) || [];
            if (endElements.length === 0) {
                setGeometry({ startY: 0, endY: 0, visible: false });
                return;
            }
            
            const lastEnd = endElements[endElements.length - 1];
            if (!lastEnd) return;
            
            const endRect = lastEnd.getBoundingClientRect();
            const endCenterY = endRect.top + endRect.height / 2 - containerRect.top;
            
            setGeometry({ 
                startY: startCenterY, 
                // Stop the rail 12px early (at the start of the curve radius) to avoid "protrusion" below the branch
                endY: endCenterY - 12,
                visible: true
            });
        };
        
        const timer = setTimeout(calculate, 100);
        const observer = new ResizeObserver(calculate);
        if (containerRef.current) observer.observe(containerRef.current);
        
        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [containerRef, startRef, endRefs]);
    
    if (!geometry.visible || geometry.endY <= geometry.startY) return null;
    
    return (
        <div 
            className="absolute w-[2px] bg-neutral-200 dark:bg-neutral-800 transition-all duration-300 pointer-events-none z-10"
            style={{ 
                left: offsetX,
                top: geometry.startY, 
                height: geometry.endY - geometry.startY 
            }}
        />
    );
};

// BranchConnector: L-shaped curve from vertical line to avatar
export const BranchConnector = ({
    containerRef,
    avatarRef,
    offsetX = 0
}: {
    containerRef: React.RefObject<HTMLDivElement | null>;
    avatarRef: React.RefObject<HTMLDivElement | null>;
    offsetX?: number;
}) => {
    const [geometry, setGeometry] = useState({ y: 0, width: 0, visible: false });
    
    useEffect(() => {
        const calculate = () => {
            if (!containerRef.current || !avatarRef.current) return;
            
            // Use the offsetParent (local context) for coordinate calculation
            // This ensures geometry is correct regardless of nesting depth
            const offsetParent = avatarRef.current.offsetParent as HTMLElement;
            if (!offsetParent) return;

            const parentRect = offsetParent.getBoundingClientRect();
            const avatarRect = avatarRef.current.getBoundingClientRect();
            
            // Calculate coordinates relative to the local context
            const avatarCenterY = avatarRect.top + avatarRect.height / 2 - parentRect.top;
            const avatarCenterX = avatarRect.left + avatarRect.width / 2 - parentRect.left;
            
            // Calculate width from the rail (at offsetX) to the avatar center
            const branchWidth = avatarCenterX - offsetX;
            
            setGeometry({
                // Start exactly at the curve radius (12px) above center
                y: avatarCenterY - 12,
                width: branchWidth,
                visible: true
            });
        };
        
        const timer = setTimeout(calculate, 100);
        const observer = new ResizeObserver(calculate);
        if (containerRef.current) observer.observe(containerRef.current);
        
        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [containerRef, avatarRef, offsetX]);
    
    if (!geometry.visible || geometry.width <= 0) return null;
    
    return (
        <div 
            className="absolute border-l-[2px] border-b-[2px] border-neutral-200 dark:border-neutral-800 rounded-bl-xl pointer-events-none z-10"
            style={{ 
                left: offsetX,
                top: geometry.y, 
                width: geometry.width,
                height: 12 // Matches rounded-xl (12px) for pure curve, no straight vertical part
            }}
        />
    );
};

// CommentItem: Recursive component for single comment
export const CommentItem = ({ 
    comment, 
    voice,
    user,
    depth = 0,
    containerRef,
    offsetX = 0,
    onAvatarRef,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    isCommenting,
    handleCommentReaction,
    handleCommentSubmit,
    handleCommentDelete,
    handleCommentUpdate,
    formatRelativeTime
}: { 
    comment: any;
    voice: any;
    user: any;
    depth?: number;
    containerRef?: React.RefObject<HTMLDivElement | null>;
    offsetX?: number;
    onAvatarRef?: (el: HTMLDivElement | null) => void;
    replyingTo: string | null;
    setReplyingTo: (id: string | null) => void;
    replyContent: string;
    setReplyContent: (val: string) => void;
    isCommenting: boolean;
    handleCommentReaction: any;
    handleCommentSubmit: any;
    handleCommentDelete: (id: string) => void;
    handleCommentUpdate: (id: string, content: string) => void;
    formatRelativeTime: (d: string) => string;
}) => {
    const isReplying = replyingTo === comment.id;
    const hasChildren = comment.children && comment.children.length > 0;
    const avatarRef = useRef<HTMLDivElement>(null);
    const childContainerRef = useRef<HTMLDivElement>(null);
    const childAvatarRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContentState] = useState(comment.content);
    const [showMenu, setShowMenu] = useState(false);

    // Report avatar ref to parent for geometry calculation
    useEffect(() => {
        if (onAvatarRef) onAvatarRef(avatarRef.current);
    }, [onAvatarRef]);
    
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
                        ref={avatarRef} // Ref for this comment's avatar
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden border border-neutral-200 dark:border-neutral-700 z-20 shrink-0 bg-white dark:bg-[#0a0a0a]"
                        style={!comment.user_avatar ? { 
                            backgroundColor: 'var(--primary-color)'
                        } : undefined}
                    >
                        {comment.user_avatar ? (
                            <img src={comment.user_avatar} alt={comment.user} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            comment.user?.charAt(0) || '?'
                        )}
                    </div>
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0">
                    {/* Comment Card */}
                    <div className="bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm relative z-20 hover:shadow-md transition-all">
                        
                        <div className="flex justify-between items-start mb-1">
                            <Link href={`/profile/${comment.user_id}`} className="font-bold text-sm text-neutral-900 dark:text-neutral-200 hover:underline">
                                {comment.user}
                            </Link>
                            
                             {/* 3-Dot Menu - Always visible */}
                             {user && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        className="p-1 text-neutral-400 hover:text-black dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    
                                    {showMenu && (
                                        <>
                                            <div className="fixed inset-0 z-[90]" onClick={() => setShowMenu(false)} />
                                            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded shadow-lg overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                                                {user.id === comment.user_id ? (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setIsEditing(true);
                                                                setEditContentState(comment.content);
                                                                setShowMenu(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2 transition-colors"
                                                        >
                                                            <Edit2 size={14} /> Düzenle
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Bu yorumu silmek istediğinize emin misiniz?')) {
                                                                    handleCommentDelete(comment.id);
                                                                }
                                                                setShowMenu(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 transition-colors"
                                                        >
                                                            <Trash2 size={14} /> Sil
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link 
                                                            href={`/profile/${comment.user_id}`}
                                                            className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 flex items-center gap-2 transition-colors"
                                                        >
                                                            <User size={14} /> Profili Gör
                                                        </Link>
                                                        <FriendButton 
                                                            targetUserId={comment.user_id} 
                                                            variant="menu-item"
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Content or Edit Form */}
                        {isEditing ? (
                            <div className="mb-2">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContentState(e.target.value)}
                                    className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded text-sm bg-white dark:bg-neutral-800 dark:text-white font-serif focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none resize-none"
                                    rows={2}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-3 py-1 text-xs font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                                    >
                                        İPTAL
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleCommentUpdate(comment.id, editContent);
                                            setIsEditing(false);
                                        }}
                                        disabled={!editContent.trim()}
                                        className="px-3 py-1 text-xs font-bold bg-black dark:bg-white text-white dark:text-black rounded disabled:opacity-50"
                                    >
                                        KAYDET
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/50">
                            {/* Reactions */}
                            <div className="flex items-center gap-0.5 bg-neutral-50 dark:bg-neutral-900 rounded-full px-1 py-0.5 border border-neutral-100 dark:border-neutral-800">
                                <button
                                    onClick={(e) => handleCommentReaction(e, voice.id, comment.id, 'like')}
                                    className={`p-1 rounded-full transition-all flex items-center justify-center w-6 h-6 hover:bg-white dark:hover:bg-black hover:shadow-sm ${comment.user_reaction === 'like' ? 'text-green-600' : 'text-neutral-400 dark:text-neutral-500 hover:text-green-600'}`}
                                >
                                    <ArrowBigUp size={16} className={comment.user_reaction === 'like' ? 'fill-current' : ''} />
                                </button>
                                <span className={`text-[10px] font-bold min-w-[0.5rem] text-center ${
                                    (comment.reactions?.count || 0) > 0 ? 'text-green-600' : 
                                    (comment.reactions?.count || 0) < 0 ? 'text-red-600' : 'text-neutral-500 dark:text-neutral-500'
                                }`}>
                                    {comment.reactions?.count || 0}
                                </span>
                                <button
                                    onClick={(e) => handleCommentReaction(e, voice.id, comment.id, 'dislike')}
                                    className={`p-1 rounded-full transition-all flex items-center justify-center w-6 h-6 hover:bg-white dark:hover:bg-black hover:shadow-sm ${comment.user_reaction === 'dislike' ? 'text-red-600' : 'text-neutral-400 dark:text-neutral-500 hover:text-red-600'}`}
                                >
                                    <ArrowBigUp size={16} className={`rotate-180 ${comment.user_reaction === 'dislike' ? 'fill-current' : ''}`} />
                                </button>
                            </div>
                            
                            <button 
                                onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                                className={`flex items-center gap-1 text-xs font-bold transition-colors uppercase tracking-wide px-2 py-1 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-900 ${isReplying ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white'}`}
                            >
                                YANITLA
                            </button>
                            
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(`${window.location.origin}/voice/${voice.id}`);
                                    toast.success('Link kopyalandı!');
                                }}
                                className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-green-500 transition-colors rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-900"
                                title="Paylaş"
                            >
                                <Share2 size={16} />
                            </button>

                             {/* Timestamp moved to right */}
                             <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-serif ml-auto">
                                {formatRelativeTime(comment.created_at)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reply Form */}
            {isReplying && (
                <div className="mt-3 ml-2 relative">
                    <div className="absolute top-0 -left-[calc(1.75rem+1px)] w-8 h-4 border-l-[2px] border-b-[2px] border-neutral-200 dark:border-neutral-800 rounded-bl-xl z-0" />
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        handleCommentSubmit(e, voice.id, comment.id, replyContent);
                        setReplyContent(''); 
                        setReplyingTo(null);
                    }} className="flex gap-2 animate-in fade-in slide-in-from-top-1 relative z-10 pt-2">
                        <input
                            type="text"
                            autoFocus
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={`@${comment.user} yanıt ver...`}
                            className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:border-black dark:focus:border-white font-serif dark:text-white transition-colors"
                        />
                        <button 
                            type="submit"
                            disabled={isCommenting || !replyContent.trim()}
                            className="p-2 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                        >
                            <Send size={14} />
                        </button>
                    </form>
                </div>
            )}

            {/* Children Render */}
            {hasChildren && (
                <div ref={childContainerRef} className="relative mt-4 ml-7">
                    <ThreadConnector 
                        containerRef={childContainerRef}
                        startRef={avatarRef}
                        endRefs={childAvatarRefs}
                        offsetX={16 - 28}
                    />
                    
                    {comment.children.map((child: any, idx: number) => (
                        <div key={child.id} className="relative mb-4 last:pb-0">
                            <CommentItem 
                                comment={child} 
                                voice={voice}
                                user={user}
                                depth={depth + 1}
                                containerRef={childContainerRef}
                                offsetX={16 - 28}
                                onAvatarRef={el => { childAvatarRefs.current[idx] = el; }}
                                replyingTo={replyingTo}
                                setReplyingTo={setReplyingTo}
                                replyContent={replyContent}
                                setReplyContent={setReplyContent}
                                isCommenting={isCommenting}
                                handleCommentReaction={handleCommentReaction}
                                handleCommentSubmit={handleCommentSubmit}
                                handleCommentDelete={handleCommentDelete}
                                handleCommentUpdate={handleCommentUpdate}
                                formatRelativeTime={formatRelativeTime}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// CommentThread: Main container for voice comments
export default function CommentThread({
    voice,
    user,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    isCommenting,
    handleCommentReaction,
    handleCommentSubmit,
    handleCommentDelete,
    handleCommentUpdate,
    formatRelativeTime,
    visibleCommentsCount,
    loadMoreComments,
    postOwnerAvatarRef
}: {
    voice: any;
    user: any;
    replyingTo: string | null;
    setReplyingTo: (id: string | null) => void;
    replyContent: string;
    setReplyContent: (val: string) => void;
    isCommenting: boolean;
    handleCommentReaction: any;
    handleCommentSubmit: any;
    handleCommentDelete: (id: string) => void;
    handleCommentUpdate: (id: string, content: string) => void;
    formatRelativeTime: any;
    visibleCommentsCount: number;
    loadMoreComments: (id: string) => void;
    postOwnerAvatarRef: HTMLDivElement | null;
}) {
    // 1. Prepare comments with user reaction state
    const preparedComments = voice.comments.map((c: any) => ({
        ...c,
        children: [] as any[],
        user_reaction: user ? (c.reactions as any)?.data?.find((r: any) => r.user_id === user.id)?.reaction_type : null
    }));

    // 2. Build Tree
    const commentMap: any = {};
    const roots: any[] = [];
    preparedComments.forEach((c: any) => commentMap[c.id] = c);
    preparedComments.forEach((c: any) => {
        if (c.parent_id && commentMap[c.parent_id]) {
            commentMap[c.parent_id].children.push(commentMap[c.id]);
        } else {
            roots.push(commentMap[c.id]);
        }
    });
    
    // Sort by newest
    roots.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const visibleRoots = roots.slice(0, visibleCommentsCount || 10);
    const rootContainerRef = useRef<HTMLDivElement>(null);
    const rootAvatarRefs = useRef<(HTMLDivElement | null)[]>([]);
    
    return (
        <div ref={rootContainerRef} className="relative">
            {/* Main Rail from Post Owner to last root comment */}
            <ThreadConnector 
                containerRef={rootContainerRef}
                startRef={{ current: postOwnerAvatarRef }}
                endRefs={rootAvatarRefs}
                offsetX={-36}
            />

            {visibleRoots.map((root, idx) => (
                <div key={root.id} className="relative mb-4 first:mt-4">
                    <CommentItem 
                        comment={root} 
                        voice={voice}
                        user={user}
                        containerRef={rootContainerRef}
                        offsetX={-36}
                        onAvatarRef={el => { rootAvatarRefs.current[idx] = el; }}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        replyContent={replyContent}
                        setReplyContent={setReplyContent}
                        isCommenting={isCommenting}
                        handleCommentReaction={handleCommentReaction}
                        handleCommentSubmit={handleCommentSubmit}
                        handleCommentDelete={handleCommentDelete}
                        handleCommentUpdate={handleCommentUpdate}
                        formatRelativeTime={formatRelativeTime}
                    />
                </div>
            ))}

            {roots.length > (visibleCommentsCount || 10) && (
                <button 
                    onClick={() => loadMoreComments(voice.id)}
                    className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 px-3 py-1.5 rounded-full transition-colors mt-4 mx-auto uppercase"
                >
                    <div className="flex items-center justify-center w-4 h-4">
                        <ChevronDown size={14} />
                    </div>
                    DAHA FAZLA YÜKLE ({roots.length - (visibleCommentsCount || 10)})
                </button>
            )}
        </div>
    );
};
