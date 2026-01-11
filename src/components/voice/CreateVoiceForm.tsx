'use client';

import React from 'react';
import { MessageSquare, Tag, Send } from 'lucide-react';
import Link from 'next/link';

interface CreateVoiceFormProps {
    user: any;
    handlePost: (e: React.FormEvent) => void;
    newStatus: string;
    handleTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    setCursorPos: (pos: number) => void;
    showSuggestions: boolean;
    suggestionList: string[];
    insertTag: (tag: string) => void;
    isAnonymous: boolean;
    setIsAnonymous: (val: boolean) => void;
    isPosting: boolean;
    activeTagFilter: string | null;
    setActiveTagFilter: (val: string | null) => void;
}

export default function CreateVoiceForm({
    user,
    handlePost,
    newStatus,
    handleTextChange,
    textareaRef,
    setCursorPos,
    showSuggestions,
    suggestionList,
    insertTag,
    isAnonymous,
    setIsAnonymous,
    isPosting,
    activeTagFilter // Used only for potentially clearing filter if needed, or context
}: CreateVoiceFormProps) {
    if (!user) {
        return (
            <div className="bg-neutral-100 dark:bg-neutral-900 p-6 text-center border border-neutral-200 dark:border-neutral-800 mb-8">
                <p className="text-neutral-600 dark:text-neutral-400">Paylaşım yapmak için <Link href="/login" className="underline font-bold text-black dark:text-white">giriş yapmalısın</Link>.</p>
            </div>
        );
    }

    return (
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
    );
};
