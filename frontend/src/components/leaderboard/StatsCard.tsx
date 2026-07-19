import type { ReactNode } from 'react';

type StatsCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
};

export function StatsCard({ label, value, hint, icon }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <dt className="flex items-center gap-2 text-sm text-slate-400">
        {icon}
        {label}
      </dt>
      <dd className="mt-2 text-2xl font-semibold text-white">{value}</dd>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
