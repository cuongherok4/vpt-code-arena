import React, { type ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Không có dữ liệu',
  description = 'Chưa có mục nào được tìm thấy hoặc danh sách đang trống.',
  icon,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      role="region"
      aria-label={title}
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center backdrop-blur-sm ${className}`}
    >
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/80 text-teal-400 shadow-inner">
        {icon || <Inbox className="h-7 w-7 opacity-80" />}
      </div>
      <h3 className="text-base font-bold text-slate-100">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-400">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-500/10 px-4 py-2 text-xs font-semibold text-teal-400 border border-teal-500/30 transition hover:bg-teal-500 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
