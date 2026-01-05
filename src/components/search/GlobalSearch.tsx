
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Calendar, MessageSquare, Building2, Loader2, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchContent, SearchResults } from '@/app/actions/search';

export default function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Debounce Logic
  useEffect(() => {
    const timer = setTimeout(() => {
        if (query.trim().length > 1) {
            performSearch(query);
        } else {
            setResults(null);
        }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
        const data = await searchContent(searchQuery);
        setResults(data);
    } catch (error) {
        console.error('Search failed:', error);
    } finally {
        setLoading(false);
    }
  };

  const handleSelect = (path: string) => {
      router.push(path);
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header / Input */}
        <div className="flex items-center px-4 py-4 border-b border-neutral-100 gap-3">
            <Search className="text-neutral-400" size={20} />
            <input
                ref={inputRef}
                type="text"
                placeholder="Kampüste ara... (Etkinlik, Duyuru, Gönderi)"
                className="flex-1 text-lg outline-none placeholder:text-neutral-400 text-neutral-900 bg-transparent"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
                <button onClick={() => setQuery('')} className="p-1 hover:bg-neutral-100 rounded-full text-neutral-400">
                    <X size={18} />
                </button>
            )}
            <button onClick={onClose} className="px-2 py-1 text-xs font-medium text-neutral-500 border border-neutral-200 rounded hover:bg-neutral-50">
                ESC
            </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2 bg-neutral-50/50">
            
            {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-neutral-400 gap-3">
                    <Loader2 size={32} className="animate-spin text-[#C8102E]" />
                    <span className="text-sm font-medium">Aranıyor...</span>
                </div>
            ) : !query ? (
                <div className="py-12 text-center text-neutral-400">
                    <Search size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm">Aramaya başlamak için yazın.</p>
                </div>
            ) : results && (results.events.length === 0 && results.voices.length === 0 && results.announcements.length === 0) ? (
                <div className="py-12 text-center text-neutral-500">
                    <p>"{query}" için sonuç bulunamadı.</p>
                </div>
            ) : results ? (
                <div className="space-y-4 p-2">
                    {/* Events Section */}
                    {results.events.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest px-2">Etkinlikler</h3>
                            {results.events.map((event: any) => (
                                <button 
                                    key={event.id}
                                    onClick={() => handleSelect(`/events/${event.id}`)}
                                    className="w-full flex items-center gap-4 p-3 bg-white rounded-lg border border-neutral-200 hover:border-[#C8102E] hover:shadow-sm transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-[#C8102E] group-hover:scale-110 transition-transform">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-neutral-900 truncate">{event.title}</h4>
                                        <p className="text-xs text-neutral-500 flex items-center gap-1.5 truncate">
                                            <span>{new Date(event.date).toLocaleDateString()}</span>
                                            <span>·</span>
                                            <span>{event.location}</span>
                                        </p>
                                    </div>
                                    <ChevronRight size={16} className="text-neutral-300 group-hover:text-[#C8102E]" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Voices Section */}
                    {results.voices.length > 0 && (
                        <div className="space-y-2">
                             <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest px-2">Kampüsün Sesi</h3>
                             {results.voices.map((voice: any) => (
                                <button 
                                    key={voice.id}
                                    onClick={() => handleSelect(`/?view=voice`)} // Currently deep link to voice doesn't exist, going to feed
                                    className="w-full flex items-center gap-4 p-3 bg-white rounded-lg border border-neutral-200 hover:border-blue-500 hover:shadow-sm transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-neutral-900 line-clamp-2 text-sm">"{voice.content}"</p>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {new Date(voice.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <ChevronRight size={16} className="text-neutral-300 group-hover:text-blue-500" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : null}
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 px-4 py-2 border-t border-neutral-100 flex justify-between items-center text-xs text-neutral-500">
            <div className="flex gap-4">
                <span className="flex items-center gap-1"><kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-neutral-200">↑↓</kbd> Gezin</span>
                <span className="flex items-center gap-1"><kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-neutral-200">↵</kbd> Seç</span>
            </div>
            <span>Univo Global Search</span>
        </div>
      </div>
    </div>
  );
}
