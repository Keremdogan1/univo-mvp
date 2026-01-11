import React from 'react';

const SkeletonLoader = ({ className = '', width, height, borderRadius }: { className?: string, width?: string | number, height?: string | number, borderRadius?: string }) => (
    <div
      className={`relative overflow-hidden bg-neutral-200 dark:bg-neutral-800 rounded-md ${className} animate-pulse`}
      style={{ width, height, borderRadius }}
    >
        {/* Shimmer Beam Effect */ }
      <div 
        className="absolute inset-0 animate-shimmer"
        style={{
            backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            backgroundSize: '200% 100%',
            backgroundRepeat: 'no-repeat'
        }}
      ></div>
    </div>
);

export default SkeletonLoader;
