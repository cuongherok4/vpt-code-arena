import { Loader2, Trophy } from 'lucide-react';
import type { ExamLanguage, ExamLeaderboardEntryDto } from '@/api/exam.api';

const LANGUAGES: Array<{ value: ExamLanguage; label: string }> = [
  { value: 'python', label: 'Python' },
  { value: 'c', label: 'C' },
  { value: 'java', label: 'Java' },
];

interface ExamLeaderboardProps {
  isLoading: boolean;
  entries: ExamLeaderboardEntryDto[];
  language: ExamLanguage;
  onLanguageChange: (language: ExamLanguage) => void;
}

export const ExamLeaderboard = ({ isLoading, entries, language, onLanguageChange }: ExamLeaderboardProps) => {
  return (
    <section className="border border-white/10 bg-slate-950/60">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Trophy size={16} className="text-amber-300" />
          Bảng xếp hạng
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
            {LANGUAGES.map(item => (
              <button
                key={item.value}
                type="button"
                onClick={() => onLanguageChange(item.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  language === item.value ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {isLoading && <Loader2 size={15} className="animate-spin text-slate-500" />}
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">Chưa có Accepted cho ngôn ngữ này.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {entries.map(entry => (
              <div key={entry.userId} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 px-4 py-3">
                <span className={`text-sm font-bold ${entry.rank <= 3 ? 'text-amber-300' : 'text-slate-400'}`}>
                  #{entry.rank}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">{entry.userName}</div>
                  <div className="text-xs text-slate-500">{entry.acceptedCount} AC</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-emerald-300">{entry.points}</div>
                  {entry.executionTime != null && <div className="text-xs text-slate-500">{entry.executionTime} ms</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ExamLeaderboard;
