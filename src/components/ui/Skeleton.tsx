
import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden bg-neutral-200 dark:bg-neutral-800 rounded-md ${className}`}
      style={{ 
        width: width, 
        height: height,
      }}
    >
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"></div>
    </div>
  );
}
