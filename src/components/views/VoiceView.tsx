'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import NotificationCenter from '../NotificationCenter';
import { MessageSquare, Send, Tag, Award, Ghost, TrendingUp, ArrowRight, ArrowBigUp, ArrowBigDown, MoreVertical, Edit2, Trash2, X, Share2, UserPlus, Users, BadgeCheck, Globe, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import FriendButton from '../FriendButton';
import VoiceStatsWidget from './VoiceStatsWidget';

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
    }>;
}

const INITIAL_TAGS = ['#kampüs', '#yemekhane', '#kütüphane', '#ulaşım', '#sınav', '#etkinlik', '#spor'];

export default function VoiceView() {
    const { user } = useAuth();
    const router = useRouter();
    const [voices, setVoices] = useState<Voice[]>([]);
    const [isGlobalMode, setIsGlobalMode] = useState(false);

    const [newStatus, setNewStatus] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
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
    const [voters, setVoters] = useState<{ user_id: string, display_name: string, option_index: number }[]>([]);
    const [isLoadingVoters, setIsLoadingVoters] = useState(false);
    const [selectedVoterOption, setSelectedVoterOption] = useState(0);

    useEffect(() => {
        fetchVoices();
    }, [activeTagFilter]);

    const fetchVoices = async () => {
        setIsLoading(true);
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
            setIsLoading(false);
        }
    };

    const renderContentWithTags = (content: string) => {
        const parts = content.split(/(#[\wçğıöşüÇĞİÖŞÜ]+)/g);
        return parts.map((part, index) => {
            if (part.match(/^#[\wçğıöşüÇĞİÖŞÜ]+$/)) {
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

            const extractedTags = newStatus.match(/#[\wçğıöşüÇĞİÖŞÜ]+/g) || [];

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

    const handleCommentSubmit = async (e: React.FormEvent, voiceId: string) => {
        e.preventDefault();
        if (!newComment.trim() || isCommenting) return;
        if (!user) return;

        setIsCommenting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch(`/api/voices/${voiceId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ content: newComment })
            });

            if (res.ok) {
                setNewComment('');
                fetchVoices();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsCommenting(false);
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setNewStatus(val);
        const pos = e.target.selectionStart;
        setCursorPos(pos);

        const textBeforeCursor = val.slice(0, pos);
        const matches = textBeforeCursor.match(/#([\wçğıöşüÇĞİÖŞÜ]*)$/);

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
        const matches = textBeforeCursor.match(/#([\wçğıöşüÇĞİÖŞÜ]*)$/);
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
        setVoices(prev => prev.map(v => v.id === vId ? { ...v, content: editContent } : v));
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
                body: JSON.stringify({ content: editContent })
            });
            if (!res.ok) throw new Error('Update failed');
            toast.success('Gönderi güncellendi.');
        } catch (e) {
            console.error(e);
            toast.error('Güncelleme başarısız.');
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

    return (
        <div className="container mx-auto px-4 py-8 relative">
            {/* Newspaper Header - Static on mobile */}
            <div className="border-b-4 border-black dark:border-neutral-600 pb-4 mb-8 text-center transition-colors md:static bg-neutral-50 dark:bg-[#0a0a0a] pt-4 -mt-4 -mx-4 px-4 relative">
                <div className="flex flex-col items-center justify-center gap-4">
                    <h2 className="text-3xl md:text-6xl font-black font-serif uppercase tracking-tight mb-0 text-black dark:text-white flex items-center justify-center gap-4">
                        Kampüsün Sesi
                    </h2>
                    
                    {/* Global Mode Switch - Moved Here */}
                    <div className="flex items-center gap-3">
                         <div
                            className="flex items-center cursor-pointer select-none group bg-white dark:bg-black px-2 py-1 rounded-full border-2 border-black dark:border-neutral-600 shadow-sm"
                            onClick={() => setIsGlobalMode(!isGlobalMode)}
                            title={isGlobalMode ? "ODTÜ Moduna Geç" : "Global Moda Geç"}
                        >
                            <span className={`text-xs font-black uppercase mr-2 ${!isGlobalMode ? 'text-primary' : 'text-neutral-400'}`}>ODTÜ</span>
                            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 relative shadow-inner ${isGlobalMode ? 'bg-blue-600' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                                {!isGlobalMode && <div className="absolute inset-0 bg-[var(--primary-color,#C8102E)] rounded-full opacity-100" />}
                                <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-300 relative z-10 ${isGlobalMode ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <span className={`text-xs font-black uppercase ml-2 ${isGlobalMode ? 'text-blue-600' : 'text-neutral-400'}`}>Global</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center text-sm font-medium border-t-2 border-black dark:border-neutral-600 pt-2 max-w-2xl mx-auto text-neutral-600 dark:text-neutral-400 mt-4">
                    <span>SAYI: {issueNumber}</span>
                    <span>{isGlobalMode ? 'DÜNYA GÜNDEMİ' : 'SERBEST KÜRSÜ'}</span>
                    <span>{formattedDate.toUpperCase()}</span>
                </div>
            </div>

            {isGlobalMode ? (
                // GLOBAL MODE PLACEHOLDER
                <div className="flex flex-col items-center justify-center py-20 min-h-[50vh] text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                </div>
            ) : (
                <>
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
                                {isLoading ? (
                                    <div className="text-center py-12 text-neutral-400 animate-pulse">Yükleniyor...</div>
                                ) : voices.length === 0 ? (
                                    <div className="text-center py-12 text-neutral-500 italic font-serif">Henüz bir ses yok. İlk sen ol!</div>
                                ) : (
                                    voices.map((voice) => {
                                        const reactions = voice.reactions || [];
                                        const myReaction = user ? reactions.find(r => r.user_id === user.id)?.reaction_type : null;
                                        const likeCount = reactions.filter(r => r.reaction_type === 'like').length;
                                        const dislikeCount = reactions.filter(r => r.reaction_type === 'dislike').length;
                                        const netVote = likeCount - dislikeCount;

                                        return (
                                            <article key={voice.id} className={`bg-white dark:bg-[#0a0a0a] border-b border-neutral-200 dark:border-neutral-800 pb-6 last:border-0 px-2 relative transition-colors ${voice.is_editors_choice ? 'bg-yellow-50/50 dark:bg-yellow-900/10 -mx-2 px-4 py-4 rounded-lg border-none ring-1 ring-yellow-200 dark:ring-yellow-700/50' : ''}`}>
                                                {voice.is_editors_choice && (
                                                    <div className="absolute -top-3 right-4 bg-yellow-400 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase tracking-wider">
                                                        <Award size={12} className="text-yellow-900 dark:text-yellow-100" />
                                                        Editörün Seçimi
                                                    </div>
                                                )}

                                                <div className="flex gap-4 items-start">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-serif shrink-0 border border-neutral-200 dark:border-neutral-800 ${voice.is_anonymous ? 'bg-neutral-800 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-300' : 'text-white bg-primary'}`}
                                                        style={!voice.is_anonymous ? { backgroundColor: 'var(--primary-color, #C8102E)' } : undefined}
                                                    >
                                                        {voice.is_anonymous ? <Ghost size={20} /> : voice.user.full_name?.charAt(0)}
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                            {voice.is_anonymous ? (
                                                                <span className="font-bold text-neutral-600 dark:text-neutral-400 italic">
                                                                    {voice.user.nickname || 'Rumuzlu Öğrenci'}
                                                                </span>
                                                            ) : (
                                                                <Link href={`/profile/${voice.user_id}`} className="font-bold text-neutral-900 dark:text-white hover:underline">
                                                                    {voice.user.full_name}
                                                                </Link>
                                                            )}
                                                            {(voice.user.department || voice.user.class_year) && (
                                                                <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest border-l border-neutral-300 dark:border-neutral-700 pl-2 ml-1 truncate max-w-[120px] sm:max-w-none">
                                                                    {[voice.user.department, voice.user.class_year].filter(Boolean).join(' • ')}
                                                                </span>
                                                            )}
                                                            <div className="ml-auto relative">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveMenu(activeMenu === voice.id ? null : voice.id);
                                                                    }}
                                                                    className="p-1 text-neutral-400 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                                >
                                                                    <MoreVertical size={16} />
                                                                </button>
                                                                {activeMenu === voice.id && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                                                                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-lg z-20 w-40 overflow-hidden py-1">
                                                                            {user && voice.user_id === user.id ? (
                                                                                <>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            startEdit(voice);
                                                                                            setActiveMenu(null);
                                                                                        }}
                                                                                        className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-2"
                                                                                    >
                                                                                        <Edit2 size={14} />
                                                                                        Düzenle
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            handleDelete(voice.id);
                                                                                            setActiveMenu(null);
                                                                                        }}
                                                                                        className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                        Sil
                                                                                    </button>
                                                                                </>
                                                                            ) : !voice.is_anonymous ? (
                                                                                <FriendButton
                                                                                    targetUserId={voice.user_id}
                                                                                    variant="menu-item"
                                                                                />
                                                                            ) : null}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {editingId === voice.id ? (
                                                            <form onSubmit={handleUpdate} className="mb-4">
                                                                <textarea
                                                                    className="w-full p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 dark:text-white font-serif rounded-sm focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                                                                    rows={3}
                                                                    value={editContent}
                                                                    onChange={e => setEditContent(e.target.value)}
                                                                />
                                                                <div className="flex justify-end gap-2 mt-2">
                                                                    <button type="button" onClick={() => setEditingId(null)} className="text-xs font-bold uppercase text-neutral-500 hover:text-black dark:hover:text-white">İptal</button>
                                                                    <button type="submit" className="text-xs font-bold uppercase bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-sm">Kaydet</button>
                                                                </div>
                                                            </form>
                                                        ) : (
                                                            <div className="mb-4 group/content relative">
                                                                <p className="text-neutral-900 dark:text-neutral-200 leading-relaxed text-lg font-serif">
                                                                    {renderContentWithTags(voice.content)}
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-900">
                                                            <div className="flex items-center gap-6">
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleReaction(voice.id, 'like'); }}
                                                                        className={`p-2 rounded-full transition-all ${myReaction === 'like' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-neutral-400 dark:text-neutral-500 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-500'}`}
                                                                        title="Yükselt"
                                                                    >
                                                                        <ArrowBigUp size={20} className={myReaction === 'like' ? 'fill-current' : ''} />
                                                                    </button>
                                                                    <span className={`text-sm font-bold w-6 text-center ${netVote > 0 ? 'text-green-600' : netVote < 0 ? 'text-red-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                                                        {netVote}
                                                                    </span>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleReaction(voice.id, 'dislike'); }}
                                                                        className={`p-2 rounded-full transition-all ${myReaction === 'dislike' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-neutral-400 dark:text-neutral-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'}`}
                                                                        title="Düşür"
                                                                    >
                                                                        <ArrowBigDown size={20} className={myReaction === 'dislike' ? 'fill-current' : ''} />
                                                                    </button>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setActiveCommentBox(activeCommentBox === voice.id ? null : voice.id); }}
                                                                    className={`flex items-center gap-2 group transition-colors ${activeCommentBox === voice.id ? 'text-blue-500' : 'text-neutral-400 dark:text-neutral-500 hover:text-blue-500'}`}
                                                                >
                                                                    <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                                                                        <MessageSquare size={18} />
                                                                    </div>
                                                                    <span className="text-sm font-medium">{voice.comments.length > 0 ? voice.comments.length : ''}</span>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
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
                                                            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                                                                {formatRelativeTime(voice.created_at)}
                                                            </span>
                                                        </div>

                                                        {(activeCommentBox === voice.id || (voice.comments.length > 0 && activeCommentBox === voice.id)) && (
                                                            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-900 w-full animate-in slide-in-from-top-2">
                                                                <div className="space-y-4 mb-4">
                                                                    {voice.comments.map(comment => (
                                                                        <div key={comment.id} className="flex gap-3">
                                                                            <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-bold text-neutral-500 dark:text-neutral-400">
                                                                                {comment.user.charAt(0)}
                                                                            </div>
                                                                            <div className="flex-1 bg-neutral-50 dark:bg-neutral-900 rounded-2xl rounded-tl-none p-3">
                                                                                <div className="flex justify-between items-baseline mb-1">
                                                                                    <Link href={`/profile/${comment.user_id}`} className="font-bold text-sm text-neutral-900 dark:text-neutral-200 hover:underline">
                                                                                        {comment.user}
                                                                                    </Link>
                                                                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{formatRelativeTime(comment.created_at)}</span>
                                                                                </div>
                                                                                <p className="text-sm text-neutral-700 dark:text-neutral-300">{comment.content}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {activeCommentBox === voice.id && (
                                                                    <form onSubmit={(e) => handleCommentSubmit(e, voice.id)} className="flex gap-2 mt-4 pt-2">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Yorumunu yaz..."
                                                                            className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:border-black dark:focus:border-[#C8102E] font-serif dark:text-white transition-colors"
                                                                            value={newComment}
                                                                            onChange={(e) => setNewComment(e.target.value)}
                                                                            autoFocus
                                                                        />
                                                                        <button
                                                                            type="submit"
                                                                            disabled={!newComment.trim() || isCommenting}
                                                                            className="p-2 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                                                                        >
                                                                            {isCommenting ? '...' : <Send size={14} />}
                                                                        </button>
                                                                    </form>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })
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

                            <div className="hidden lg:flex lg:flex-col lg:gap-8 lg:pr-2">
                                {/* Desktop Poll - Newspaper Theme */}
                                <div className="border-4 border-black dark:border-neutral-600 p-6 bg-neutral-50 dark:bg-[#0a0a0a] transition-colors rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                                    <div className="flex items-center justify-between border-b-2 border-black dark:border-neutral-600 pb-2 mb-4">
                                        <h3 className="text-lg font-black font-serif uppercase tracking-tight dark:text-white">
                                            Haftanın Anketi
                                        </h3>
                                    </div>

                                    {activePoll && (
                                        <>
                                            <h4 className="font-bold text-sm mb-4 font-serif leading-tight dark:text-white">"{activePoll.question}"</h4>
                                            <div className="space-y-3">
                                                {activePoll.options.map((option, idx) => {
                                                    const percentage = totalVotes === 0 ? 0 : Math.round((pollResults[idx] / totalVotes) * 100);
                                                    const isSelected = userVote === idx;
                                                    const showResults = userVote !== null;

                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handlePollVote(idx); 
                                                            }}
                                                            className={`w-full text-left relative border-2 transition-all font-bold group overflow-hidden rounded-md ${isSelected
                                                                ? 'border-black dark:border-neutral-300 bg-white dark:bg-neutral-800'
                                                                : 'border-neutral-200 dark:border-neutral-700 hover:border-black dark:hover:border-neutral-200'
                                                                }`}
                                                        >
                                                            {showResults && (
                                                                <div
                                                                    className="absolute top-0 left-0 h-full bg-neutral-200 dark:bg-neutral-700 transition-all duration-500 ease-out"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            )}

                                                            <div className="relative p-3 flex justify-between items-center z-10">
                                                                <span className={isSelected ? 'text-black dark:text-white' : 'text-neutral-800 dark:text-neutral-200 group-hover:text-black dark:group-hover:text-white transition-colors'}>
                                                                    {option}
                                                                </span>
                                                                {showResults && <span className="text-sm font-black dark:text-white">{percentage}%</span>}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {userVote !== null && (
                                                <button 
                                                    onClick={fetchVoters}
                                                    className="w-full text-center mt-3 text-xs text-neutral-500 dark:text-neutral-400 font-medium font-serif hover:text-primary hover:underline transition-colors block"
                                                >
                                                    {totalVotes} oy kullanıldı
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Trending Topics (Desktop) - Newspaper Theme */}
                                <div className="border-4 border-black dark:border-neutral-600 p-6 bg-neutral-50 dark:bg-[#0a0a0a] transition-colors rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                                    <h3 className="text-lg font-black border-b-2 border-black dark:border-neutral-600 pb-2 mb-4 font-serif uppercase tracking-tight dark:text-white flex items-center gap-2">
                                        <TrendingUp size={20} style={{ color: 'var(--primary-color, #C8102E)' }} />
                                        Kampüste Gündem
                                    </h3>
                                    <div className="space-y-3">
                                        {allTags.length > 0 ? (
                                            allTags.slice(0, 5).map((topic, index) => (
                                                <div 
                                                    key={topic.tag} 
                                                    onClick={() => setActiveTagFilter(topic.tag === activeTagFilter ? null : topic.tag)} 
                                                    className={`flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-lg transition-colors border-b border-neutral-200 dark:border-neutral-800 last:border-0 ${activeTagFilter === topic.tag ? 'bg-white dark:bg-neutral-900 shadow-sm' : 'hover:bg-white dark:hover:bg-neutral-900'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg font-serif font-black text-neutral-400 dark:text-neutral-600 w-5">{index + 1}</span>
                                                        <div className="flex flex-col">
                                                            <span className={`font-bold text-sm transition-colors font-serif ${activeTagFilter === topic.tag ? 'text-primary' : 'text-neutral-900 dark:text-white group-hover:text-primary'}`}>
                                                                {topic.tag.startsWith('#') ? topic.tag : `#${topic.tag}`}
                                                            </span>
                                                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">{topic.count} gönderi</span>
                                                        </div>
                                                    </div>
                                                    <ArrowRight size={14} className={`transition-transform ${activeTagFilter === topic.tag ? 'opacity-100 text-primary' : 'text-black dark:text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1'}`} />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-4 text-neutral-400 text-xs italic font-serif">
                                                Henüz gündem oluşmadı.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Campus Pulse (Desktop) - Newspaper Theme */}
                                <div className="border-4 border-black dark:border-neutral-600 p-6 bg-neutral-50 dark:bg-[#0a0a0a] transition-colors rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                                    <h3 className="text-lg font-black border-b-2 border-black dark:border-neutral-600 pb-2 mb-4 font-serif uppercase tracking-tight dark:text-white text-center">
                                        Kampüs Nabzı
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-center">
                                        <div
                                            className="p-3 bg-white dark:bg-neutral-900 rounded border-2 border-[var(--primary-color)]"
                                            style={{
                                                borderColor: 'var(--primary-color, #C8102E)'
                                            }}
                                        >
                                            <span
                                                className="block text-3xl font-black font-serif animate-pulse"
                                                style={{ color: 'var(--primary-color, #C8102E)' }}
                                            >
                                                {activeUsers}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400">
                                                Aktif Öğrenci
                                            </span>
                                        </div>
                                        <div className="p-3 bg-white dark:bg-neutral-900 rounded border-2 border-neutral-200 dark:border-neutral-700">
                                            <span className="block text-3xl font-black font-serif text-black dark:text-white">
                                                {issueNumber}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400">
                                                Gündem Sayısı
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Poll Voters Modal */}
            {showVotersModal && (
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
                                            <div 
                                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white uppercase" 
                                                style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}
                                            >
                                                {voter.display_name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-black dark:text-white">{voter.display_name}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
