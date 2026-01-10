
import React from 'react';
import Skeleton from '../ui/Skeleton';

export default function VoiceViewSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 relative animate-in fade-in duration-500">
      {/* Newspaper Header Skeleton */}
      <div className="border-b-4 border-neutral-200 dark:border-neutral-800 pb-4 mb-8 text-center md:static pt-4 -mt-4 -mx-4 px-4 relative">
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Title and Logo */}
          <Skeleton width={300} height={60} className="mb-2" />
          
          {/* Mode Switcher */}
          <div className="flex items-center gap-3">
             <Skeleton width={56} height={56} className="rounded-full" />
          </div>
        </div>

        {/* Date/Info Bar */}
        <div className="flex justify-between items-center border-t-2 border-neutral-200 dark:border-neutral-800 pt-2 mt-4 max-w-2xl mx-auto">
           <Skeleton width={80} height={20} />
           <Skeleton width={120} height={20} />
           <Skeleton width={80} height={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Forum) */}
          <div className="lg:col-span-2 space-y-8 order-last lg:order-first">
             {/* Section Title */}
             <div className="flex justify-between items-end border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-6">
                <Skeleton width={200} height={32} />
                <Skeleton width={100} height={28} className="rounded-full" />
             </div>

             {/* Input Area */}
             <div className="bg-neutral-50 dark:bg-[#0a0a0a]/50 p-6 border border-neutral-200 dark:border-neutral-800 mb-8 rounded-sm">
                <Skeleton width={150} height={24} className="mb-4" />
                <Skeleton width="100%" height={100} className="mb-4 rounded-lg" />
                <div className="flex justify-between items-center pt-2">
                   <Skeleton width={100} height={20} />
                   <Skeleton width={80} height={36} className="rounded-md" />
                </div>
             </div>

             {/* Posts Feed */}
             <div className="space-y-6">
                 {[1, 2, 3].map((i) => (
                     <div key={i} className="pb-6 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                         <div className="flex gap-4 items-start">
                             <Skeleton width={40} height={40} className="rounded-full shrink-0" />
                             <div className="flex-1 space-y-3">
                                 {/* User Info */}
                                 <div className="flex items-center gap-2 mb-2">
                                     <Skeleton width={120} height={20} />
                                     <Skeleton width={80} height={16} />
                                 </div>
                                 {/* Content */}
                                 <Skeleton width="90%" height={18} />
                                 <Skeleton width="100%" height={18} />
                                 <Skeleton width="80%" height={18} />
                                 
                                 {/* Actions */}
                                 <div className="flex gap-6 mt-4 pt-2">
                                     <Skeleton width={40} height={16} />
                                     <Skeleton width={40} height={16} />
                                     <Skeleton width={20} height={16} className="ml-auto" />
                                 </div>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
          </div>

          {/* Right Sidebar (Stats & Polls) */}
          <div className="lg:col-span-1 space-y-8">
              {/* Stats Widget */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
                  <Skeleton width={150} height={24} className="mb-6 mx-auto" />
                  <div className="grid grid-cols-2 gap-4">
                      <Skeleton height={80} className="rounded-xl" />
                      <Skeleton height={80} className="rounded-xl" />
                  </div>
              </div>

               {/* Poll Widget */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
                   <Skeleton width={180} height={24} className="mb-4" />
                   <Skeleton width="100%" height={24} className="mb-6" />
                   <div className="space-y-3">
                       <Skeleton height={40} className="rounded-lg" />
                       <Skeleton height={40} className="rounded-lg" />
                       <Skeleton height={40} className="rounded-lg" />
                   </div>
              </div>
          </div>
      </div>
    </div>
  );
}
