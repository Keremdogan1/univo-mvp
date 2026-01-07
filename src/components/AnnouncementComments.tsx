'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Send, User } from 'lucide-react';

export default function AnnouncementComments({ announcementId }: { announcementId: string }) {
    const { user, profile } = useAuth();
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [announcementId]);

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('announcement_comments')
            .select('*, profiles(full_name, avatar_url, department)')
            .eq('announcement_id', announcementId)
            .order('created_at', { ascending: false });
        
        if (data) setComments(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        setSubmitting(true);
        const { error } = await supabase
            .from('announcement_comments')
            .insert({
                announcement_id: announcementId,
                user_id: user.id,
                content: newComment.trim()
            });

        if (!error) {
            setNewComment('');
            fetchComments(); // Refresh
        } else {
            alert('Yorum gönderilemedi.');
        }
        setSubmitting(false);
    };

    return (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-bold uppercase mb-6 flex items-center gap-2 border-b border-neutral-200 pb-2">
                <MessageSquare size={24} />
                Öğrenci Görüşleri
            </h3>

            {/* Comment List */}
            <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="text-neutral-500 text-sm">Yükleniyor...</div>
                ) : comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 items-start group">
                            {comment.profiles?.avatar_url ? (
                                <img 
                                    src={comment.profiles.avatar_url} 
                                    alt="avatar" 
                                    className="w-8 h-8 rounded-full border border-neutral-200 mt-1 object-cover"
                                />
                            ) : (
                                <div 
                                    className="w-8 h-8 rounded-full border border-neutral-200 mt-1 bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0"
                                    style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}
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
                                {comment.profiles?.department && (
                                    <span className="text-[10px] text-neutral-400 ml-1 mt-1 block uppercase font-bold tracking-wider">
                                        {comment.profiles.department}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 bg-neutral-50 rounded border border-dashed border-neutral-300">
                        <p className="text-neutral-500 text-sm font-medium">Henüz bir görüş paylaşılmamış.</p>
                        <p className="text-xs text-neutral-400">İlk yorumu sen yap!</p>
                    </div>
                )}
            </div>

            {/* Comment Form */}
            {user ? (
                <form onSubmit={handleSubmit} className="relative">
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
