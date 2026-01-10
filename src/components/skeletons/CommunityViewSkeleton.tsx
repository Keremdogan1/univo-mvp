
import React from 'react';
import Skeleton from '../ui/Skeleton';

export default function CommunityViewSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 relative animate-in fade-in duration-500">
      {/* Newspaper Header Skeleton */}
      <div className="border-b-4 border-neutral-200 dark:border-neutral-800 pb-4 mb-8 text-center md:static pt-4 -mt-4 -mx-4 px-4 relative">
        <div className="flex flex-col items-center justify-center gap-4">
          <Skeleton width={400} height={60} className="mb-2" />
          <div className="flex items-center gap-3">
             <Skeleton width={56} height={56} className="rounded-full" />
          </div>
        </div>
        <div className="flex justify-between items-center border-t-2 border-neutral-200 dark:border-neutral-800 pt-2 mt-4 max-w-2xl mx-auto">
           <Skeleton width={80} height={20} />
           <Skeleton width={120} height={20} />
           <Skeleton width={80} height={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Left Sidebar (Categories) */}
         <div className="lg:col-span-1 hidden lg:block">
            <Skeleton width={150} height={28} className="mb-4" />
            <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                        <Skeleton width={20} height={20} className="rounded" />
                        <Skeleton width={120} height={20} />
                    </div>
                ))}
            </div>

            {/* Popular Events Widget */}
            <div className="mt-8 border-4 border-neutral-200 dark:border-neutral-800 p-6">
                <Skeleton width={100} height={24} className="mb-4" />
                <div className="space-y-4">
                    <Skeleton height={50} />
                    <Skeleton height={50} />
                </div>
            </div>
         </div>

         {/* Mobile Categories (Horizontal) */}
         <div className="lg:hidden flex gap-3 overflow-hidden pb-4">
             {[1, 2, 3, 4].map(i => (
                 <Skeleton key={i} width={100} height={36} className="rounded-full shrink-0" />
             ))}
         </div>

         {/* Main Grid */}
         <div className="lg:col-span-3">
            <div className="flex items-center gap-4 mb-6 border-b-2 border-neutral-200 dark:border-neutral-800 pb-2">
                 <Skeleton width={80} height={24} className="bg-neutral-800 dark:bg-white" />
                 <Skeleton width={200} height={28} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                        {/* Image Placeholder */}
                        <Skeleton width="100%" height={160} className="rounded-none translate-x-[0%] translate-y-[0%]" />
                        
                        <div className="p-4 space-y-3">
                            {/* Date Badge */}
                            <div className="flex justify-between">
                                <Skeleton width={80} height={20} className="rounded-sm" />
                                <Skeleton width={60} height={20} className="rounded-full" />
                            </div>
                            
                            {/* Title */}
                            <Skeleton width="90%" height={24} />
                            <Skeleton width="60%" height={24} />

                            {/* Location/Details */}
                            <div className="flex gap-2 pt-2">
                                <Skeleton width={16} height={16} />
                                <Skeleton width={100} height={16} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
}
