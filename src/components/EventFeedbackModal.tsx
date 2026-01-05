import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface EventFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    eventTitle: string;
}

export default function EventFeedbackModal({ isOpen, onClose, eventId, eventTitle }: EventFeedbackModalProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return alert('Lütfen bir puan verin');

        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return alert('Oturum hatası');

            const res = await fetch(`/api/events/${eventId}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ rating, comment })
            });

            if (res.ok) {
                alert('Geri bildiriminiz için teşekkürler!');
                onClose();
            } else {
                alert('Bir hata oluştu.');
            }
        } catch (error) {
            console.error(error);
            alert('Gönderilemedi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-6 relative">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 hover:bg-neutral-100 p-1 rounded-full text-black transition-colors"
                >
                    <X size={24} />
                </button>

                <h3 className="text-2xl font-black font-serif uppercase mb-2 pr-8">Etkinliği Değerlendir</h3>
                <p className="text-neutral-600 mb-6 font-medium font-serif">"{eventTitle}" etkinliğini nasıl buldun?</p>

                <form onSubmit={handleSubmit}>
                    {/* Stars */}
                    <div className="flex justify-center gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star 
                                    size={32} 
                                    className={`${(hoverRating || rating) >= star ? 'fill-yellow-400 text-black' : 'text-neutral-300'} transition-colors`}
                                    strokeWidth={2}
                                />
                            </button>
                        ))}
                    </div>

                    <textarea
                        rows={3}
                        placeholder="Düşüncelerini paylaş... (İsteğe bağlı)"
                        className="w-full p-3 border-2 border-neutral-200 focus:border-black focus:outline-none font-serif mb-4 text-sm"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-black text-white font-bold uppercase py-3 hover:bg-neutral-800 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? 'Gönderiliyor...' : 'Değerlendir'}
                    </button>
                </form>
            </div>
        </div>
    );
}
