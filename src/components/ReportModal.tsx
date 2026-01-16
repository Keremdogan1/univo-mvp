'use client';

import { useState } from 'react';
import { X, AlertTriangle, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { REPORT_CATEGORIES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    contentType: 'post' | 'comment';
    contentId: string;
    contentPreview?: string;
}

export default function ReportModal({ isOpen, onClose, contentType, contentId, contentPreview }: ReportModalProps) {
    const { user } = useAuth();
    const [category, setCategory] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!user) {
            toast.error('Şikayet göndermek için giriş yapmalısınız.');
            return;
        }
        if (!category) {
            toast.error('Lütfen bir kategori seçin.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentType,
                    contentId,
                    category,
                    reason
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Şikayet gönderilemedi.');
            }

            toast.success('Şikayetiniz alındı. İncelenecektir.');
            onClose();
            setCategory('');
            setReason('');
        } catch (err: any) {
            toast.error(err.message || 'Bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-200 dark:border-neutral-700 animate-in zoom-in-95">
                {/* Header */}
                <div className="p-4 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-orange-600 dark:text-orange-400">
                        <Flag size={20} />
                        İçeriği Şikayet Et
                    </h3>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Content Preview */}
                    {contentPreview && (
                        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3">
                            <div className="text-xs font-bold uppercase text-neutral-500 mb-1">
                                {contentType === 'post' ? 'Gönderi' : 'Yorum'}
                            </div>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">{contentPreview}</p>
                        </div>
                    )}

                    {/* Category Selection */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Şikayet Sebebi</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full p-3 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                        >
                            <option value="">Kategori seçin...</option>
                            {REPORT_CATEGORIES.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </select>
                        {category && (
                            <p className="text-xs text-neutral-400 mt-1">
                                {REPORT_CATEGORIES.find(c => c.id === category)?.description}
                            </p>
                        )}
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Ek Açıklama (Opsiyonel)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full h-20 p-3 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none dark:text-white"
                            placeholder="Detay eklemek isterseniz..."
                        ></textarea>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !category}
                        className="px-4 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors shadow-lg shadow-orange-600/20 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Gönderiliyor...' : 'Şikayet Gönder'}
                    </button>
                </div>
            </div>
        </div>
    );
}
