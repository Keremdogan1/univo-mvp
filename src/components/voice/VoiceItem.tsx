'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowBigUp, ArrowBigDown, Edit2, Trash2, MoreVertical, Share2, Filter, User, Calendar, Award, Ghost, Tag, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import CommentThread from './CommentSystem';
import { Voice } from './types';

// Helper function locally if not passed? 
// Actually assume passed or importing helpers if they were outside component relative.
// VoiceView defined formatRelativeTime inside. I should ask for it as prop.

interface VoiceItemProps {
    voice: Voice;
    user: any;
    handleReaction: (voiceId: string, type: 'like' | 'dislike') => void;
    handleDelete: (voiceId: string) => void;
    startEdit: (voice: Voice) => void;
    editingId: string | null;
    handleUpdate: (e: React.FormEvent) => void;
    editContent: string;
    setEditContent: (val: string) => void;
    setEditingId: (val: string | null) => void;
    activeMenu: string | null;
    setActiveMenu: (val: string | null) => void;
    activeCommentBox: string | null;
    setActiveCommentBox: (val: string | null) => void;
    toggleVoiceComments: (voiceId: string) => void;
    expandedVoices: Record<string, boolean>;
    visibleCommentsCount: Record<string, number>;
    loadMoreComments: (voiceId: string) => void;
    postOwnerAvatarRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
    containerRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
    
    // Comment Handling Props
    handleCommentSubmit: (e: React.FormEvent, voiceId: string, parentId?: string | null, content?: string | null) => void;
    handleCommentReaction: (e: React.MouseEvent, voiceId: string, commentId: string, type: 'like' | 'dislike') => void;
    
    // Reply State (global or local? In VoiceView it seemed global 'replyingTo').
    replyingTo: string | null;
    setReplyingTo: (id: string | null) => void;
    replyContent: string;
    setReplyContent: (val: string) => void;
    isCommenting: boolean;
    newComment: string;
    setNewComment: (val: string) => void;

    formatRelativeTime: (d: string) => string;
    renderContentWithTags: (content: string) => React.ReactNode;
}

export default function VoiceItem({
    voice,
    user,
    handleReaction,
    handleDelete,
    startEdit,
    editingId,
    handleUpdate,
    editContent,
    setEditContent,
    setEditingId,
    activeMenu,
    setActiveMenu,
    activeCommentBox,
    setActiveCommentBox,
    toggleVoiceComments,
    expandedVoices,
    visibleCommentsCount,
    loadMoreComments,
    postOwnerAvatarRefs,
    containerRefs,
    handleCommentSubmit,
    handleCommentReaction,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    isCommenting,
    newComment,
    setNewComment,
    formatRelativeTime,
    renderContentWithTags
}: VoiceItemProps) {
    const reactions = voice.reactions || [];
    const myReaction = user ? reactions.find(r => r.user_id === user.id)?.reaction_type : null;
    const likeCount = reactions.filter(r => r.reaction_type === 'like').length;
    const dislikeCount = reactions.filter(r => r.reaction_type === 'dislike').length;
    const score = likeCount - dislikeCount;

    return (
        <article 
            className="group relative flex flex-col sm:flex-row gap-4 p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow dark:shadow-neutral-900/50 mb-6"
            ref={el => { containerRefs.current[voice.id] = el as HTMLDivElement | null; }}
        >
            {/* Vote Column */}
            <div className="flex sm:flex-col items-center gap-1 sm:gap-2 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-full sm:rounded-2xl border border-neutral-100 dark:border-neutral-800 h-fit self-start">
                <button
                    onClick={() => handleReaction(voice.id, 'like')}
                    className={`p-1.5 rounded-xl transition-all ${myReaction === 'like' ? 'bg-white dark:bg-black text-green-600 shadow-sm' : 'text-neutral-400 hover:text-green-600 hover:bg-white dark:hover:bg-neutral-800'}`}
                >
                    <ArrowBigUp size={24} className={myReaction === 'like' ? 'fill-current' : ''} />
                </button>
                <span className={`font-black text-sm tabular-nums ${score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-neutral-400'}`}>
                    {score}
                </span>
                <button
                    onClick={() => handleReaction(voice.id, 'dislike')}
                    className={`p-1.5 rounded-xl transition-all ${myReaction === 'dislike' ? 'bg-white dark:bg-black text-red-600 shadow-sm' : 'text-neutral-400 hover:text-red-600 hover:bg-white dark:hover:bg-neutral-800'}`}
                >
                    <ArrowBigDown size={24} className={`rotate-180 ${myReaction === 'dislike' ? 'fill-current' : ''}`} />
                </button>
            </div>

            {/* Content Column */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 mb-1">
                        {voice.is_anonymous ? (
                            <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center shrink-0">
                                <Ghost size={14} className="text-white dark:text-black" />
                            </div>
                        ) : (
                            <Link href={`/profile/${voice.user_id}`} className="block shrink-0">
                                <div 
                                    ref={el => { postOwnerAvatarRefs.current[voice.id] = el; }} // Capture ref for post owner
                                    className="w-8 h-8 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-white"
                                    style={!voice.user?.avatar_url ? { 
                                        backgroundColor: 'var(--primary-color)'
                                    } : undefined}
                                >
                                    {voice.user?.avatar_url ? (
                                        <img src={voice.user.avatar_url} alt={voice.user.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                                            {voice.user?.full_name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        )}
                        
                        <div className="flex flex-col leading-tight">
                            <div className="flex items-center gap-2 flex-wrap">
                                {voice.is_anonymous ? (
                                    <span className="font-bold font-serif text-sm">Anonim</span>
                                ) : (
                                    <Link href={`/profile/${voice.user_id}`} className="font-bold font-serif text-sm hover:underline dark:text-white">
                                        {voice.user?.full_name || 'Kullanıcı'}
                                    </Link>
                                )}
                                {voice.is_editors_choice && (
                                    <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold flex items-center gap-1 border border-yellow-200 dark:border-yellow-800">
                                        <Award size={10} />
                                        Editörün Seçimi
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-serif">
                                {formatRelativeTime(voice.created_at)}
                                {!voice.is_anonymous && voice.user?.department && ` • ${voice.user.department}`}
                            </span>
                        </div>
                    </div>

                    {user && user.id === voice.user_id && (
                        <div className="relative">
                            <button
                                onClick={() => setActiveMenu(activeMenu === voice.id ? null : voice.id)}
                                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-400"
                            >
                                <MoreVertical size={16} />
                            </button>
                            {activeMenu === voice.id && (
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-lg overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                                    <button
                                        onClick={() => {
                                            startEdit(voice);
                                            setActiveMenu(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                                    >
                                        <Edit2 size={14} /> Düzenle
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Bu paylaşımı silmek istediğinize emin misiniz?')) {
                                                handleDelete(voice.id);
                                            }
                                            setActiveMenu(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                    >
                                        <Trash2 size={14} /> Sil
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Content Body */}
                <div className="pl-0 sm:pl-10">
                    {editingId === voice.id ? (
                        <form onSubmit={handleUpdate}>
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded text-sm bg-white dark:bg-neutral-800 dark:text-white mb-2 font-serif focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none"
                                rows={3}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingId(null)}
                                    className="px-3 py-1 text-xs font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                                >
                                    İPTAL
                                </button>
                                <button
                                    type="submit"
                                    disabled={!editContent.trim()}
                                    className="px-3 py-1 text-xs font-bold bg-black dark:bg-white text-white dark:text-black rounded disabled:opacity-50"
                                >
                                    KAYDET
                                </button>
                            </div>
                        </form>
                    ) : (
                        renderContentWithTags(voice.content)
                    )}

                    {/* Footer Actions */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/50">
                        <button 
                            onClick={() => {
                                if (!user) return toast.error('Yorum yapmak için giriş yapmalısınız.');
                                setActiveCommentBox(activeCommentBox === voice.id ? null : voice.id);
                            }}
                            className={`flex items-center gap-1 text-xs font-bold uppercase transition-colors ${activeCommentBox === voice.id ? 'text-black dark:text-white' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}
                        >
                            <MessageSquare size={14} />
                            Yorum Yap {voice.comments?.length > 0 && `(${voice.comments.length})`}
                        </button>

                        <button 
                            onClick={() => toggleVoiceComments(voice.id)}
                            className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-black dark:hover:text-white uppercase transition-colors"
                        >
                            {expandedVoices[voice.id] ? 'Yorumları Gizle' : 'Yorumları Gör'}
                        </button>
                        
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/voice/${voice.id}`);
                                toast.success('Link kopyalandı!');
                            }}
                            className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-black dark:hover:text-white uppercase transition-colors ml-auto"
                        >
                            <Share2 size={14} />
                            Paylaş
                        </button>
                    </div>

                    {/* New Comment Input */}
                    {activeCommentBox === voice.id && (
                        <form 
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleCommentSubmit(e, voice.id, null, newComment);
                                setNewComment(''); // Clear local/global newComment (Wait, this clears global?)
                            }} 
                            className="mt-4 flex gap-2 animate-in fade-in slide-in-from-top-1"
                        >
                            <input
                                type="text"
                                autoFocus
                                value={newComment} // WARNING: This is using global newComment? voiceView passed 'newComment'.
                                // If multiple items are active, they share this state!
                                // VoiceView.tsx: 'activeCommentBox' determines which ONE is active.
                                // So sharing 'newComment' state is "okay" as long as only one box open.
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Düşünceni ekle..."
                                className="flex-1 px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border-b-2 border-neutral-200 dark:border-neutral-700 focus:border-black dark:focus:border-white focus:outline-none text-sm font-serif dark:text-white transition-colors"
                            />
                            <button 
                                type="submit"
                                disabled={isCommenting || !newComment.trim()}
                                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                            >
                                {isCommenting ? '...' : 'Gönder'}
                            </button>
                        </form>
                    )}

                    {/* Comments Thread */}
                    {(activeCommentBox === voice.id || (voice.comments.length > 0 && expandedVoices[voice.id])) && (
                        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-900 w-full animate-in slide-in-from-top-2">
                            {!user && activeCommentBox === voice.id ? (
                                <div className="bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700 rounded p-4 text-center">
                                    <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-2">Yorumları görmek için giriş yapmalısınız.</p>
                                    <Link href="/login" className="text-sm font-bold hover:underline uppercase" style={{ color: 'var(--primary-color)' }}>Giriş Yap</Link>
                                </div>
                            ) : (
                                <>
                                    {expandedVoices[voice.id] && (
                                        <div className="space-y-0 mb-4 pl-0">
                                            <CommentThread 
                                                voice={voice}
                                                user={user}
                                                replyingTo={replyingTo}
                                                setReplyingTo={setReplyingTo}
                                                replyContent={replyContent}
                                                setReplyContent={setReplyContent}
                                                isCommenting={isCommenting}
                                                handleCommentReaction={handleCommentReaction}
                                                handleCommentSubmit={handleCommentSubmit}
                                                formatRelativeTime={formatRelativeTime}
                                                visibleCommentsCount={visibleCommentsCount[voice.id]}
                                                loadMoreComments={loadMoreComments}
                                                postOwnerAvatarRef={postOwnerAvatarRefs.current[voice.id]}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
};
