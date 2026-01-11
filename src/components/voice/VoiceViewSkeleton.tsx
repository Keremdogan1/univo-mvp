'use client';

import SkeletonLoader from '../ui/SkeletonLoader';

export default function VoiceViewSkeleton() {
    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <SkeletonLoader width="150px" height="32px" />
                <div className="flex gap-2">
                    <SkeletonLoader width="80px" height="32px" borderRadius="9999px" />
                    <SkeletonLoader width="80px" height="32px" borderRadius="9999px" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Input Area Skeleton */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-6 border border-neutral-200 dark:border-neutral-800 rounded-sm mb-8">
                        <SkeletonLoader width="120px" height="24px" className="mb-4" />
                        <SkeletonLoader width="100%" height="100px" className="mb-3" />
                        <div className="flex justify-between items-center">
                            <SkeletonLoader width="100px" height="20px" />
                            <SkeletonLoader width="80px" height="36px" />
                        </div>
                    </div>

                    {/* Voice Items Skeleton */}
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-4 items-center">
                                    <SkeletonLoader width="48px" height="48px" borderRadius="50%" />
                                    <div>
                                        <SkeletonLoader width="120px" height="20px" className="mb-1" />
                                        <SkeletonLoader width="80px" height="16px" />
                                    </div>
                                </div>
                                <SkeletonLoader width="24px" height="24px" />
                            </div>
                            
                            <SkeletonLoader width="100%" height="20px" className="mb-2" />
                            <SkeletonLoader width="90%" height="20px" className="mb-6" />
                            
                            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 flex gap-6">
                                <SkeletonLoader width="60px" height="24px" />
                                <SkeletonLoader width="60px" height="24px" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sidebar Skeleton */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-sm">
                        <SkeletonLoader width="140px" height="24px" className="mb-6" />
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <SkeletonLoader width="100px" height="20px" />
                                    <SkeletonLoader width="30px" height="20px" borderRadius="12px" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
