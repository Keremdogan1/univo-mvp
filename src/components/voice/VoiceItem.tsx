'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowBigUp, ArrowBigDown, Edit2, Trash2, MoreVertical, Share2, Filter, User, Calendar, Award, Ghost, Tag, MessageSquare, ChevronDown, ChevronUp, Camera, X } from 'lucide-react';
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
    handleCommentDelete: (commentId: string) => void;
    handleCommentUpdate: (commentId: string, newContent: string) => void;
    
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
    setLightboxImage?: (url: string | null) => void;
    // Image Edit Props
    imagePreview: string | null;
    setImagePreview: (val: string | null) => void;
    imageFile: File | null;
    setImageFile: (val: File | null) => void;
    handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    // Assume user will pass mediaType or we detect it?
    // Since we only get voice object, we should detect from URL.
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
    handleCommentDelete,
    handleCommentUpdate,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    isCommenting,
    newComment,
    setNewComment,
    formatRelativeTime,
    renderContentWithTags,
    setLightboxImage,
    imagePreview,
    setImagePreview,
    imageFile,
    setImageFile,
    handleImageSelect
}: VoiceItemProps) {
    const reactions = voice.reactions || [];
    const myReaction = user ? reactions.find(r => r.user_id === user.id)?.reaction_type : null;
    const likeCount = reactions.filter(r => r.reaction_type === 'like').length;
    const dislikeCount = reactions.filter(r => r.reaction_type === 'dislike').length;
    const score = likeCount - dislikeCount;

    return (
        <article 
            className={`bg-white dark:bg-[#0a0a0a] border-b border-neutral-200 dark:border-neutral-800 pb-6 last:border-0 px-2 relative transition-colors ${voice.is_editors_choice ? 'bg-yellow-50/50 dark:bg-yellow-900/10 -mx-2 px-4 py-4 rounded-lg border-none ring-1 ring-yellow-200 dark:ring-yellow-700/50' : ''}`}
            ref={el => { containerRefs.current[voice.id] = el as HTMLDivElement | null; }}
        >
            {voice.is_editors_choice && (
                <div className="absolute -top-3 right-4 bg-yellow-400 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase tracking-wider">
                    <Award size={12} className="text-yellow-900 dark:text-yellow-100" />
                    Editörün Seçimi
                </div>
            )}

            <div className="flex gap-4 items-stretch">
                {/* Avatar Column */}
                <div className="flex flex-col items-center shrink-0 relative">
                    <div 
                        ref={el => { postOwnerAvatarRefs.current[voice.id] = el; }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-serif shrink-0 border border-neutral-200 dark:border-neutral-800 relative z-20 ${voice.is_anonymous ? 'bg-neutral-800 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-300' : 'text-white bg-white dark:bg-[#0a0a0a]'}`}
                        style={(!voice.is_anonymous && !voice.user?.avatar_url) ? { backgroundColor: 'var(--primary-color)' } : undefined}
                    >
                        {voice.is_anonymous ? (
                            <Ghost size={20} />
                        ) : (voice.user?.avatar_url) ? (
                            <img src={voice.user.avatar_url} alt={voice.user.full_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            voice.user?.full_name?.charAt(0) || '?'
                        )}
                    </div>
                    {/* Post Owner Connector - h-56 bridges to first comment */}
                    {voice.comments?.length > 0 && expandedVoices[voice.id] && (
                        <div className="w-[2px] h-56 bg-neutral-200 dark:bg-neutral-800 z-0" />
                    )}
                </div>

                {/* Content Column */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {voice.is_anonymous ? (
                            <span className="font-bold text-neutral-600 dark:text-neutral-400 italic flex items-center gap-1">
                                {voice.user?.nickname || 'Anonim'}
                            </span>
                        ) : (
                            <Link href={`/profile/${voice.user_id}`} className="font-bold text-neutral-900 dark:text-white hover:underline">
                                {voice.user?.full_name || 'Kullanıcı'}
                            </Link>
                        )}
                        {(voice.user?.department || voice.user?.class_year) && (
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest border-l border-neutral-300 dark:border-neutral-700 pl-2 ml-1 truncate max-w-[120px] sm:max-w-none">
                                {[voice.user.department, voice.user.class_year].filter(Boolean).join(' • ')}
                            </span>
                        )}
                        <div className="ml-auto relative">
                             <button
                                onClick={() => setActiveMenu(activeMenu === voice.id ? null : voice.id)}
                                className="p-1 text-neutral-400 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                                <MoreVertical size={16} />
                            </button>
                            {activeMenu === voice.id && (
                                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-lg overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                                    {user?.id === voice.user_id ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    startEdit(voice);
                                                    setActiveMenu(null);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2 transition-colors"
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
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 transition-colors"
                                            >
                                                <Trash2 size={14} /> Sil
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link 
                                                href={`/profile/${voice.user_id}`}
                                                className="w-full text-left px-4 py-2 text-sm font-medium !text-neutral-700 dark:!text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2 transition-colors"
                                            >
                                                <User size={14} className="text-neutral-500 dark:text-neutral-400" /> Profili Gör
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="mb-4">
                        {editingId === voice.id ? (
                            <form onSubmit={handleUpdate}>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 dark:text-white font-serif rounded-sm focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                                    rows={3}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(null)}
                                        className="text-xs font-bold uppercase text-neutral-500 hover:text-black dark:hover:text-white"
                                    >
                                        İPTAL
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!editContent.trim()}
                                        className="text-xs font-bold uppercase bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-sm"
                                    >
                                        KAYDET
                                    </button>
                                </div>
                                <div className="mt-3">
                                    {imagePreview ? (
                                        <div className="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 h-48 sm:h-64">
                                            {/* Simple detection for preview */}
                                            {imagePreview.startsWith('data:video') ? (
                                                <video src={imagePreview} controls className="w-full h-full object-contain" />
                                            ) : (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                                            )}
                                               
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setImagePreview(null);
                                                        setImageFile(null);
                                                    }}
                                                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById(`edit-image-upload-${voice.id}`)?.click()}
                                                className="w-full py-4 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg flex flex-col items-center justify-center gap-2 text-neutral-500 hover:text-black dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-600 transition-all"
                                            >
                                                <Camera size={24} />
                                                <span className="text-xs font-bold uppercase">Medya Ekle / Değiştir</span>
                                            </button>
                                        )}
                                        <input
                                            id={`edit-image-upload-${voice.id}`}
                                            type="file"
                                            accept="image/*,video/*"
                                            className="hidden"
                                            onChange={handleImageSelect}
                                        />
                                    </div>
                                </form>
                            ) : (
                                <div className="mb-4 group/content relative">
                                    <p className="text-neutral-900 dark:text-neutral-200 leading-relaxed text-lg font-serif mb-3">
                                        {renderContentWithTags(voice.content)}
                                    </p>
                                    {voice.image_url && (
                                        <div className="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 mb-3">
                                            {voice.image_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                                <video 
                                                    src={voice.image_url} 
                                                    controls 
                                                    className="w-full h-auto max-h-[500px] object-contain bg-black"
                                                />
                                            ) : (
                                                <img 
                                                    src={voice.image_url} 
                                                    alt="Post media" 
                                                    className="w-full h-auto max-h-[500px] object-contain cursor-pointer transition-transform hover:scale-[1.01]" 
                                                    onClick={() => voice.image_url && setLightboxImage?.(voice.image_url)}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                    </div>

                    {/* Footer Actions (Votes + Comments + Share) */}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-900 flex-wrap gap-y-2 relative">
                        <div className="flex items-center gap-6">
                            {/* Votes */}
                            <div className="flex items-center gap-1 bg-neutral-50 dark:bg-neutral-900 rounded-full px-1.5 py-1 border border-neutral-100 dark:border-neutral-800">
                                <button
                                    onClick={() => handleReaction(voice.id, 'like')}
                                    className={`p-1.5 rounded-full transition-all flex items-center justify-center w-8 h-8 hover:bg-white dark:hover:bg-black hover:shadow-sm ${myReaction === 'like' ? 'text-green-600' : 'text-neutral-400 dark:text-neutral-500 hover:text-green-600'}`}
                                >
                                    <ArrowBigUp size={20} className={myReaction === 'like' ? 'fill-current' : ''} />
                                </button>
                                <span className={`text-sm font-bold min-w-[1.5rem] text-center ${score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                    {score}
                                </span>
                                <button
                                    onClick={() => handleReaction(voice.id, 'dislike')}
                                    className={`p-1.5 rounded-full transition-all flex items-center justify-center w-8 h-8 hover:bg-white dark:hover:bg-black hover:shadow-sm ${myReaction === 'dislike' ? 'text-red-600' : 'text-neutral-400 dark:text-neutral-500 hover:text-red-600'}`}
                                >
                                    <ArrowBigDown size={20} className={myReaction === 'dislike' ? 'fill-current' : ''} />
                                </button>
                            </div>

                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveCommentBox(activeCommentBox === voice.id ? null : voice.id); }}
                                className={`flex items-center gap-2 group transition-colors uppercase text-xs font-bold px-3 py-1.5 rounded-full ${activeCommentBox === voice.id ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white'}`}
                            >
                                YANITLA
                            </button>
                            
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/voice/${voice.id}`);
                                    toast.success('Link kopyalandı!');
                                }}
                                className="flex items-center gap-2 group text-neutral-400 dark:text-neutral-500 hover:text-green-500 transition-colors"
                            >
                                <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20">
                                    <Share2 size={18} />
                                </div>
                            </button>
                        </div>

                         <span className="text-xs text-neutral-400 dark:text-neutral-500 font-serif ml-auto">
                            {formatRelativeTime(voice.created_at)}
                        </span>
                    </div>

                    {/* Show Comments Toggle */}
                    {voice.comments?.length > 0 && (
                        <div className="mt-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); toggleVoiceComments(voice.id); }}
                                className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-colors w-full sm:w-auto justify-start uppercase ${expandedVoices[voice.id] ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white'}`}
                            >
                                {expandedVoices[voice.id] ? (
                                    <>
                                        <div className="flex items-center justify-center w-4 h-4 mr-1">
                                            <ChevronUp size={14} />
                                        </div>
                                        YORUMLARI GİZLE
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-center w-4 h-4 mr-1">
                                            <ChevronDown size={14} />
                                        </div>
                                        {voice.comments.length} YORUMU GÖSTER
                                    </>
                                )}
                            </button>
                        </div>
                    )}


                    {/* New Comment Input */}
                    {activeCommentBox === voice.id && (
                        <div className="pl-0 pb-4 animate-in fade-in slide-in-from-top-1">
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleCommentSubmit(e, voice.id, null, newComment);
                                    setNewComment('');
                                    setActiveCommentBox(null);
                                }} 
                                className="flex gap-2 bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800"
                            >
                                <input
                                    type="text"
                                    autoFocus
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Yorumunu yaz..."
                                    className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm focus:outline-none focus:border-black dark:focus:border-white font-serif dark:text-white transition-colors rounded-md"
                                />
                                <button 
                                    type="submit"
                                    disabled={isCommenting || !newComment.trim()}
                                    className="p-2 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 transition-colors rounded-md"
                                >
                                    {isCommenting ? '...' : <div className="flex items-center"><span className="text-xs font-bold mr-1">GÖNDER</span></div>}
                                </button>
                            </form>
                        </div>
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
                                                handleCommentDelete={handleCommentDelete}
                                                handleCommentUpdate={handleCommentUpdate}
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
