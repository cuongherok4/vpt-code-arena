import React from 'react';
import { Loader2 } from 'lucide-react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const SkeletonText: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => (
  <div
    aria-busy="true"
    aria-label="Đang tải dữ liệu..."
    className={`animate-pulse rounded bg-slate-800/80 ${className}`}
  />
);

export const SkeletonCard: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    aria-busy="true"
    aria-label="Đang tải nội dung..."
    className={`animate-pulse space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-5 ${className}`}
  >
    <div className="flex items-center justify-between">
      <SkeletonText className="h-5 w-1/3" />
      <SkeletonText className="h-4 w-16" />
    </div>
    <SkeletonText className="h-4 w-full" />
    <SkeletonText className="h-4 w-4/5" />
    <div className="pt-2 flex items-center justify-between">
      <SkeletonText className="h-6 w-20 rounded-full" />
      <SkeletonText className="h-8 w-24 rounded-lg" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className = '',
}) => (
  <div
    aria-busy="true"
    aria-label="Đang tải bảng dữ liệu..."
    className={`w-full animate-pulse rounded-xl border border-slate-800 bg-slate-900/60 p-4 ${className}`}
  >
    <div className="mb-4 flex items-center gap-4 border-b border-slate-800/80 pb-3">
      {Array.from({ length: cols }).map((_, c) => (
        <SkeletonText key={`th-${c}`} className="h-4 flex-1" />
      ))}
    </div>
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`tr-${r}`} className="flex items-center gap-4 py-2">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonText key={`td-${r}-${c}`} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonSpinner: React.FC<{ label?: string; className?: string }> = ({
  label = 'Đang tải...',
  className = 'py-12',
}) => (
  <div
    aria-busy="true"
    aria-label={label}
    className={`flex flex-col items-center justify-center gap-3 text-slate-400 ${className}`}
  >
    <Loader2 className="h-7 w-7 animate-spin text-teal-400" />
    <span className="text-xs font-medium">{label}</span>
  </div>
);

export const PageLoadingFallback: React.FC<{ label?: string }> = ({ label = 'Đang tải trang...' }) => (
  <div className="app-page py-8" aria-busy="true" aria-label={label}>
    <div className="mb-5 space-y-3">
      <SkeletonText className="h-4 w-28" />
      <SkeletonText className="h-8 w-56" />
      <SkeletonText className="h-4 max-w-xl" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard className="md:col-span-2 xl:col-span-1" />
    </div>
  </div>
);
