import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  type?: 'table' | 'card' | 'text';
}

const LoadingSkeleton = ({ rows = 5, type = 'table' }: LoadingSkeletonProps) => {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-8 w-16" />
                <div className="skeleton h-3 w-20" />
              </div>
              <div className="skeleton h-12 w-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton h-4" style={{ width: `${80 - i * 10}%` }} />
        ))}
      </div>
    );
  }

  // Table skeleton
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden transition-colors">
      <div className="p-4 space-y-4">
        <div className="flex gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-6 pt-4 border-t border-surface-200 dark:border-surface-700">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="skeleton h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
