import { Trophy } from 'lucide-react';
import type { BattleLeaderboardEntryDto } from '@/api/battle.api';

type RealTimeLeaderboardProps = {
  entries: BattleLeaderboardEntryDto[];
  maxPoints?: number;
};

export const RealTimeLeaderboard = ({ entries, maxPoints }: RealTimeLeaderboardProps) => (
  <section className="rounded-lg border border-white/10 bg-slate-950/70">
    <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-amber-300" />
        <h2 className="font-semibold text-white">Xếp hạng live</h2>
      </div>
      {maxPoints != null && <span className="text-xs font-medium text-slate-500">Tối đa {maxPoints} điểm</span>}
    </div>
    <div className="divide-y divide-white/10">
      {entries.length === 0 && (
        <div className="p-4 text-sm text-slate-500">Chưa có submission Accepted.</div>
      )}
      {entries.map(entry => (
        <div key={entry.userId} className="grid grid-cols-[42px_minmax(0,1fr)_64px] items-center gap-3 p-4">
          <span className="text-sm font-bold text-amber-200">#{entry.rank}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{entry.name}</p>
            <p className="text-xs text-slate-500">{entry.acceptedCount} AC</p>
          </div>
          <span className="text-right text-sm font-semibold text-emerald-300">
            {entry.totalPoints}{maxPoints != null ? `/${maxPoints}` : ''}
          </span>
        </div>
      ))}
    </div>
  </section>
);

export default RealTimeLeaderboard;
