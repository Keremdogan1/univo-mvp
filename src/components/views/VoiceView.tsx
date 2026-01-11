'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import NotificationCenter from '../NotificationCenter';
import { MessageSquare, Send, Tag, Award, Ghost, TrendingUp, ArrowRight, ArrowBigUp, ArrowBigDown, MoreVertical, Edit2, Trash2, X, Share2, UserPlus, Users, BadgeCheck, Globe, Lock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import CommentThread from '@/components/voice/CommentSystem';
import FriendButton from '../FriendButton';
import VoiceStatsWidget from './VoiceStatsWidget';
import { motion, AnimatePresence } from 'framer-motion';
// Shared Component Import
import SkeletonLoader from '../ui/SkeletonLoader';

const VoiceViewSkeleton = () => {
  return (
    <div className="container mx-auto px-4 pt-8 pb-32 relative animate-in fade-in duration-500 min-h-[100dvh] overflow-x-hidden">
      <div className="border-b-4 border-neutral-200 dark:border-neutral-800 pb-4 mb-8 text-center md:static pt-4 -mt-4 -mx-4 px-4 relative min-h-[240px] bg-neutral-50 dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center justify-center gap-4">
          <SkeletonLoader width={300} height={60} className="mb-2" />
          <div className="flex items-center gap-3 mb-2">
             <SkeletonLoader width={56} height={56} className="rounded-full" />
          </div>
        </div>
        <div className="flex justify-between items-center border-t-2 border-neutral-200 dark:border-neutral-800 pt-2 mt-4 max-w-2xl mx-auto h-8">
           <SkeletonLoader width={80} height={20} />
           <SkeletonLoader width={120} height={20} />
           <SkeletonLoader width={80} height={20} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8 order-last lg:order-first">
             <div className="flex justify-between items-end border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-6">
                <SkeletonLoader width={200} height={32} />
                <SkeletonLoader width={100} height={28} className="rounded-full" />
             </div>
             <div className="bg-neutral-50 dark:bg-[#0a0a0a]/50 p-6 border border-neutral-200 dark:border-neutral-800 mb-8 rounded-sm">
                <SkeletonLoader width={150} height={24} className="mb-4" />
                <SkeletonLoader width="100%" height={100} className="mb-4 rounded-lg" />
                <div className="flex justify-between items-center pt-2">
                   <SkeletonLoader width={100} height={20} />
                   <SkeletonLoader width={80} height={36} className="rounded-md" />
                </div>
             </div>
             <div className="space-y-6">
                 {[1, 2, 3].map((i) => (
                     <div key={i} className="pb-6 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                         <div className="flex gap-4 items-start">
                             <SkeletonLoader width={40} height={40} className="rounded-full shrink-0" />
                             <div className="flex-1 space-y-3">
                                 <div className="flex items-center gap-2 mb-2">
                                     <SkeletonLoader width={120} height={20} />
                                     <SkeletonLoader width={80} height={16} />
                                 </div>
                                 <SkeletonLoader width="90%" height={18} />
                                 <SkeletonLoader width="100%" height={18} />
                                 <SkeletonLoader width="80%" height={18} />
                                 <div className="flex gap-6 mt-4 pt-2">
                                     <SkeletonLoader width={40} height={16} />
                                     <SkeletonLoader width={40} height={16} />
                                     <SkeletonLoader width={20} height={16} className="ml-auto" />
                                 </div>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
          </div>
          <div className="lg:col-span-1 space-y-8">
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
                  <SkeletonLoader width={150} height={24} className="mb-6 mx-auto" />
                  <div className="grid grid-cols-2 gap-4">
                      <SkeletonLoader height={80} className="rounded-xl" />
                      <SkeletonLoader height={80} className="rounded-xl" />
                  </div>
              </div>
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
                   <SkeletonLoader width={180} height={24} className="mb-4" />
                   <SkeletonLoader width="100%" height={24} className="mb-6" />
                   <div className="space-y-3">
                       <SkeletonLoader height={40} className="rounded-lg" />
                       <SkeletonLoader height={40} className="rounded-lg" />
                       <SkeletonLoader height={40} className="rounded-lg" />
                   </div>
              </div>
          </div>
      </div>
    </div>
  );
};

// --- VoiceItem INLINED ---
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
    
    // Reply State 
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

function VoiceItem({
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
    renderContentWithTags
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
                            </form>
                        ) : (
                            <div className="mb-4 group/content relative">
                                <p className="text-neutral-900 dark:text-neutral-200 leading-relaxed text-lg font-serif">
                                    {renderContentWithTags(voice.content)}
                                </p>
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

                         <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium ml-auto">
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

// Interfaces
interface Voice {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    is_anonymous: boolean;
    is_editors_choice: boolean;
    is_verified?: boolean;
    tags: string[] | null;
    user: {
        full_name: string;
        nickname?: string;
        department: string;
        avatar_url?: string;
        class_year?: string;
    };
    counts: {
        likes: number;
        dislikes: number;
        comments: number;
    };
    reactions: Array<{ user_id: string; reaction_type: string }>;
    comments: Array<{
        id: string;
        content: string;
        created_at: string;
        user: string;
        user_id: string;
        user_avatar?: string;
        user_theme?: string;
        parent_id: string | null;
        reactions?: { count: number };
        user_reaction?: string | null;
    }>;
}

const INITIAL_TAGS = ['#kampüs', '#yemekhane', '#kütüphane', '#ulaşım', '#sınav', '#etkinlik', '#spor'];

export default function VoiceView() {
    const { user, setViewLoading, loading: showSkeleton } = useAuth();
    const router = useRouter();
    const [voices, setVoices] = useState<Voice[]>([]);
    const [isGlobalMode, setIsGlobalMode] = useState(false);

    const [newStatus, setNewStatus] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);

    const [expandedVoices, setExpandedVoices] = useState<Record<string, boolean>>({});
    const [visibleCommentsCount, setVisibleCommentsCount] = useState<Record<string, number>>({}); // Pagination state
    const postOwnerAvatarRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const toggleVoiceComments = (voiceId: string) => {
        setExpandedVoices(prev => ({ ...prev, [voiceId]: !prev[voiceId] }));
        if (!visibleCommentsCount[voiceId]) {
            setVisibleCommentsCount(prev => ({ ...prev, [voiceId]: 10 })); // Default show 10
        }
    };

    const loadMoreComments = (voiceId: string) => {
        setVisibleCommentsCount(prev => ({ ...prev, [voiceId]: (prev[voiceId] || 10) + 10 }));
    };

    const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null); // New state for reply
    const [replyContent, setReplyContent] = useState(''); // New state for reply content
    const [isPosting, setIsPosting] = useState(false);
    const [isCommenting, setIsCommenting] = useState(false);

    // Edit & Delete State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Hashtag Autocomplete System
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionList, setSuggestionList] = useState<string[]>([]);
    const [cursorPos, setCursorPos] = useState<number>(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Filter state
    const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
    const [allTags, setAllTags] = useState<{ tag: string, count: number }[]>([]);

    // Poll Voters State
    const [showVotersModal, setShowVotersModal] = useState(false);
    const [voters, setVoters] = useState<{ user_id: string, display_name: string, option_index: number, avatar_url?: string }[]>([]);
    const [isLoadingVoters, setIsLoadingVoters] = useState(false);
    const [selectedVoterOption, setSelectedVoterOption] = useState(0);

    useEffect(() => {
        fetchVoices();
    }, [activeTagFilter]);

    const fetchVoices = async () => {
        // Only set view loading if we don't have voices yet (initial load)
        if (voices.length === 0) setViewLoading(true);
        try {
            let url = '/api/voices';
            if (activeTagFilter) {
                url += `?tag=${encodeURIComponent(activeTagFilter)}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            if (data.voices) {
                setVoices(data.voices);

                if (!activeTagFilter) {
                    const tagCounts = new Map<string, number>();
                    INITIAL_TAGS.forEach(t => tagCounts.set(t, 0));

                    data.voices.forEach((v: Voice) => {
                        if (v.tags) {
                            v.tags.forEach(t => {
                                const lower = t.toLowerCase();
                                tagCounts.set(lower, (tagCounts.get(lower) || 0) + 1);
                            });
                        }
                    });

                    const sortedTags = Array.from(tagCounts.entries())
                        .map(([tag, count]) => ({ tag, count }))
                        .sort((a, b) => b.count - a.count);

                    setAllTags(sortedTags);
                }
            }
        } catch (e) {
            console.error('Failed to fetch voices', e);
        } finally {
            setViewLoading(false);
        }
    };



    const renderContentWithTags = (content: string) => {
        const parts = content.split(/(#[\w\u011f\u011e\u0131\u0130\u00f6\u00d6\u015f\u015e\u00fc\u00dc\u00e7\u00c7]+)/g);
        return parts.map((part, index) => {
            if (part.match(/^#[\w\u011f\u011e\u0131\u0130\u00f6\u00d6\u015f\u015e\u00fc\u00dc\u00e7\u00c7]+$/)) {
                return (
                    <button
                        key={index}
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveTagFilter(part);
                        }}
                        className="font-bold hover:underline cursor-pointer bg-transparent border-0 p-0 inline align-baseline hover:opacity-80 transition-colors"
                        style={{ color: 'var(--primary-color, #C8102E)' }}
                    >
                        {part}
                    </button>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStatus.trim() || isPosting) return;
        if (!user) return toast.error('Giriş yapmalısınız.');

        setIsPosting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return toast.error('Oturum hatası');

            const extractedTags = newStatus.match(/#[\w\u011f\u011e\u0131\u0130\u00f6\u00d6\u015f\u015e\u00fc\u00dc\u00e7\u00c7]+/g) || [];

            const res = await fetch('/api/voices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    content: newStatus,
                    is_anonymous: isAnonymous,
                    tags: extractedTags
                })
            });

            if (res.ok) {
                setNewStatus('');
                setIsAnonymous(false);
                fetchVoices();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Bir hata oluştu');
            }
        } catch (e) {
            console.error(e);
            toast.error('Paylaşım yapılamadı.');
        } finally {
            setIsPosting(false);
        }
    };

    const handleReaction = async (voiceId: string, targetType: 'like' | 'dislike') => {
        if (!user) return toast.error('Giriş yapmalısınız.');

        const voice = voices.find(v => v.id === voiceId);
        if (!voice) return;

        const currentReactionObj = voice.reactions.find(r => r.user_id === user.id);
        const currentType = currentReactionObj?.reaction_type || 'neutral';
        const newType = currentType === targetType ? 'neutral' : targetType;

        const oldVoices = [...voices];
        setVoices(voices.map(v => {
            if (v.id === voiceId) {
                const otherReactions = v.reactions.filter(r => r.user_id !== user.id);
                return {
                    ...v,
                    reactions: newType === 'neutral'
                        ? otherReactions
                        : [...otherReactions, { user_id: user.id, reaction_type: newType, id: 'temp', created_at: new Date().toISOString() }]
                };
            }
            return v;
        }));

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            await fetch(`/api/voices/${voiceId}/react`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ type: newType })
            });
        } catch (e) {
            setVoices(oldVoices);
            console.error(e);
            toast.error('İşlem başarısız');
        }
    };

    const handleCommentReaction = async (e: React.MouseEvent, voiceId: string, commentId: string, type: 'like' | 'dislike') => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) return toast.error('Giriş yapmalısınız.');

        // Optimistic Update
        setVoices(prev => prev.map(v => {
            if (v.id !== voiceId) return v;
            return {
                ...v,
                comments: v.comments.map(c => {
                    if (c.id !== commentId) return c;
                    
                    const currentReaction = (c.user_reaction) || (user ? (c.reactions as any)?.data?.find((r: any) => r.user_id === user.id)?.reaction_type : null);
                    // Calculate current scores if not tracked in state directly (we map them in render, but for update we need to adjust 'reactions.count')
                    // Actually, 'c.reactions' from API is { count: number, data: [] }.
                    // We need to update this count.
                    
                    let newCount = c.reactions?.count || 0;
                    
                    if (currentReaction === type) {
                        // Toggle off
                        newCount -= (type === 'like' ? 1 : -1);
                        // Start: Update reaction data array for future renders
                        const newData = (c.reactions as any)?.data?.filter((r: any) => r.user_id !== user.id) || [];
                        return { ...c, user_reaction: null, reactions: { count: newCount, data: newData } };
                    } else {
                        // Toggle on or switch
                        if (currentReaction) {
                           newCount -= (currentReaction === 'like' ? 1 : -1);
                        }
                        newCount += (type === 'like' ? 1 : -1);
                        
                        // Start: Update reaction data array
                        const newData = [...((c.reactions as any)?.data?.filter((r: any) => r.user_id !== user.id) || []), { user_id: user.id, reaction_type: type }];
                        
                        return { ...c, user_reaction: type, reactions: { count: newCount, data: newData } };
                    }
                })
            };
        }));

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // We can reuse the voice reaction endpoint logic structure or create a new one.
            // Since we didn't create a specific API route for comment reactions (e.g. /api/voices/comments/react),
            // we should probably do it via Supabase directly here for speed, OR create a route.
            // Direct Supabase call is faster for now as we have the client.
            
            const { data: existingReaction } = await supabase
                .from('voice_comment_reactions')
                .select('id, reaction_type')
                .eq('comment_id', commentId)
                .eq('user_id', user.id)
                .single();

            if (existingReaction) {
                if (existingReaction.reaction_type === type) {
                    await supabase.from('voice_comment_reactions').delete().eq('id', existingReaction.id);
                } else {
                    await supabase.from('voice_comment_reactions').update({ reaction_type: type }).eq('id', existingReaction.id);
                }
            } else {
                await supabase.from('voice_comment_reactions').insert({
                    comment_id: commentId,
                    user_id: user.id,
                    reaction_type: type
                });
            }

        } catch (e) {
            console.error(e);
            toast.error('Reaksiyon hatası');
            // Revert on error? For now skip complex revert logic locally, just refetch
            fetchVoices();
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent, voiceId: string, parentId: string | null = null, customContent: string | null = null) => {
        e.preventDefault();
        const contentToSubmit = customContent || newComment;
        
        if (!contentToSubmit.trim() || isCommenting) return;
        if (!user) return;

        setIsCommenting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // We need to pass parent_id to the API.
            // The existing API /api/voices/[id]/comment might need update to accept parent_id.
            // Let's check that API route or just use Supabase direct insert here? 
            // Previous code used `/api/voices/${voiceId}/comment`.
            // I should update that route to accept parent_id.
            
            const res = await fetch(`/api/voices/${voiceId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ content: contentToSubmit, parent_id: parentId })
            });

            if (res.ok) {
                if (!parentId) setNewComment('');
                // If it was a reply, the local state reset `setReplyContent` is handled in the UI component on submit
                // fetchVoices to refresh
                await fetchVoices();
            } else {
                toast.error('Yorum gönderilemedi');
            }
        } catch (e) {
            console.error(e);
            toast.error('Hata oluştu');
        } finally {
            setIsCommenting(false);
        }
    };

    const handleCommentDelete = async (commentId: string) => {
        if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
        
        // Optimistic UI update
        setVoices(prev => prev.map(v => ({
            ...v,
            comments: v.comments.filter(c => c.id !== commentId && c.parent_id !== commentId) // Remove comment and its children
        })));

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            
             await supabase.from('voice_comments').delete().eq('id', commentId);
             
             toast.success('Yorum silindi');
             fetchVoices();
        } catch (e) {
            console.error(e);
            toast.error('Silme başarısız');
            fetchVoices();
        }
    };

    const handleCommentUpdate = async (commentId: string, newContent: string) => {
        if (!newContent.trim()) return;
        
        // Optimistic
        setVoices(prev => prev.map(v => ({
            ...v,
            comments: v.comments.map(c => c.id === commentId ? { ...c, content: newContent } : c)
        })));

        try {
             const { data: { session } } = await supabase.auth.getSession();
             if (!session) return;
             
             await supabase.from('voice_comments').update({ content: newContent }).eq('id', commentId);
             
             toast.success('Yorum güncellendi');
             fetchVoices();
        } catch (e) {
            console.error(e);
            toast.error('Güncelleme başarısız');
            fetchVoices();
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setNewStatus(val);
        const pos = e.target.selectionStart;
        setCursorPos(pos);

        const textBeforeCursor = val.slice(0, pos);
        const matches = textBeforeCursor.match(/#([\w\u011f\u011e\u0131\u0130\u00f6\u00d6\u015f\u015e\u00fc\u00dc\u00e7\u00c7]*)$/);

        if (matches) {
            const query = matches[1].toLowerCase();
            let filtered: string[] = [];
            if (query === '') {
                filtered = allTags.map(item => item.tag);
            } else {
                filtered = allTags
                    .filter(item => item.tag.toLowerCase().includes(query) || item.tag.toLowerCase().includes('#' + query))
                    .map(item => item.tag);
            }

            if (filtered.length > 0) {
                setSuggestionList(filtered);
                setShowSuggestions(true);
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
    };

    const insertTag = (tag: string) => {
        const textBeforeCursor = newStatus.slice(0, cursorPos);
        const textAfterCursor = newStatus.slice(cursorPos);
        const matches = textBeforeCursor.match(/#([\w\u011f\u011e\u0131\u0130\u00f6\u00d6\u015f\u015e\u00fc\u00dc\u00e7\u00c7]*)$/);
        if (matches) {
            const prefix = textBeforeCursor.slice(0, matches.index);
            const newValue = prefix + tag + ' ' + textAfterCursor;
            setNewStatus(newValue);
            setShowSuggestions(false);
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }
    };

    const handleDelete = async (voiceId: string) => {
        if (!confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) return;
        setVoices(prev => prev.filter(v => v.id !== voiceId));
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch(`/api/voices/${voiceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            if (!res.ok) throw new Error('Delete failed');
            toast.success('Gönderi silindi.');
            fetchVoices();
        } catch (e) {
            console.error(e);
            toast.error('Silme işlemi başarısız.');
            fetchVoices();
        }
    };

    const startEdit = (voice: Voice) => {
        setEditingId(voice.id);
        setEditContent(voice.content);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId || !editContent.trim()) return;
        const vId = editingId;
        
        // Extract hashtags
        const extractedTags = Array.from(new Set(editContent.match(/#[a-zA-Z\u011f\u011e\u0131\u0130\u00f6\u00d6\u015f\u015e\u00fc\u00dc\u00e7\u00c70-9]+/g) || [])).map(t => t.toLowerCase());

        setVoices(prev => prev.map(v => v.id === vId ? { ...v, content: editContent, tags: extractedTags } : v));
        setEditingId(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch(`/api/voices/${vId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ 
                    content: editContent,
                    tags: extractedTags
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Update failed');
            }
            
            const data = await res.json();
            if (data.voice) {
                // Confirm server state matches local optimistic state
                if (JSON.stringify(data.voice.tags) !== JSON.stringify(extractedTags)) {
                   console.warn('Server tags mismatch:', data.voice.tags, extractedTags);
                }
                // Force update with server data
                setVoices(prev => prev.map(v => v.id === vId ? { ...v, ...data.voice } : v));
            }
            
            toast.success('Gönderi güncellendi.');
            // Refresh to update Kampüste Gündem and other lists
            await fetchVoices();
        } catch (e: any) {
            console.error(e);
            toast.error(`Güncelleme başarısız: ${e.message}`);
            fetchVoices();
        }
    };

    // Date & Issue Logic
    const today = new Date();
    const start = new Date(2025, 11, 29);
    const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = current.getTime() - start.getTime();
    const issueNumber = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const formattedDate = today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

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

    // Poll & Stats Logic
    const [activePoll, setActivePoll] = useState<{ question: string, options: string[] } | null>(null);
    const [pollLoading, setPollLoading] = useState(true);
    const [activeUsers, setActiveUsers] = useState(1);

    useEffect(() => {
        const channel = supabase.channel('room1');
        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const uniqueUsers = new Set();
                Object.values(state).forEach((presences: any) => {
                    presences.forEach((p: any) => {
                        if (p.user_id) uniqueUsers.add(`user:${p.user_id}`);
                        else if (p.device_id) uniqueUsers.add(`device:${p.device_id}`);
                    });
                });
                setActiveUsers(Math.max(1, uniqueUsers.size));
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    let deviceId = localStorage.getItem('univo_device_id');
                    if (!deviceId) {
                        deviceId = `device-${Math.random().toString(36).substring(7)}`;
                        localStorage.setItem('univo_device_id', deviceId);
                    }
                    await channel.track({
                        online_at: new Date().toISOString(),
                        user_id: user?.id || null,
                        device_id: deviceId
                    });
                }
            });
        return () => { channel.unsubscribe(); };
    }, [user]);

    const [userVote, setUserVote] = useState<number | null>(null);
    const [pollResults, setPollResults] = useState<number[]>([45, 32, 23]);

    const handlePollVote = async (index: number) => {
        if (!user) {
            toast.error('Oy kullanmak için giriş yapmalısınız.');
            router.push('/login');
            return;
        }
        if (!activePoll) return;

        // Prevent spam clicking while processing
        if (pollLoading) return;

        const pollId = activePoll.question.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '_');

        // Snapshot for rollback
        const previousResults = [...pollResults];
        const previousVote = userVote;

        try {
            // Optimistic Update
            const newResults = [...pollResults];
            let action: 'vote' | 'retract' = 'vote';

            // Check if we are clicking the SAME option we already voted for (Retraction)
            if (userVote === index) {
                // Retract: Decrement count if > 0
                if (newResults[index] > 0) newResults[index]--;
                setUserVote(null);
                action = 'retract';
                toast.success('Oyunuz geri alındı.');

            } else {
                // Vote/Change: 
                if (userVote !== null && newResults[userVote] > 0) newResults[userVote]--; // Remove old vote count
                newResults[index]++; // Add new vote count
                setUserVote(index);
                action = 'vote';
            }

            // Update UI immediately
            setPollResults(newResults);

            // Perform DB Operation
            if (action === 'retract') {
                const { error } = await supabase
                    .from('poll_votes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('poll_id', pollId);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('poll_votes')
                    .upsert({ user_id: user.id, poll_id: pollId, option_index: index }, { onConflict: 'user_id, poll_id' });

                if (error) throw error;
            }

            // Success: No need to re-fetch immediately as we trust our optimistic update.
            // But we can do a background verification later if needed.

        } catch (e) {
            console.error('Vote Error:', e);
            toast.error('Oylama sırasında bir hata oluştu.');

            // Revert State on Error
            setPollResults(previousResults);
            setUserVote(previousVote);
        }
    };

    const fetchPollResults = async (poll: { question: string, options: string[] }) => {
        const pollId = poll.question.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '_');
        const { data, error } = await supabase
            .from('poll_votes')
            .select('option_index, user_id, profiles:user_id!inner(id, is_archived)')
            .eq('poll_id', pollId)
            .eq('profiles.is_archived', false);
        if (error) { console.error('Fetch Results Error:', error); return; }
        const counts = new Array(poll.options.length).fill(0);
        data.forEach(v => {
            if (v.option_index < counts.length) counts[v.option_index]++;
        });
        setPollResults(counts);
        if (user) {
            const myVote = data.find(v => v.user_id === user.id);
            if (myVote) setUserVote(myVote.option_index);
        }
    };

    const totalVotes = pollResults.reduce((a, b) => a + b, 0);

    useEffect(() => {
        const fetchPoll = async () => {
            try {
                const res = await fetch('/api/poll');
                const data = await res.json();
                setActivePoll(data);
                fetchPollResults(data);
            } catch (e) {
                console.error(e);
                setActivePoll({ question: "Hata: Anket yüklenemedi.", options: ["..."] });
            } finally { setPollLoading(false); }
        };
        fetchPoll();
    }, [user]);

    const fetchVoters = async () => {
        if (!activePoll) return;
        setIsLoadingVoters(true);
        setSelectedVoterOption(0);
        setShowVotersModal(true);
        try {
            const pollId = activePoll.question.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '_');
            const res = await fetch(`/api/poll/${pollId}/voters`);
            const data = await res.json();
            if (data.voters) {
                setVoters(data.voters);
            }
        } catch (e) {
            console.error('Failed to fetch voters', e);
            toast.error('Katılımcılar yüklenemedi');
        } finally {
            setIsLoadingVoters(false);
        }
    };

    if (showSkeleton) {
        return <VoiceViewSkeleton />;
    }

    return (
        <div className="container mx-auto px-4 pt-8 pb-32 relative min-h-[100dvh]">
            {/* Newspaper Header - Static on mobile */}
            <div className="border-b-4 border-black dark:border-neutral-600 pb-4 mb-8 text-center transition-colors md:static bg-neutral-50 dark:bg-[#0a0a0a] pt-4 -mt-4 -mx-4 px-4 relative min-h-[240px]">
                <div className="flex flex-col items-center justify-center gap-4">
                    <h2 className="text-4xl md:text-6xl font-black font-serif uppercase tracking-tight mb-0 text-black dark:text-white flex items-center justify-center gap-4">
                        Kampüsün Sesi
                    </h2>

                    {/* Global Mode Switch - Moved Here */}
                    {/* Global Mode Switch - Custom Morphing Button (3D Flip) */}
                    <div className="flex items-center gap-3">
                        <div 
                            className="relative w-14 h-14 rounded-full perspective-1000 cursor-pointer mb-2"
                            onClick={() => setIsGlobalMode(!isGlobalMode)}
                            title={isGlobalMode ? "ODTÜ Moduna Geç" : "Global Moda Geç"}
                        >
                                <div 
                                    className="w-full h-full relative preserve-3d transition-transform duration-700 ease-in-out"
                                    style={{ transform: isGlobalMode ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                                >
                                {/* Front: ODTÜ */}
                                <div className="absolute inset-0 backface-hidden rounded-full overflow-hidden border-2 border-black dark:border-neutral-400 bg-white dark:bg-black shadow-md">
                                     <img src="/odtu_logo.png" alt="ODTÜ" className="w-full h-full object-cover" />
                                </div>
                                {/* Back: Global */}
                                <div 
                                    className="absolute inset-0 backface-hidden rounded-full overflow-hidden border-2 border-black dark:border-neutral-400 bg-white dark:bg-black shadow-md flex items-center justify-center transform rotate-y-180"
                                    style={{ transform: 'rotateY(180deg)' }}
                                >
                                    <img src="/earth_image.jpg" alt="Global" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center text-sm font-medium border-t-2 border-black dark:border-neutral-600 pt-2 mt-4 max-w-2xl mx-auto text-neutral-600 dark:text-neutral-400 h-8">
                    <span>SAYI: {issueNumber}</span>
                    <span>{isGlobalMode ? 'DÜNYA GÜNDEMİ' : 'SERBEST KÜRSÜ'}</span>
                    <span>{formattedDate.toUpperCase()}</span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isGlobalMode ? (
                    <motion.div
                        key="global"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center justify-center py-20 min-h-[50vh] text-center"
                    >
                        <div className="relative w-64 h-64 mb-8 group perspective-1000">
                            {/* Globe Animation/Icon */}
                            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                            <Globe className="w-full h-full text-blue-600 dark:text-blue-400 animate-[spin_60s_linear_infinite]" strokeWidth={0.5} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-6xl">🌍</span>
                            </div>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black font-serif text-neutral-900 dark:text-white mb-6">
                            Global Sohbet
                        </h2>

                        <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-300 max-w-lg mx-auto mb-10 leading-relaxed font-serif">
                            Sınırlar kalkıyor! Dünyanın dört bir yanındaki üniversite öğrencileriyle çok yakında burada buluşacaksın.
                        </p>

                        <div className="flex gap-4">
                            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold border border-neutral-200 dark:border-neutral-700">
                                <Lock size={18} />
                                Erişime Kapalı
                            </span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="odtu"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Column: Forum / Letters - Shows last on mobile, first on desktop */}
                            <div className="lg:col-span-2 space-y-8 order-last lg:order-first">
                                <div className="flex justify-between items-end border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2 font-serif dark:text-white">
                                        <MessageSquare size={24} />
                                        Öğrenci Kürsüsü
                                    </h3>

                                    <div className="flex items-center gap-4">
                                        {activeTagFilter && (
                                            <button
                                                onClick={() => setActiveTagFilter(null)}
                                                className="text-xs font-black uppercase px-3 py-1.5 rounded-full flex items-center gap-2 transition-all active:scale-95 shadow-sm group text-white"
                                                style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}
                                            >
                                                <span>{activeTagFilter}</span>
                                                <X size={12} strokeWidth={3} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Input Area */}
                                {user ? (
                                    <div className="bg-neutral-50 dark:bg-transparent p-6 border border-neutral-200 dark:border-none mb-8 rounded-sm shadow-sm dark:shadow-none relative">
                                        <div className="absolute top-0 right-0 p-2 opacity-5 dark:opacity-0 dark:text-white">
                                            <MessageSquare size={100} />
                                        </div>

                                        <h4 className="font-bold font-serif text-lg mb-4 flex items-center gap-2 dark:text-white">
                                            Sesini Duyur
                                        </h4>

                                        <form onSubmit={handlePost} className="relative z-50">
                                            <textarea
                                                ref={textareaRef}
                                                rows={3}
                                                maxLength={280}
                                                className="w-full p-3 border-2 border-neutral-300 dark:border-neutral-700 focus:outline-none focus:border-transparent focus:ring-2 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-800 dark:text-white mb-3 font-serif resize-none transition-colors placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                                                style={{ '--tw-ring-color': 'var(--primary-color, #C8102E)' } as React.CSSProperties}
                                                placeholder="Kampüs gündemi hakkında ne düşünüyorsun? (#etiket kullanabilirsin)"
                                                value={newStatus}
                                                onChange={handleTextChange}
                                                onClick={(e) => setCursorPos(e.currentTarget.selectionStart)}
                                                onKeyUp={(e) => setCursorPos(e.currentTarget.selectionStart)}
                                            />

                                            {showSuggestions && (
                                                <div className="absolute left-0 bottom-full mb-1 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg z-[1000] max-h-48 overflow-y-auto">
                                                    <ul className="py-1">
                                                        {suggestionList.map(tag => (
                                                            <li
                                                                key={tag}
                                                                onClick={() => insertTag(tag)}
                                                                className="px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer font-bold font-serif text-sm flex items-center gap-2 dark:text-neutral-200"
                                                            >
                                                                <Tag size={12} />
                                                                {tag}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center border-t border-neutral-200 dark:border-neutral-800 pt-3">
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <div className={`w-4 h-4 border transition-colors flex items-center justify-center ${isAnonymous ? 'bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white' : 'border-neutral-300 dark:border-neutral-700 group-hover:border-neutral-900 dark:group-hover:border-white'}`}>
                                                        {isAnonymous && <span className="text-white dark:text-black text-[10px] choice">✓</span>}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={isAnonymous}
                                                        onChange={(e) => setIsAnonymous(e.target.checked)}
                                                    />
                                                    <span className={`text-sm ${isAnonymous ? 'font-bold text-black dark:text-white' : 'text-neutral-500 dark:text-neutral-400'}`}>Anonim Paylaş</span>
                                                </label>

                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-neutral-400 dark:text-neutral-500">{newStatus.length}/280</span>
                                                    <button
                                                        type="submit"
                                                        disabled={!newStatus.trim() || isPosting}
                                                        className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-bold uppercase text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 flex items-center gap-2 transition-colors"
                                                    >
                                                        <Send size={14} />
                                                        {isPosting ? 'Yayınlanıyor...' : 'Yayınla'}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="bg-neutral-100 dark:bg-neutral-900 p-6 text-center border border-neutral-200 dark:border-neutral-800 mb-8">
                                        <p className="text-neutral-600 dark:text-neutral-400">Paylaşım yapmak için <Link href="/login" className="underline font-bold text-black dark:text-white">giriş yapmalısın</Link>.</p>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {voices.length === 0 && !showSkeleton ? (
                                        <div className="text-center py-12 text-neutral-500 italic font-serif">Henüz bir ses yok. İlk sen ol!</div>
                                    ) : (
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeTagFilter || 'all'}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                {voices.map((voice) => (
                                                    <VoiceItem
                                                        key={voice.id}
                                                        voice={voice}
                                                        user={user}
                                                        handleReaction={handleReaction}
                                                        handleDelete={handleDelete}
                                                        startEdit={startEdit}
                                                        editingId={editingId}
                                                        handleUpdate={handleUpdate}
                                                        editContent={editContent}
                                                        setEditContent={setEditContent}
                                                        setEditingId={setEditingId}
                                                        activeMenu={activeMenu}
                                                        setActiveMenu={setActiveMenu}
                                                        activeCommentBox={activeCommentBox}
                                                        setActiveCommentBox={setActiveCommentBox}
                                                        toggleVoiceComments={toggleVoiceComments}
                                                        expandedVoices={expandedVoices}
                                                        visibleCommentsCount={visibleCommentsCount}
                                                        loadMoreComments={loadMoreComments}
                                                        postOwnerAvatarRefs={postOwnerAvatarRefs}
                                                        containerRefs={containerRefs}
                                                        handleCommentSubmit={handleCommentSubmit}
                                                        handleCommentReaction={handleCommentReaction}
                                                        handleCommentDelete={handleCommentDelete}
                                                        handleCommentUpdate={handleCommentUpdate}
                                                        replyingTo={replyingTo}
                                                        setReplyingTo={setReplyingTo}
                                                        replyContent={replyContent}
                                                        setReplyContent={setReplyContent}
                                                        isCommenting={isCommenting}
                                                        newComment={newComment}
                                                        setNewComment={setNewComment}
                                                        formatRelativeTime={formatRelativeTime}
                                                        renderContentWithTags={renderContentWithTags}
                                                    />
                                                ))}
                                            </motion.div>
                                        </AnimatePresence>
                                    )}
                                </div>
                            </div>

                            {/* Sidebar: Polls & Stats - Shows first on mobile, last on desktop */}
                            <div className="order-first lg:order-last -mx-4 px-4 lg:mx-0 lg:px-0">
                                <VoiceStatsWidget
                                    activePoll={activePoll}
                                    pollLoading={pollLoading}
                                    pollResults={pollResults}
                                    totalVotes={totalVotes}
                                    userVote={userVote}
                                    onPollVote={handlePollVote}
                                    allTags={allTags}
                                    activeTagFilter={activeTagFilter}
                                    onTagFilterChange={setActiveTagFilter}
                                    activeUsers={activeUsers}
                                    issueNumber={issueNumber}
                                    onVotersClick={fetchVoters}
                                />

                            </div>
                        </div>



                    </motion.div>
                )}
            </AnimatePresence>

            {/* Poll Voters Modal */}
            {
                showVotersModal && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowVotersModal(false)} />
                        <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden animate-in zoom-in duration-200 rounded-xl">
                            <div className="flex justify-between items-center p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                                <h3 className="text-xl font-bold font-serif uppercase tracking-tight dark:text-white flex items-center gap-2">
                                    <Users size={24} className="text-primary" />
                                    Oy Kullananlar
                                </h3>
                                <button onClick={() => setShowVotersModal(false)} className="hover:text-primary transition-colors p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="px-6 py-4 bg-white dark:bg-neutral-900 border-b-2 border-neutral-100 dark:border-neutral-800">
                                <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2">
                                    {activePoll?.options.map((option, idx) => {
                                        const count = voters.filter(v => v.option_index === idx).length;
                                        const isActive = selectedVoterOption === idx;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedVoterOption(idx)}
                                                style={isActive ? { backgroundColor: 'var(--primary-color, #C8102E)', borderColor: 'var(--primary-color, #C8102E)' } : {}}
                                                className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 border-2 ${isActive ? 'text-white' : 'bg-white text-neutral-600 border-neutral-200 hover:border-black dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'}`}
                                            >
                                                {option} <span className="opacity-70">({count})</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="p-6 max-h-[50vh] overflow-y-auto bg-neutral-50/50 dark:bg-neutral-900/50">
                                {isLoadingVoters ? (
                                    <div className="text-center">Yükleniyor...</div>
                                ) : voters.length === 0 ? (
                                    <div className="text-center italic">Henüz veri yok.</div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {voters.filter(v => v.option_index === selectedVoterOption).map(voter => (
                                            <Link key={voter.user_id} href={`/profile/${voter.user_id}`} className="flex items-center gap-3 p-3 bg-white dark:bg-[#0a0a0a] rounded border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-black dark:hover:border-neutral-500 transition-colors">
                                                {voter.avatar_url ? (
                                                    <img src={voter.avatar_url} alt={voter.display_name} className="w-8 h-8 rounded-full object-cover border border-neutral-200" />
                                                ) : (
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white uppercase text-xs"
                                                        style={{ 
                                                            backgroundColor: 'var(--primary-color, #C8102E)'
                                                        }}
                                                    >
                                                        {voter.display_name.charAt(0)}
                                                    </div>
                                                )}
                                                <span className="font-bold text-black dark:text-white">{voter.display_name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
