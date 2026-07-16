import { X } from 'lucide-react';
import type { BattleLeaderboardEntryDto } from '@/api/battle.api';

type FinalResultModalProps = {
  leaderboard: BattleLeaderboardEntryDto[];
  onClose: () => void;
};

export const FinalResultModal = ({ leaderboard, onClose }: FinalResultModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-lg rounded-lg border border-white/10 bg-slate-950 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <h2 className="text-lg font-bold text-white">Kết quả Battle</h2>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
          <X size={18} />
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-4">
        {leaderboard.length === 0 && <p className="text-sm text-slate-400">Chưa có kết quả xếp hạng.</p>}
        <div className="space-y-2">
          {leaderboard.map(entry => (
            <div key={entry.userId} className="grid grid-cols-[48px_minmax(0,1fr)_72px] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <span className="font-bold text-amber-200">#{entry.rank}</span>
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{entry.name}</p>
                <p className="text-xs text-slate-500">{entry.acceptedCount} bài Accepted</p>
              </div>
              <span className="text-right font-semibold text-emerald-300">{entry.totalPoints}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default FinalResultModal;
