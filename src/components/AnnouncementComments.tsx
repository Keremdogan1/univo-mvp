'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Send, User, ArrowBigUp, ArrowBigDown, Share2 } from 'lucide-react';

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    announcement_id: string;
    parent_id: string | null;
    profiles: {
        full_name: string;
        avatar_url: string;
        department: string;
    };
    reactions?: { count: number }; 
    user_reaction?: string | null; // 'like', 'dislike', or null
}

interface CommentNode extends Comment {
    children: CommentNode[];
}

export default function AnnouncementComments({ announcementId }: { announcementId: string }) {
    const { user, profile } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    useEffect(() => {
        if (user) fetchComments();
    }, [announcementId, user]); // Refetch when user changes to get correct user_reaction

    const fetchComments = async () => {
        // 1. Fetch comments
        const { data: commentsData, error } = await supabase
            .from('announcement_comments')
            .select('*, profiles(full_name, avatar_url, department)')
            .eq('announcement_id', announcementId)
            .order('created_at', { ascending: true });
        
        if (!commentsData) return setLoading(false);

        // 2. Fetch reactions manually for now as supabase join with aggregation can be tricky in one go without complex views
        // We will fetch all reactions for these comments to map them efficiently
        const commentIds = commentsData.map(c => c.id);
        
        const { data: reactionsData } = await supabase
            .from('announcement_comment_reactions')
            .select('comment_id, reaction_type, user_id')
            .in('comment_id', commentIds);

        // 3. Map reactions to comments
        const commentsWithReactions = commentsData.map(comment => {
            const commentReactions = reactionsData?.filter(r => r.comment_id === comment.id) || [];
            const likes = commentReactions.filter(r => r.reaction_type === 'like').length;
            const dislikes = commentReactions.filter(r => r.reaction_type === 'dislike').length;
            const userReaction = user ? commentReactions.find(r => r.user_id === user.id)?.reaction_type : null;

            return {
                ...comment,
                reactions: { count: likes - dislikes }, // Simplified score or just show likes? Let's do simple net score for now, or just separate if requested. User said "post features", posts usually have likes.
                user_reaction: userReaction
            };
        });
        
        setComments(commentsWithReactions);
        setLoading(false);
    };

    const handleReaction = async (commentId: string, type: 'like' | 'dislike') => {
        if (!user) return;

        // Optimistic update
        setComments(prev => prev.map(c => {
            if (c.id !== commentId) return c;
            
            const currentReaction = c.user_reaction;
            let newScore = (c.reactions?.count || 0);

            if (currentReaction === type) {
                // Toggle off
                newScore -= (type === 'like' ? 1 : -1);
                return { ...c, user_reaction: null, reactions: { count: newScore } };
            } else {
                // Toggle on or switch
                if (currentReaction) {
                   // Remove old effect
                   newScore -= (currentReaction === 'like' ? 1 : -1);
                }
                // Add new effect
                newScore += (type === 'like' ? 1 : -1);
                return { ...c, user_reaction: type, reactions: { count: newScore } };
            }
        }));

        const { data: existingReaction } = await supabase
            .from('announcement_comment_reactions')
            .select('id, reaction_type')
            .eq('comment_id', commentId)
            .eq('user_id', user.id)
            .single();

        if (existingReaction) {
            if (existingReaction.reaction_type === type) {
                // Delete
                await supabase.from('announcement_comment_reactions').delete().eq('id', existingReaction.id);
            } else {
                // Update
                await supabase.from('announcement_comment_reactions').update({ reaction_type: type }).eq('id', existingReaction.id);
            }
        } else {
            // Insert
            await supabase.from('announcement_comment_reactions').insert({
                comment_id: commentId,
                user_id: user.id,
                reaction_type: type
            });
        }
        
        // Eventually consistency - simplified, maybe don't refetch immediately to keep UI smooth with optimistic update
        // fetchComments(); 
    };

    const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
        e.preventDefault();
        const content = parentId ? replyContent : newComment;
        
        if (!content.trim() || !user) return;

        setSubmitting(true);
        const { error } = await supabase
            .from('announcement_comments')
            .insert({
                announcement_id: announcementId,
                user_id: user.id,
                content: content.trim(),
                parent_id: parentId
            });

        if (!error) {
            if (parentId) {
                setReplyContent('');
                setReplyingTo(null);
            } else {
                setNewComment('');
            }
            fetchComments();
        } else {
            alert('Yorum gönderilemedi.');
        }
        setSubmitting(false);
    };

    // Helper to build comment tree
    const buildCommentTree = (flatComments: Comment[]) => {
        const commentMap: { [key: string]: CommentNode } = {};
        const roots: CommentNode[] = [];

        // First pass: create map nodes
        flatComments.forEach(c => {
            commentMap[c.id] = { ...c, children: [] };
        });

        // Second pass: link children to parents
        flatComments.forEach(c => {
            if (c.parent_id && commentMap[c.parent_id]) {
                commentMap[c.parent_id].children.push(commentMap[c.id]);
            } else {
                roots.push(commentMap[c.id]);
            }
        });

        // Sort roots by newest first (optional, but good for top level)
        return roots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    };

    const CommentItem = ({ comment, depth = 0 }: { comment: CommentNode, depth?: number }) => {
        const isReplying = replyingTo === comment.id;
        
        return (
            <div className={`flex flex-col ${depth > 0 ? 'ml-8 mt-4 border-l-2 border-neutral-100 pl-4' : ''}`}>
                <div className="flex gap-3 items-start group">
                    {(comment.profiles?.avatar_url || (comment.user_id === user?.id && user?.user_metadata?.avatar_url)) ? (
                        <img 
                            src={comment.profiles?.avatar_url || (comment.user_id === user?.id ? user?.user_metadata?.avatar_url : null)} 
                            alt="avatar" 
                            className="w-8 h-8 rounded-full border border-neutral-200 mt-1 object-cover"
                        />
                    ) : (
                        <div 
                            className="w-8 h-8 rounded-full border border-neutral-200 mt-1 text-white flex items-center justify-center font-bold text-xs shrink-0"
                            style={{ 
                                backgroundColor: 'var(--primary-color)'
                            }}
                        >
                            {(comment.profiles?.full_name || 'U').charAt(0)}
                        </div>
                    )}
                    <div className="flex-1">
                        <div className="bg-neutral-50 p-3 rounded-lg rounded-tl-none border border-neutral-100 group-hover:border-neutral-300 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-sm text-neutral-900">{comment.profiles?.full_name}</span>
                                <span className="text-[10px] text-neutral-400">
                                    {new Date(comment.created_at).toLocaleDateString('tr-TR')}
                                </span>
                            </div>
                            <p className="text-neutral-700 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-1 ml-1">
                            {comment.profiles?.department && (
                                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                                    {comment.profiles.department}
                                </span>
                            )}
                        </div>

                        {/* Actions: Reply & Like/Dislike */}
{/* Actions: Reply & Like/Dislike */}
                        <div className="flex items-center justify-between pt-2 mt-2">
                            <div className="flex items-center gap-4">
                                {/* Reactions */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleReaction(comment.id, 'like')}
                                        className={`p-1 rounded-full transition-all ${comment.user_reaction === 'like' ? 'text-green-600 bg-green-50' : 'text-neutral-400 hover:bg-green-50 hover:text-green-500'}`}
                                        title="Yükselt"
                                    >
                                        <ArrowBigUp size={20} className={comment.user_reaction === 'like' ? 'fill-current' : ''} />
                                    </button>
                                    <span className={`text-sm font-bold min-w-[1.5rem] text-center ${
                                        (comment.reactions?.count || 0) > 0 ? 'text-green-600' : 
                                        (comment.reactions?.count || 0) < 0 ? 'text-red-600' : 'text-neutral-500'
                                    }`}>
                                        {comment.reactions?.count || 0}
                                    </span>
                                    <button
                                        onClick={() => handleReaction(comment.id, 'dislike')}
                                        className={`p-1 rounded-full transition-all ${comment.user_reaction === 'dislike' ? 'text-red-600 bg-red-50' : 'text-neutral-400 hover:bg-red-50 hover:text-red-500'}`}
                                        title="Düşür"
                                    >
                                        <ArrowBigUp size={20} className={`rotate-180 ${comment.user_reaction === 'dislike' ? 'fill-current' : ''}`} />
                                    </button>
                                </div>

                                {user && (
                                    <button 
                                        onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                                        className={`flex items-center gap-2 group transition-colors ${isReplying ? 'text-blue-500' : 'text-neutral-400 hover:text-blue-500'}`}
                                    >
                                        <div className="p-1 rounded-full group-hover:bg-blue-50">
                                            <MessageSquare size={18} />
                                        </div>
                                    </button>
                                )}
                                
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/announcement/${announcementId}#comment-${comment.id}`);
                                        // toast.success('Link kopyalandı!') // If toast was available in this component context, otherwise just rely on browser or add local state
                                        alert('Link kopyalandı!');
                                    }}
                                    className="flex items-center gap-2 group text-neutral-400 hover:text-green-500 transition-colors"
                                    title="Paylaş"
                                >
                                    <div className="p-1 rounded-full group-hover:bg-green-50">
                                        <Share2 size={18} />
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Reply Form */}
                        {isReplying && (
                            <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
                                <input
                                    autoFocus
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder={`@${comment.profiles?.full_name} kişisine yanıt ver...`}
                                    className="flex-1 p-2 text-sm border-2 border-neutral-200 focus:border-black rounded-lg outline-none bg-white"
                                />
                                <button 
                                    type="submit"
                                    disabled={submitting || !replyContent.trim()}
                                    className="bg-black text-white p-2 rounded-lg hover:bg-neutral-800 disabled:opacity-50"
                                >
                                    <Send size={14} />
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Nested Comments */}
                {comment.children.length > 0 && (
                    <div className="mt-2">
                        {comment.children.map(child => (
                            <CommentItem key={child.id} comment={child} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const rootComments = buildCommentTree(comments);

    return (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-bold uppercase mb-6 flex items-center gap-2 border-b border-neutral-200 pb-2">
                <MessageSquare size={24} />
                Öğrenci Görüşleri
            </h3>

            {/* Comment List */}
            {loading ? (
                 <div className="text-center py-8">
                     <span className="text-neutral-500 text-sm">Yükleniyor...</span>
                 </div>
            ) : !user ? (
                 <div className="bg-neutral-50 border border-dashed border-neutral-300 rounded p-6 text-center mb-6">
                     <p className="text-neutral-600 mb-2">Yorumları görmek ve paylaşmak için giriş yapmalısınız.</p>
                     <a href="/login" className="text-sm font-bold text-[var(--primary-color)] hover:underline uppercase">Giriş Yap</a>
                 </div>
            ) : (
                <div className="space-y-6 mb-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {rootComments.length > 0 ? (
                        rootComments.map((comment) => (
                            <CommentItem key={comment.id} comment={comment} />
                        ))
                    ) : (
                        <div className="text-center py-8 bg-neutral-50 rounded border border-dashed border-neutral-300">
                            <p className="text-neutral-500 text-sm font-medium">Henüz bir görüş paylaşılmamış.</p>
                            <p className="text-xs text-neutral-400 mt-1">İlk yorumu sen yap!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Root Comment Form */}
            {user ? (
                <form onSubmit={(e) => handleSubmit(e)} className="relative">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Bu konu hakkındaki düşüncelerin..."
                        className="w-full p-4 pr-12 border-2 border-neutral-200 focus:border-black focus:outline-none rounded-lg resize-none min-h-[100px] text-sm"
                        maxLength={500}
                    />
                    <button 
                        type="submit"
                        disabled={submitting || !newComment.trim()}
                        className="absolute bottom-4 right-4 bg-black text-white p-2 rounded-full hover:bg-[#C8102E] transition-colors disabled:opacity-50 disabled:hover:bg-black"
                    >
                        <Send size={16} />
                    </button>
                    <div className="text-[10px] text-neutral-400 text-right mt-1 px-1">
                        {newComment.length}/500
                    </div>
                </form>
            ) : (
                <div className="bg-neutral-100 p-4 text-center rounded text-sm text-neutral-600 font-medium">
                    Yorum yapmak için giriş yapmalısınız.
                </div>
            )}
        </div>
    );
}
