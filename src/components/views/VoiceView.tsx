'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Send, Tag, Award, Ghost, TrendingUp, ArrowRight, ArrowBigUp, ArrowBigDown, MoreVertical, Edit2, Trash2, X, Share2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import FriendButton from '../FriendButton';

// Interfaces
interface Voice {
    id: string;
    user_id: string; // Added for ownership check
    content: string;
    created_at: string;
    is_anonymous: boolean;
    is_editors_choice: boolean;
    tags: string[] | null;
    user: {
        full_name: string;
        department: string;
        avatar_url?: string;
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

// MOCK DATA
const TRENDING_TOPICS = [
    { id: 1, tag: 'baharşenliği', count: 120 },
    { id: 2, tag: 'finalhaftası', count: 85 },
    { id: 3, tag: 'kütüphane', count: 64 },
    { id: 4, tag: 'yemekhane', count: 42 },
];

const WEEKLY_POLLS = [
    {
        question: "Kampüs kedilerinin kışın korunması için yapılan 'Kedi Evi' projesini yeterli buluyor musunuz?",
        options: ["Evet, çok başarılı", "Hayır, daha fazla yapılmalı", "Fikrim yok"]
    },
    {
        question: "Yemekhane menülerinde vegan seçeneklerin artırılması talebini nasıl değerlendiriyorsunuz?",
        options: ["Kesinlikle artırılmalı", "Mevcut durum yeterli", "Gereksiz"]
    },
    {
        question: "Ring seferlerinin sınav haftalarında sıklaştırılması uygulaması verimli oldu mu?",
        options: ["Evet, çok rahatladık", "Hayır, hala yetersiz", "Fark etmedim"]
    },
    {
        question: "Bahar şenliği bütçesinin bu yıl topluluklara daha fazla ayrılmasını destekliyor musunuz?",
        options: ["Evet, topluluklar öncelikli", "Hayır, sanatçılara ayrılmalı", "Dengeli olmalı"]
    }
];

export default function VoiceView() {
    const { user } = useAuth();
    const router = useRouter();
    const [voices, setVoices] = useState<Voice[]>([]);
    const [newStatus, setNewStatus] = useState('');
    // REMOVED: const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [isCommenting, setIsCommenting] = useState(false);

    // Edit & Delete State
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

                // Simply don't update tags if we are filtering, to preserve the "global view"
                if (!activeTagFilter) {
                    // Dynamic Tag Learning & Counting
                    const tagCounts = new Map<string, number>();

                    // Initialize with default tags
                    INITIAL_TAGS.forEach(t => tagCounts.set(t, 0));

                    data.voices.forEach((v: Voice) => {
                        if (v.tags) {
                            v.tags.forEach(t => {
                                const lower = t.toLowerCase();
                                tagCounts.set(lower, (tagCounts.get(lower) || 0) + 1);
                            });
                        }
                    });

                    // Convert to array and sort by count descending
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
        // Split by hashtags including the hashtag in the result
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

            // Extract hashtags from content
            // Matches # followed by alphanumeric characters and Turkish chars
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
                fetchVoices(); // Refresh list
            } else {
                const err = await res.json();
                // Handle 429 specifically if needed, or just show error
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

        // Find the voice and current reaction
        const voice = voices.find(v => v.id === voiceId);
        if (!voice) return;

        const currentReactionObj = voice.reactions.find(r => r.user_id === user.id);
        const currentType = currentReactionObj?.reaction_type || 'neutral';

        // Toggle logic: If clicking same type, remove it (neutral)
        const newType = currentType === targetType ? 'neutral' : targetType;

        // Optimistic update
        const oldVoices = [...voices];
        setVoices(voices.map(v => {
            if (v.id === voiceId) {
                // Remove existing reaction by me if any
                const otherReactions = v.reactions.filter(r => r.user_id !== user.id);

                // Return new state
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
            // We rely on optimistic update
            // fetchVoices();
        } catch (e) {
            setVoices(oldVoices); // Revert
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

        // Analyze text before cursor for hashtag
        const textBeforeCursor = val.slice(0, pos);
        const matches = textBeforeCursor.match(/#([\wçğıöşüÇĞİÖŞÜ]*)$/);

        if (matches) {
            const query = matches[1].toLowerCase(); // Already lowercase query

            let filtered: string[] = [];

            if (query === '') {
                // If just '#', show top popular tags
                filtered = allTags.map(item => item.tag);
            } else {
                // Search matches (startswith or includes)
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

        // Replace partial tag with full tag
        const matches = textBeforeCursor.match(/#([\wçğıöşüÇĞİÖŞÜ]*)$/);
        if (matches) {
            const prefix = textBeforeCursor.slice(0, matches.index);
            const newValue = prefix + tag + ' ' + textAfterCursor;
            setNewStatus(newValue);
            setShowSuggestions(false);
            // Focus back to textarea would be ideal here
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }
    };

    const handleFollow = async (targetUserId: string) => {
        if (!user) return toast.error('Giriş yapmalısınız.');
        if (targetUserId === user.id) return toast.error('Kendinizi takip edemezsiniz.');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch(`/api/users/${targetUserId}/follow`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (res.ok) {
                toast.success('Kullanıcı takip edildi!');
            } else {
                const err = await res.json();
                toast.error(err.error || 'Takip edilemedi');
            }
        } catch (e) {
            console.error(e);
            toast.error('Bir hata oluştu.');
        }
    };

    const handleDelete = async (voiceId: string) => {
        if (!confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) return;

        // Optimistic update
        setVoices(prev => prev.filter(v => v.id !== voiceId));

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch(`/api/voices/${voiceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!res.ok) throw new Error('Delete failed');
            toast.success('Gönderi silindi.');
            // Refresh to update allTags (trending topics)
            fetchVoices();
        } catch (e) {
            console.error(e);
            toast.error('Silme işlemi başarısız.');
            fetchVoices(); // Revert
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
        // Optimistic
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

    // Relative Time Helper
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

    // Real Presence Logic
    const [activeUsers, setActiveUsers] = useState(1);

    useEffect(() => {
        const channel = supabase.channel('room1');

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();

                // 2. Count Unique Devices (Deduplicate by Device ID)
                const uniqueDevices = new Set();
                Object.values(state).forEach((presences: any) => {
                    presences.forEach((p: any) => {
                        if (p.device_id) uniqueDevices.add(p.device_id);
                    });
                });

                setActiveUsers(Math.max(1, uniqueDevices.size));
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Always get or create device ID
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

        return () => {
            channel.unsubscribe();
        };
    }, [user]);

    // Poll Voting State
    const [userVote, setUserVote] = useState<number | null>(null);
    const [pollResults, setPollResults] = useState<number[]>([45, 32, 23]); // Mock initial percentages/counts

    const handlePollVote = async (index: number) => {
        if (!user) {
            toast.error('Oy kullanmak için giriş yapmalısınız.');
            router.push('/login');
            return;
        }

        if (!activePoll) return;

        // Robust poll ID based on question hash/content
        const pollId = activePoll.question.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '_');

        try {
            const { error } = await supabase
                .from('poll_votes')
                .upsert({
                    user_id: user.id,
                    poll_id: pollId,
                    option_index: index
                }, { onConflict: 'user_id, poll_id' });

            if (error) throw error;

            setUserVote(index);
            fetchPollResults(activePoll); // Refresh results from DB
        } catch (e) {
            console.error('Vote Error:', e);
            toast.error('Oylama sırasında bir hata oluştu.');
        }
    };

    const fetchPollResults = async (poll: { question: string, options: string[] }) => {
        const pollId = poll.question.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '_');

        const { data, error } = await supabase
            .from('poll_votes')
            .select('option_index, user_id')
            .eq('poll_id', pollId);

        if (error) {
            console.error('Fetch Results Error:', error);
            return;
        }

        const counts = new Array(poll.options.length).fill(0);
        data.forEach(v => {
            if (v.option_index < counts.length) {
                counts[v.option_index]++;
            }
        });
        setPollResults(counts);

        // Check if current user has voted
        if (user) {
            const myVote = data.find(v => v.user_id === user.id);
            if (myVote) setUserVote(myVote.option_index);
        }
    };

    const totalVotes = pollResults.reduce((a, b) => a + b, 0);

    useEffect(() => {
        // Fetch AI Poll
        const fetchPoll = async () => {
            try {
                const res = await fetch('/api/poll');
                const data = await res.json();
                setActivePoll(data);
                fetchPollResults(data);
            } catch (e) {
                console.error(e);
                setActivePoll({
                    question: "Hata: Anket yüklenemedi.",
                    options: ["..."]
                });
            } finally {
                setPollLoading(false);
            }
        };
        fetchPoll();
    }, [user]);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Newspaper Header - Sticky on mobile */}
            <div className="border-b-4 border-black dark:border-white pb-4 mb-8 text-center transition-colors md:static sticky top-0 z-[9998] bg-neutral-50 dark:bg-[#0a0a0a] pt-4 -mt-4 -mx-4 px-4">
                <h2 className="text-3xl md:text-6xl font-black font-serif uppercase tracking-tight mb-2 text-black dark:text-white">Kampüsün Sesi</h2>
                <div className="flex justify-between items-center text-sm font-medium border-t border-black dark:border-white pt-2 max-w-2xl mx-auto text-neutral-600 dark:text-neutral-400">
                    <span>SAYI: {issueNumber}</span>
                    <span>SERBEST KÜRSÜ</span>
                    <span>{formattedDate.toUpperCase()}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column: Forum / Letters - Shows last on mobile, first on desktop */}
                <div className="lg:col-span-2 space-y-8 order-last lg:order-first">
                    {/* Weekly Poll - Moved above feed */}


                    <div className="flex justify-between items-end border-b-2 border-black dark:border-white pb-2 mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 font-serif dark:text-white">
                            <MessageSquare size={24} />
                            Öğrenci Kürsüsü
                        </h3>
                        {activeTagFilter && (
                            <button
                                onClick={() => setActiveTagFilter(null)}
                                className="text-xs font-black uppercase bg-neutral-900 text-white dark:bg-white dark:text-black px-3 py-1.5 rounded-full flex items-center gap-2 transition-all hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white shadow-sm"
                            >
                                <span>{activeTagFilter}</span>
                                <X size={12} strokeWidth={3} />
                            </button>
                        )}
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

                                {/* Autocomplete Suggestions */}
                                {showSuggestions && (
                                    <div className="absolute left-0 bottom-full mb-1 w-64 bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-lg z-[1000] max-h-48 overflow-y-auto">
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

                                {/* REMOVED OLD TAG SELECTION */}

                                <div className="flex justify-between items-center border-t border-neutral-200 dark:border-neutral-800 pt-3">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-4 h-4 border transition-colors flex items-center justify-center ${isAnonymous ? 'bg-black dark:bg-white border-black dark:border-white' : 'border-neutral-400 group-hover:border-black dark:group-hover:border-white'}`}>
                                            {isAnonymous && <span className="text-white dark:text-black text-[10px]">✓</span>}
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
                            <p className="text-neutral-600 dark:text-neutral-400">Paylaşım yapmak için <Link href="/register" className="underline font-bold text-black dark:text-white">kayıt olmalısın</Link>.</p>
                        </div>
                    )}

                    {/* Posts List */}
                    <div className="space-y-6">
                        {isLoading ? (
                            <div className="text-center py-12 text-neutral-400 animate-pulse">Yükleniyor...</div>
                        ) : voices.length === 0 ? (
                            <div className="text-center py-12 text-neutral-500 italic font-serif">Henüz bir ses yok. İlk sen ol!</div>
                        ) : (
                            voices.map((voice) => {
                                const myReaction = user ? voice.reactions.find(r => r.user_id === user.id)?.reaction_type : null;
                                const likeCount = voice.reactions.filter(r => r.reaction_type === 'like').length;
                                const dislikeCount = voice.reactions.filter(r => r.reaction_type === 'dislike').length;
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
                                            {/* Avatar */}
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-serif shrink-0 border border-neutral-200 dark:border-neutral-800 ${voice.is_anonymous ? 'bg-neutral-800 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-300' : 'text-white bg-primary'}`}
                                                style={!voice.is_anonymous ? { backgroundColor: 'var(--primary-color, #C8102E)' } : undefined}
                                            >
                                                {voice.is_anonymous ? <Ghost size={20} /> : voice.user.full_name?.charAt(0)}
                                            </div>

                                            <div className="flex-1">
                                                {/* Meta */}
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    {voice.is_anonymous ? (
                                                        <span className="font-bold text-neutral-600 dark:text-neutral-400 italic">Rumuzlu Öğrenci</span>
                                                    ) : (
                                                        <Link href={`/profile/${voice.user_id}`} className="font-bold text-neutral-900 dark:text-white hover:underline">
                                                            {voice.user.full_name}
                                                        </Link>
                                                    )}

                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest border-l border-neutral-300 dark:border-neutral-700 pl-2 ml-1">
                                                        {voice.user.department || 'Kampüs'}
                                                    </span>


                                                    {/* 3-Dot Menu (Moved to Top Right) */}
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

                                                                    {/* Owner Options */}
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
                                                                    ) : (
                                                                        <FriendButton
                                                                            targetUserId={voice.user_id}
                                                                            variant="menu-item"
                                                                        />
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                {/* Content - Check if Editing */}
                                                {editingId === voice.id ? (
                                                    <form onSubmit={handleUpdate} className="mb-4">
                                                        <textarea
                                                            className="w-full p-2 border border-black dark:border-white bg-white dark:bg-neutral-800 dark:text-white font-serif rounded-sm"
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

                                                {/* Actions */}
                                                {/* Actions Bar */}
                                                <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-900">
                                                    <div className="flex items-center gap-6">
                                                        {/* Votes */}
                                                        {/* Votes - Group removed to fix hover leak */}
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleReaction(voice.id, 'like'); }}
                                                                className={`p-2 rounded-full transition-all ${myReaction === 'like' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-neutral-400 dark:text-neutral-500 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-500'}`}
                                                                title="Yükselt"
                                                            >
                                                                <ArrowBigUp size={20} className={myReaction === 'like' ? 'fill-current' : ''} />
                                                            </button>

                                                            <span className={`text-sm font-bold w-6 text-center ${netVote > 0 ? 'text-green-600' :
                                                                netVote < 0 ? 'text-red-600' : 'text-neutral-500 dark:text-neutral-400'
                                                                }`}>
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

                                                        {/* Comment */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveCommentBox(activeCommentBox === voice.id ? null : voice.id); }}
                                                            className={`flex items-center gap-2 group transition-colors ${activeCommentBox === voice.id ? 'text-blue-500' : 'text-neutral-400 dark:text-neutral-500 hover:text-blue-500'}`}
                                                        >
                                                            <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                                                                <MessageSquare size={18} />
                                                            </div>
                                                            <span className="text-sm font-medium">{voice.comments.length > 0 ? voice.comments.length : ''}</span>
                                                        </button>

                                                        {/* Share */}
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

                                                {/* Comments Area - Full Width */}
                                                {(activeCommentBox === voice.id || (voice.comments.length > 0 && activeCommentBox === voice.id)) && (
                                                    <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-900 w-full animate-in slide-in-from-top-2">
                                                        {/* Comment List */}
                                                        <div className="space-y-4 mb-4">
                                                            {voice.comments.map(comment => (
                                                                <div key={comment.id} className="flex gap-3">
                                                                    {/* Avatar Placeholder for Commenter */}
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
                    <div className="flex flex-row flex-nowrap gap-4 overflow-x-auto pb-4 lg:pb-0 lg:flex-col lg:overflow-x-visible lg:gap-8 lg:pr-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'thin' }}>
                        {/* Weekly Poll */}
                        <div className="border-4 border-black dark:border-white p-4 bg-white dark:bg-neutral-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-colors shrink-0 min-w-[280px] lg:min-w-0 snap-center">
                            <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-2 mb-3">
                                <h3 className="text-base font-bold font-serif uppercase tracking-tight dark:text-white">
                                    Haftanın Anketi
                                </h3>
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 rounded-sm flex items-center gap-1">
                                    <span
                                        className="w-2 h-2 rounded-full animate-pulse"
                                        style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}
                                    ></span>
                                    Yapay Zeka
                                </span>
                            </div>

                            {pollLoading ? (
                                <div className="text-center py-4 text-xs text-neutral-400 animate-pulse">Yapay zeka anket hazırlıyor...</div>
                            ) : (
                                <>
                                    <h4 className="font-bold text-sm mb-3 font-serif leading-tight dark:text-white">
                                        "{activePoll?.question}"
                                    </h4>

                                    <div className="space-y-2">
                                        {activePoll?.options.map((option, idx) => {
                                            const percentage = totalVotes === 0 ? 0 : Math.round((pollResults[idx] / totalVotes) * 100);
                                            const isSelected = userVote === idx;
                                            const showResults = userVote !== null;

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handlePollVote(idx)}
                                                    className={`w-full text-left relative border-2 transition-all font-bold group overflow-hidden ${isSelected
                                                        ? 'border-black dark:border-white bg-neutral-50 dark:bg-neutral-800'
                                                        : 'border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white'
                                                        }`}
                                                >
                                                    {showResults && (
                                                        <div
                                                            className="absolute top-0 left-0 h-full bg-neutral-100 dark:bg-neutral-800 transition-all duration-500 ease-out"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    )}

                                                    <div className="relative p-3 flex justify-between items-center z-10 font-bold">
                                                        <span className={isSelected ? 'text-black dark:text-white' : 'text-neutral-800 dark:text-neutral-200 group-hover:text-black dark:group-hover:text-white transition-colors'}>
                                                            {option}
                                                        </span>
                                                        {showResults && <span className="text-sm font-black dark:text-white">{percentage}%</span>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {userVote !== null && <div className="text-center mt-3 text-xs text-neutral-500 dark:text-neutral-400 font-medium">{totalVotes} oy kullanıldı</div>}
                                </>
                            )}
                        </div>

                        {/* Trending Topics */}
                        <div className="border-4 border-black dark:border-white p-6 bg-white dark:bg-neutral-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] transition-colors shrink-0 min-w-[280px] lg:min-w-0 snap-center">
                            <h3 className="text-xl font-bold border-b-2 border-black dark:border-white pb-2 mb-4 font-serif uppercase tracking-tight flex items-center gap-2 dark:text-white">
                                <TrendingUp size={24} style={{ color: 'var(--primary-color, #C8102E)' }} />
                                Kampüste Gündem
                            </h3>
                            <div className="space-y-3">
                                {allTags.length > 0 ? (
                                    allTags.slice(0, 5).map((topic, index) => (
                                        <div key={topic.tag} onClick={() => setActiveTagFilter(topic.tag === activeTagFilter ? null : topic.tag)} className={`flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-lg transition-colors border-b border-neutral-100 dark:border-neutral-800 last:border-0 ${activeTagFilter === topic.tag ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl font-serif font-black text-neutral-300 dark:text-neutral-700 w-6">{index + 1}</span>
                                                <div className="flex flex-col">
                                                    <span className={`font-bold transition-colors font-serif ${activeTagFilter === topic.tag ? 'text-primary' : 'text-neutral-900 dark:text-white group-hover:text-primary'}`}>
                                                        {topic.tag.startsWith('#') ? topic.tag : `#${topic.tag}`}
                                                    </span>
                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{topic.count} gönderi</span>
                                                </div>
                                            </div>
                                            <ArrowRight size={16} className={`transition-transform ${activeTagFilter === topic.tag ? 'opacity-100 text-primary' : 'text-black dark:text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1'}`} />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-neutral-400 text-sm italic">
                                        Henüz gündem oluşmadı.
                                    </div>
                                )}
                            </div>
                        </div>


                        <div className="border-4 border-black dark:border-white p-6 bg-white dark:bg-neutral-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] transition-colors shrink-0 min-w-[280px] lg:min-w-0 snap-center">
                            <h3 className="text-xl font-bold border-b-2 border-black dark:border-white pb-2 mb-4 font-serif uppercase tracking-tight text-center dark:text-white">
                                Kampüs Nabzı
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div
                                    className="p-3 dark:bg-neutral-800 rounded"
                                    style={{
                                        backgroundColor: 'rgba(var(--primary-rgb), 0.05)',
                                        border: '1px solid var(--primary-color, #C8102E)'
                                    }}
                                >
                                    <span
                                        className="block text-3xl font-black font-serif animate-pulse"
                                        style={{ color: 'var(--primary-color, #C8102E)' }}
                                    >
                                        {activeUsers}
                                    </span>
                                    <span className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400">
                                        Aktif Öğrenci
                                    </span>
                                </div>
                                <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                                    <span className="block text-3xl font-black font-serif text-black dark:text-white">
                                        {issueNumber}
                                    </span>
                                    <span className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400">
                                        Gündem Sayısı
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

