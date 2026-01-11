'use client';

import { TrendingUp, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface VoiceStatsWidgetProps {
    activePoll: { question: string, options: string[] } | null;
    pollLoading: boolean;
    pollResults: number[];
    totalVotes: number;
    userVote: number | null;
    onPollVote: (index: number) => void;
    allTags: { tag: string, count: number }[];
    activeTagFilter: string | null;
    onTagFilterChange: (tag: string | null) => void;
    activeUsers: number;
    issueNumber: number;
    onVotersClick: () => void;
}

export default function VoiceStatsWidget({
    activePoll,
    pollLoading,
    pollResults,
    totalVotes,
    userVote,
    onPollVote,
    allTags,
    activeTagFilter,
    onTagFilterChange,
    activeUsers,
    issueNumber,
    onVotersClick
}: VoiceStatsWidgetProps) {
    const { user } = useAuth(); // Needed for poll "Yapay Zeka" badge pulsing if we want, or simple rendering

    return (
        <div
            className="md:hidden mb-6 p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] border-2 transition-colors duration-300"
            style={{
                borderColor: 'var(--primary-color, #C8102E)',
                backgroundColor: 'rgba(var(--primary-rgb), 0.03)'
            }}
        >
            <div className="flex flex-row flex-nowrap items-start gap-4 overflow-x-auto p-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                {/* Weekly Poll */}
                <div className="border-4 border-black dark:border-neutral-600 p-4 bg-neutral-50 dark:bg-black/50 transition-colors shrink-0 w-[80vw] snap-center rounded-xl" style={{ scrollSnapStop: 'always' }}>
                    <div className="flex items-center justify-between border-b-2 border-black dark:border-neutral-600 pb-2 mb-3">
                        <h3 className="text-base font-bold font-serif uppercase tracking-tight dark:text-white">
                            Haftan─▒n Anketi
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
                        <div className="text-center py-4 text-xs text-neutral-400 animate-pulse">Yapay zeka anket haz─▒rl─▒yor...</div>
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
                                            onClick={() => onPollVote(idx)}
                                            className={`w-full text-left relative border-2 transition-all font-bold group overflow-hidden ${isSelected
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
                            {userVote !== null && (
                                <button 
                                    onClick={onVotersClick}
                                    className="w-full text-center mt-3 text-xs text-neutral-500 dark:text-neutral-400 font-medium font-serif hover:text-primary hover:underline transition-colors"
                                >
                                    {totalVotes} oy kullan─▒ld─▒
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Trending Topics */}
                <div className="border-4 border-black dark:border-neutral-600 p-6 bg-neutral-50 dark:bg-black/50 transition-colors shrink-0 w-[80vw] snap-center rounded-xl" style={{ scrollSnapStop: 'always' }}>
                    <h3 className="text-xl font-bold border-b-2 border-black dark:border-neutral-600 pb-2 mb-4 font-serif uppercase tracking-tight flex items-center gap-2 dark:text-white">
                        <TrendingUp size={24} style={{ color: 'var(--primary-color, #C8102E)' }} />
                        Kamp├╝ste G├╝ndem
                    </h3>
                    <div className="space-y-3">
                        {allTags.length > 0 ? (
                            allTags.slice(0, 5).map((topic, index) => (
                                <div key={topic.tag} onClick={() => onTagFilterChange(topic.tag === activeTagFilter ? null : topic.tag)} className={`flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-lg transition-colors border-b border-neutral-200 dark:border-neutral-700 last:border-0 ${activeTagFilter === topic.tag ? 'bg-white dark:bg-neutral-800 shadow-sm' : 'hover:bg-white dark:hover:bg-neutral-800'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl font-serif font-black text-neutral-400 dark:text-neutral-600 w-6">{index + 1}</span>
                                        <div className="flex flex-col">
                                            <span className={`font-bold transition-colors font-serif ${activeTagFilter === topic.tag ? 'text-primary' : 'text-neutral-900 dark:text-white group-hover:text-primary'}`}>
                                                {topic.tag.startsWith('#') ? topic.tag : `#${topic.tag}`}
                                            </span>
                                            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{topic.count} g├Ânderi</span>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className={`transition-transform ${activeTagFilter === topic.tag ? 'opacity-100 text-primary' : 'text-black dark:text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1'}`} />
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-neutral-400 text-sm italic">
                                Hen├╝z g├╝ndem olu┼şmad─▒.
                            </div>
                        )}
                    </div>
                </div>

                {/* Campus Pulse */}
                <div className="border-4 border-black dark:border-neutral-600 p-6 bg-neutral-50 dark:bg-black/50 transition-colors shrink-0 w-[80vw] snap-center rounded-xl" style={{ scrollSnapStop: 'always' }}>
                    <h3 className="text-xl font-bold border-b-2 border-black dark:border-neutral-600 pb-2 mb-4 font-serif uppercase tracking-tight text-center dark:text-white">
                        Kamp├╝s Nabz─▒
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div
                            className="p-3 bg-white dark:bg-neutral-900 rounded"
                            style={{
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
                                Aktif ├û─şrenci
                            </span>
                        </div>
                        <div className="p-3 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700">
                            <span className="block text-3xl font-black font-serif text-black dark:text-white">
                                {issueNumber}
                            </span>
                            <span className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400">
                                G├╝ndem Say─▒s─▒
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="text-center pb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                G├╝ndem ├ûzeti
            </div>
        </div>
    );
}
