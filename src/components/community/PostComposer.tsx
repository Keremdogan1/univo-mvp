'use client';

import { useState } from 'react';
import { createPost } from '@/app/actions/community-chat';
import { Loader2, Send, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PostComposerProps {
    communityId: string;
    onPostCreated?: () => void;
    isAnnouncement?: boolean;
}

export default function PostComposer({ communityId, onPostCreated, isAnnouncement = false }: PostComposerProps) {
    const [content, setContent] = useState('');
    const [isAnnouncementPost, setIsAnnouncementPost] = useState(false);
    const [mediaUrl, setMediaUrl] = useState(''); // Placeholder for future media implementation
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            const result = await createPost(communityId, content, mediaUrl || undefined, isAnnouncementPost);
            
            if (result.success) {
                setContent('');
                setMediaUrl('');
                setIsAnnouncementPost(false);
                toast.success(isAnnouncementPost ? 'Duyuru paylaşıldı' : 'Gönderi paylaşıldı');
                if (onPostCreated) onPostCreated();
            } else {
                toast.error(result.message || 'Paylaşım yapılamadı');
            }
        } catch (error) {
            console.error(error);
            toast.error('Paylaşım yapılırken bir hata oluştu');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={isAnnouncement ? "Bir duyuru paylaş..." : "Toplulukla bir şeyler paylaş..."}
                        className="w-full bg-transparent border-none focus:ring-0 resize-none min-h-[80px] text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 font-serif"
                        disabled={isSubmitting}
                    />
                </div>

                <div className="flex justify-between items-center border-t-2 border-neutral-200 dark:border-neutral-700 pt-3">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="Resim ekle (Yakında)"
                            disabled
                        >
                            <ImageIcon size={20} />
                        </button>

                        {isAnnouncement && (
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={isAnnouncementPost}
                                    onChange={(e) => setIsAnnouncementPost(e.target.checked)}
                                    className="w-4 h-4 rounded border-black dark:border-neutral-700 text-black dark:text-white focus:ring-0 focus:ring-offset-0"
                                />
                                <span className="text-xs font-bold font-serif text-neutral-600 dark:text-neutral-400">Duyuru Olarak Paylaş</span>
                            </label>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!content.trim() || isSubmitting}
                        className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Paylaşılıyor...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Paylaş
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
