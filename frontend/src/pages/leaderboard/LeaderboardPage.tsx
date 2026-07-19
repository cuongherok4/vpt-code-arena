import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2, Medal, Trophy } from 'lucide-react';
import {
  leaderboardApi,
  type GlobalLeaderboardEntry,
  type LeaderboardLanguage,
} from '@/api/leaderboard.api';
import { useAuthStore } from '@/stores/authStore';

const languageTabs: Array<{ value: LeaderboardLanguage; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'c', label: 'C' },
];

export default function LeaderboardPage() {
  const [language, setLanguage] = useState<LeaderboardLanguage>('all');
  const { isAuthenticated, user } = useAuthStore();

  const leaderboardQuery = useQuery({
    queryKey: ['global-leaderboard', 'exam', language],
    queryFn: () => leaderboardApi.global(language, 50),
    staleTime: 60_000,
  });

  const rows = leaderboardQuery.data ?? [];
  const currentUserRow = rows.find((row) => row.userId === user?.id);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-cyan-300">
            <Trophy size={20} />
            <span className="text-sm font-medium">Leaderboard</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Bảng xếp hạng kỳ thi</h1>
          <p className="mt-1 text-sm text-slate-400">Top người chơi theo điểm AC trong phần kỳ thi, lọc theo ngôn ngữ.</p>
        </div>
      </div>

      <section className="rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cyan-100">Thống số của bạn</p>
            <p className="mt-1 text-xs text-slate-400">
              {isAuthenticated
                ? `${user?.name ?? 'Tài khoản'} · ${language === 'all' ? 'Tất cả ngôn ngữ' : language.toUpperCase()}`
                : 'Đăng nhập để xem vị trí của bạn trên bảng xếp hạng.'}
            </p>
          </div>

          <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:min-w-[420px]">
            <UserMetric label="Hạng" value={currentUserRow ? `#${currentUserRow.rank}` : '-'} />
            <UserMetric label="Điểm" value={(currentUserRow?.totalPoints ?? 0).toString()} />
            <UserMetric label="AC" value={(currentUserRow?.totalAccepted ?? 0).toString()} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
          <div className="flex items-center gap-2 text-white">
            <Medal size={18} className="text-cyan-300" />
            <h2 className="font-semibold">Top 50</h2>
          </div>
          <div className="flex flex-wrap gap-1">
            {languageTabs.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setLanguage(item.value)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  language === item.value
                    ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100'
                    : 'border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {leaderboardQuery.isLoading && (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-400">
            <Loader2 size={18} className="animate-spin text-cyan-300" />
            Đang tải bảng xếp hạng...
          </div>
        )}

        {leaderboardQuery.isError && (
          <div className="m-4 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle size={18} />
            Không thể tải bảng xếp hạng.
          </div>
        )}

        {!leaderboardQuery.isLoading && !leaderboardQuery.isError && rows.length === 0 && (
          <div className="py-20 text-center text-sm text-slate-500">Chưa có dữ liệu xếp hạng cho bộ lọc này.</div>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Hạng</th>
                  <th className="px-4 py-3">Người chơi</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3 text-right">Điểm</th>
                  <th className="px-4 py-3 text-right">AC</th>
                  <th className="px-4 py-3">AC gần nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                {rows.map((row) => (
                  <tr key={`${row.rank}-${row.userId}`} className="hover:bg-white/[0.025]">
                    <td className="px-4 py-3">{rankBadge(row.rank)}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{row.userName}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{row.publicId}</td>
                    <td className="px-4 py-3 text-right font-semibold text-cyan-200">{row.totalPoints}</td>
                    <td className="px-4 py-3 text-right">{row.totalAccepted}</td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(row.lastAcceptedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function UserMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-slate-950/50 px-3 py-2">
      <div className="text-[11px] font-medium uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function rankBadge(rank: number) {
  const color = rank === 1
    ? 'border-amber-400/40 bg-amber-400/15 text-amber-200'
    : rank === 2
      ? 'border-slate-300/30 bg-slate-300/10 text-slate-100'
      : rank === 3
        ? 'border-orange-400/40 bg-orange-400/15 text-orange-200'
        : 'border-white/10 bg-white/[0.03] text-slate-300';

  return (
    <span className={`inline-flex min-w-12 items-center justify-center rounded-md border px-2 py-1 font-semibold ${color}`}>
      #{rank}
    </span>
  );
}

function formatDate(value: GlobalLeaderboardEntry['lastAcceptedAt']) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
