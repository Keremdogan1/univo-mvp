'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import NotificationCenter from '../NotificationCenter';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MessageSquare, Globe, Lock, X } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// Refactored Imports
import { Voice } from '@/components/voice/types';
import VoiceViewSkeleton from '@/components/voice/VoiceViewSkeleton';
import CreateVoiceForm from '@/components/voice/CreateVoiceForm';
import VoiceItem from '@/components/voice/VoiceItem';
import VoiceStatsWidget from './VoiceStatsWidget'; // This was already separate

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

    // Poll & Stats State (Restored)
    const [activePoll, setActivePoll] = useState<{ question: string, options: string[] } | null>(null);
    const [pollResults, setPollResults] = useState<number[]>([]);
    const [userVote, setUserVote] = useState<number | null>(null);
    const [pollLoading, setPollLoading] = useState(true);
    const [activeUsers, setActiveUsers] = useState(0);
    const [issueNumber, setIssueNumber] = useState(0);
    const [allTags, setAllTags] = useState<{ tag: string, count: number }[]>([]);

    const fetchPoll = async () => {
        // Mock Poll Data or fetch from DB
        // For MVP, using mock data as in original
        const mockPoll = {
            question: "Kampüs yemekhanesinde vegan menü çeşitliliği artırılmalı mı?",
            options: ["Kesinlikle Evet", "Mevcut Durum Yeterli", "Hayır, Gerek Yok", "Fikrim Yok"]
        };
        setActivePoll(mockPoll);
        
        // Mock fetching results/votes
        // In real app, fetch from 'poll_votes' table
        // Simulating async
        setTimeout(() => {
            setPollResults([450, 120, 30, 15]); // Mock counts
            setPollLoading(false);
            
            // Check local storage for user vote (mock)
            const savedVote = localStorage.getItem('poll_vote_1');
            if (savedVote) setUserVote(parseInt(savedVote));
        }, 1000);
    };

    const handlePollVote = (index: number) => {
        if (!activePoll) return;
        if (userVote !== null) {
            toast.error('Zaten oy kullandınız');
            return;
        }

        const newResults = [...pollResults];
        newResults[index] += 1;
        setPollResults(newResults);
        setUserVote(index);
        localStorage.setItem('poll_vote_1', index.toString());
        toast.success('Oyunuz kaydedildi');
    };

    const fetchVoters = async () => {
        // Mock active users
        setActiveUsers(Math.floor(Math.random() * 500) + 1200); // 1200-1700
    };

    const fetchVoices = async () => {
        try {
            const { data, error } = await supabase
                .from('voices')
                .select(`
                    *,
                    user:profiles(full_name, nickname, avatar_url, department, class_year),
                    comments(
                        id,
                        content,
                        created_at,
                        user:profiles(full_name, avatar_url),
                        user_id,
                        parent_id,
                        reactions:comment_reactions(user_id, reaction_type)
                    ),
                    reactions:voice_reactions(user_id, reaction_type, created_at)
                `)
                .eq('is_archived', false) // Only active
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Process data to match structure
            const processedData = data.map((voice: any) => ({
                ...voice,
                comments: voice.comments?.map((c: any) => ({
                    ...c,
                    user: c.user?.full_name || 'Kullanıcı',
                    user_avatar: c.user?.avatar_url,
                    reactions: {
                        count: (c.reactions?.filter((r: any) => r.reaction_type === 'like').length || 0) - (c.reactions?.filter((r: any) => r.reaction_type === 'dislike').length || 0)
                    }
                })) || []
            }));

            setVoices(processedData || []);
            setIssueNumber(processedData.length);

            // Extract Tags
            const tagsMap: Record<string, number> = {};
            processedData.forEach((v: Voice) => {
                if (v.tags) {
                    v.tags.forEach(t => {
                        tagsMap[t] = (tagsMap[t] || 0) + 1;
                    });
                }
                // Also parse content for tags if simple strings
                const contentTags = v.content.match(/#[\wğüşıöçĞÜŞİÖÇ]+/g);
                if (contentTags) {
                    contentTags.forEach(t => {
                        if (!v.tags?.includes(t)) { // Avoid double counting if already in tags array
                             tagsMap[t] = (tagsMap[t] || 0) + 1;
                        }
                    });
                }
            });
            const sortedTags = Object.entries(tagsMap)
                .map(([tag, count]) => ({ tag, count }))
                .sort((a, b) => b.count - a.count);
            setAllTags(sortedTags);

        } catch (error: any) {
            console.error('Error fetching voices:', error);
            toast.error(`Hata: ${error.message || error.details || 'Bilinmeyen hata'}`);
        } finally {
            setViewLoading(false);
        }
    };

    useEffect(() => {
        fetchVoices();
        fetchPoll();
        fetchVoters();

        const channel = supabase
            .channel('public:voices')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'voices' }, fetchVoices)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, fetchVoices)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_reactions' }, fetchVoices)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comment_reactions' }, fetchVoices)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const renderContentWithTags = (content: string) => {
        if (!content) return null;
        
        const parts = content.split(/(#[\wğüşıöçĞÜŞİÖÇ]+)/g);
        
        return (
            <p className="text-neutral-800 dark:text-neutral-200 mt-2 mb-3 leading-relaxed whitespace-pre-wrap font-serif text-lg">
                {parts.map((part, i) => {
                    if (part.startsWith('#')) {
                        return (
                            <span 
                                key={i}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTagFilter(activeTagFilter === part ? null : part);
                                }}
                                className={`font-bold cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 px-1 rounded transition-colors ${activeTagFilter === part ? 'text-black dark:text-white bg-neutral-100 dark:bg-neutral-800' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}
                            >
                                {part}
                            </span>
                        );
                    }
                    return part;
                })}
            </p>
        );
    };

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newStatus.trim()) return;

        setIsPosting(true);
        try {
            // Extract tags
            const tags = newStatus.match(/#[\wğüşıöçĞÜŞİÖÇ]+/g) || [];

            const { error } = await supabase
                .from('voices')
                .insert([{
                    user_id: user.id,
                    content: newStatus,
                    is_anonymous: isAnonymous,
                    tags: tags // Store tags directly
                }]);

            if (error) throw error;

            toast.success('Sesin kampüste yankılandı!');
            setNewStatus('');
            setIsAnonymous(false);
            fetchVoices();
        } catch (error) {
            console.error('Error posting voice:', error);
            toast.error('Paylaşım yapılırken bir hata oluştu');
        } finally {
            setIsPosting(false);
        }
    };

    const handleReaction = async (voiceId: string, targetType: 'like' | 'dislike') => {
        if (!user) {
            toast.error('Oy vermek için giriş yapmalısınız');
            return;
        }

        try {
            const currentReaction = voices.find(v => v.id === voiceId)
                ?.reactions.find(r => r.user_id === user.id);

            if (currentReaction?.reaction_type === targetType) {
                // Remove reaction
                await supabase
                    .from('voice_reactions')
                    .delete()
                    .eq('voice_id', voiceId)
                    .eq('user_id', user.id);
            } else {
                // Upsert reaction
                if (currentReaction) {
                    await supabase
                        .from('voice_reactions')
                        .delete()
                        .eq('voice_id', voiceId)
                        .eq('user_id', user.id);
                }
                
                await supabase
                    .from('voice_reactions')
                    .insert([{
                        voice_id: voiceId,
                        user_id: user.id,
                        reaction_type: targetType
                    }]);
            }

            fetchVoices(); // Optimistic update would be better but keeping simple
        } catch (error) {
            console.error('Error handling reaction:', error);
        }
    };

    // New Comment Handling
    const handleCommentReaction = async (e: React.MouseEvent, voiceId: string, commentId: string, type: 'like' | 'dislike') => {
        e.stopPropagation();
        if (!user) return toast.error('Giriş yapmalısınız');

        try {
            const voice = voices.find(v => v.id === voiceId);
            const comment = voice?.comments.find(c => c.id === commentId);
            
            // Need to fetch user's reaction for this comment differently or use what we have in state
            // Logic is complex without direct store, but assumption: backend toggle
            // For MVP, just insert/delete
            
            const { data: existing } = await supabase
                .from('comment_reactions')
                .select('*')
                .eq('comment_id', commentId)
                .eq('user_id', user.id)
                .single();

            if (existing && existing.reaction_type === type) {
                await supabase.from('comment_reactions').delete().eq('id', existing.id);
            } else {
                if (existing) await supabase.from('comment_reactions').delete().eq('id', existing.id);
                await supabase.from('comment_reactions').insert({
                    comment_id: commentId,
                    user_id: user.id,
                    reaction_type: type
                });
            }
            
            fetchVoices();
        } catch (error) {
            console.error(error);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent, voiceId: string, parentId: string | null = null, customContent: string | null = null) => {
        e.preventDefault();
        const content = customContent;
        if (!user || !content?.trim()) return;

        setIsCommenting(true);
        try {
            const { error } = await supabase
                .from('comments')
                .insert([{
                    voice_id: voiceId,
                    user_id: user.id,
                    content: content,
                    parent_id: parentId
                }]);

            if (error) throw error;

            toast.success('Yorumun eklendi');
            // Do not clear customContent here, caller handles it via state setter passed to them?
            // VoiceItem handles clearing 'newComment'.
            // CommentSystem handles clearing 'replyContent'.
            fetchVoices();
        } catch (error) {
            console.error('Error posting comment:', error);
            toast.error('Yorum eklenirken bir hata oluştu');
        } finally {
            setIsCommenting(false);
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setNewStatus(val);
        
        // Hashtag detection
        const cursorPos = e.target.selectionStart;
        const textBeforeCursor = val.slice(0, cursorPos);
        const lastHashIndex = textBeforeCursor.lastIndexOf('#');
        
        if (lastHashIndex !== -1) {
            const query = textBeforeCursor.slice(lastHashIndex + 1);
            // Check if there's a space after hash (invalid tag start)
            if (!query.includes(' ')) {
                const matches = INITIAL_TAGS.filter(t => 
                    t.toLowerCase().includes('#' + query.toLowerCase())
                );
                if (matches.length > 0) {
                    setSuggestionList(matches);
                    setShowSuggestions(true);
                    return;
                }
            }
        }
        setShowSuggestions(false);
    };

    const insertTag = (tag: string) => {
        if (!textareaRef.current) return;
        
        const val = textareaRef.current.value;
        const textBeforeCursor = val.slice(0, cursorPos);
        const lastHashIndex = textBeforeCursor.lastIndexOf('#');
        
        const newValue = val.slice(0, lastHashIndex) + tag + ' ' + val.slice(cursorPos);
        setNewStatus(newValue);
        setShowSuggestions(false);
        textareaRef.current.focus();
    };

    const handleDelete = async (voiceId: string) => {
        try {
            const { error } = await supabase
                .from('voices')
                .update({ is_archived: true })
                .eq('id', voiceId);

            if (error) throw error;
            toast.success('Paylaşım silindi');
            fetchVoices();
        } catch (error) {
            console.error('Error deleting voice:', error);
            toast.error('Silinirken bir hata oluştu');
        }
    };

    const startEdit = (voice: Voice) => {
        setEditingId(voice.id);
        setEditContent(voice.content);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId || !editContent.trim()) return;

        try {
            const { error } = await supabase
                .from('voices')
                .update({ content: editContent })
                .eq('id', editingId);

            if (error) throw error;
            toast.success('Paylaşım güncellendi');
            setEditingId(null);
            fetchVoices();
        } catch (error) {
            console.error('Error updating voice:', error);
            toast.error('Güncellenirken bir hata oluştu');
        }
    };

    const handleCommentDelete = async (commentId: string) => {
        try {
            const { error } = await supabase
                .from('comments')
                .delete() // Or update is_archived if comments have it? Assuming delete for now based on simplicity
                .eq('id', commentId);

            if (error) throw error;
            toast.success('Yorum silindi');
            fetchVoices();
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Yorum silinirken bir hata oluştu');
        }
    };

    const handleCommentUpdate = async (commentId: string, newContent: string) => {
        try {
            const { error } = await supabase
                .from('comments')
                .update({ content: newContent })
                .eq('id', commentId);

            if (error) throw error;
            toast.success('Yorum güncellendi');
            fetchVoices();
        } catch (error) {
            console.error('Error updating comment:', error);
            toast.error('Yorum güncellenirken bir hata oluştu');
        }
    };

    function formatRelativeTime(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
        if (diffInSeconds < 60) return 'Az önce';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}dk`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}s`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}g`;
        
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    }

    if (showSkeleton) return <VoiceViewSkeleton />;

    const filteredVoices = voices.filter(voice => {
        if (activeTagFilter) {
            return voice.content.includes(activeTagFilter) || (voice.tags && voice.tags.includes(activeTagFilter));
        }
        return true;
    });

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-black font-serif tracking-tight text-neutral-900 dark:text-white">
                        Kampüsün Sesi
                    </h1>
                </div>
                <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full">
                    <button
                        onClick={() => setIsGlobalMode(false)}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${!isGlobalMode ? 'bg-white dark:bg-neutral-900 text-black dark:text-white shadow-sm' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}
                    >
                        ODTÜ
                    </button>
                    <button
                        onClick={() => setIsGlobalMode(true)}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isGlobalMode ? 'bg-white dark:bg-neutral-900 text-black dark:text-white shadow-sm' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}
                    >
                        GLOBAL
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded uppercase">Yakında</span>
                    </button>
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
                                <CreateVoiceForm
                                    user={user}
                                    handlePost={handlePost}
                                    newStatus={newStatus}
                                    handleTextChange={handleTextChange}
                                    textareaRef={textareaRef}
                                    setCursorPos={setCursorPos}
                                    showSuggestions={showSuggestions}
                                    suggestionList={suggestionList}
                                    insertTag={insertTag}
                                    isAnonymous={isAnonymous}
                                    setIsAnonymous={setIsAnonymous}
                                    isPosting={isPosting}
                                    activeTagFilter={activeTagFilter}
                                    setActiveTagFilter={setActiveTagFilter}
                                />

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
                                                {filteredVoices.map((voice) => (
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

                            {/* Sidebar: Stats & Trending */}
                            <div className="space-y-6">
                                <VoiceStatsWidget 
                                    activePoll={activePoll}
                                    pollLoading={pollLoading}
                                    pollResults={pollResults}
                                    totalVotes={pollResults.reduce((a, b) => a + b, 0)}
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
        </div>
    );
};
