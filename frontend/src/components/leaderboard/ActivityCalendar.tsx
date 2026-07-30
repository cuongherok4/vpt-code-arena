import type { UserSubmissionHistory } from '@/api/user.api';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS = 12;
const DAYS = WEEKS * 7;

type ActivityCalendarProps = {
  history: UserSubmissionHistory[];
};

export function ActivityCalendar({ history }: ActivityCalendarProps) {
  const counts = new Map<string, number>();
  for (const item of history) {
    if (!item.submittedAt) continue;
    const key = dayKey(new Date(item.submittedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = startOfDay(new Date());
  const days = Array.from({ length: DAYS }, (_, index) => {
    const date = new Date(today.getTime() - (DAYS - 1 - index) * DAY_MS);
    const key = dayKey(date);
    return { key, date, count: counts.get(key) ?? 0 };
  });

  const total = history.length;
  const activeDays = Array.from(counts.values()).filter(Boolean).length;

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-white">Hoạt động gần đây</h2>
          <p className="mt-1 text-sm text-slate-400">{total} submission trong {activeDays} ngày có hoạt động.</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span>Ít</span>
          {[0, 1, 2, 4].map((level) => (
            <span key={level} className={`h-3 w-3 rounded-sm ${activityClass(level)}`} />
          ))}
          <span>Nhiều</span>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto pb-1">
        <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
          {days.map((day) => (
            <span
              key={day.key}
              title={`${formatDate(day.date)}: ${day.count} submission`}
              className={`h-3.5 w-3.5 rounded-sm ${activityClass(day.count)}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function activityClass(count: number) {
  if (count >= 4) return 'bg-cyan-300';
  if (count >= 2) return 'bg-cyan-500/70';
  if (count === 1) return 'bg-cyan-700/60';
  return 'bg-slate-800';
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(date: Date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}
