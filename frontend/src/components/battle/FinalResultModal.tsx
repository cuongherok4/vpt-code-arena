import { useEffect } from 'react';
import { X, Trophy } from 'lucide-react';
import type { BattleLeaderboardEntryDto } from '@/api/battle.api';

type FinalResultModalProps = {
  leaderboard: BattleLeaderboardEntryDto[];
  onClose: () => void;
};

export const FinalResultModal = ({ leaderboard, onClose }: FinalResultModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Kết quả thi đấu Battle"
        className="w-full max-w-lg rounded-xl border border-amber-500/30 bg-slate-950 p-1 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-2 text-amber-300">
            <Trophy size={20} />
            <h2 className="text-lg font-bold text-white">Kết quả Battle</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng kết quả"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white focus-visible:outline-none"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {leaderboard.length === 0 && <p className="text-sm text-slate-400">Chưa có kết quả xếp hạng.</p>}
          <div className="space-y-2">
            {leaderboard.map(entry => (
              <div key={entry.userId} className="grid grid-cols-[48px_minmax(0,1fr)_72px] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <span className="font-bold text-amber-300 text-sm">#{entry.rank}</span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{entry.name}</p>
                  <p className="text-xs text-slate-400">{entry.acceptedCount} bài Accepted</p>
                </div>
                <span className="text-right font-semibold text-emerald-300">{entry.totalPoints} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalResultModal;
