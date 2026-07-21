import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Code2, Loader2, Medal, Search, SlidersHorizontal } from 'lucide-react';
import { examApi, type Difficulty } from '@/api/exam.api';
import ProblemStatement from '@/components/exam/ProblemStatement';

const difficulties: Array<{ value: Difficulty | ''; label: string }> = [
  { value: '', label: 'Tất cả' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

const difficultyClass = {
  EASY: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  MEDIUM: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  HARD: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
};

const formatMemory = (kb: number) => `${Math.round(kb / 1024)} MB`;

export const ExamListPage = () => {
  const { id } = useParams<{ id?: string }>();
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [keyword, setKeyword] = useState('');

  const filters = useMemo(() => ({ difficulty, keyword: keyword.trim() }), [difficulty, keyword]);

  const problemsQuery = useQuery({
    queryKey: ['exam-problems', filters],
    queryFn: () => examApi.getProblems(filters),
  });

  const detailQuery = useQuery({
    queryKey: ['exam-problem', id],
    queryFn: () => examApi.getProblem(id!),
    enabled: !!id,
  });

  const problems = problemsQuery.data ?? [];

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#0B0F19]">
      <aside className={`${id ? 'hidden md:block' : 'block'} w-full shrink-0 border-r border-white/10 bg-slate-950/40 md:w-96`}>
        <div className="border-b border-white/10 bg-slate-950/80 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Code2 size={19} className="text-violet-300" />
            <h1 className="text-lg font-semibold text-white">Đề thi lập trình</h1>
          </div>

          <Link
            to="/leaderboard"
            className="mb-3 flex items-center justify-between rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/15"
          >
            <span className="flex items-center gap-2">
              <Medal size={16} />
              Bảng xếp hạng kỳ thi
            </span>
            <span className="text-xs text-cyan-200/70">Top 50</span>
          </Link>

          <div className="space-y-3">
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
              <Search size={16} className="text-slate-500" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm đề..."
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-slate-500" />
              <div className="grid flex-1 grid-cols-4 gap-1">
                {difficulties.map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setDifficulty(item.value)}
                    className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                      difficulty === item.value
                        ? 'border-violet-500/40 bg-violet-500/15 text-violet-200'
                        : 'border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="h-[calc(100%-145px)] overflow-y-auto p-3">
          {problemsQuery.isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
              <Loader2 size={18} className="animate-spin text-violet-400" />
              Đang tải đề...
            </div>
          )}

          {problemsQuery.isError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              Không thể tải danh sách đề.
            </div>
          )}

          {!problemsQuery.isLoading && !problemsQuery.isError && problems.length === 0 && (
            <div className="py-16 text-center text-sm text-slate-500">Không có đề phù hợp.</div>
          )}

          <div className="space-y-2">
            {problems.map(problem => {
              const active = problem.id === id;
              return (
                <Link
                  key={problem.id}
                  to={`/exam/problems/${problem.id}`}
                  className={`block rounded-lg border p-3 transition-colors ${
                    active
                      ? 'border-violet-500/40 bg-violet-500/15'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h2 className="line-clamp-2 text-sm font-semibold text-white">{problem.title}</h2>
                    <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${difficultyClass[problem.difficulty]}`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span>{problem.topic}</span>
                    <span>{problem.timeLimitMs} ms</span>
                    <span>{formatMemory(problem.memoryLimitKb)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      <main className={`${id ? 'block' : 'hidden md:block'} flex-1 overflow-y-auto bg-slate-950/50`}>
        <div className="mx-auto max-w-4xl p-8">
          {id && (
            <Link
              to="/exam"
              className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white md:hidden"
            >
              <ArrowLeft size={16} />
              Danh sách đề
            </Link>
          )}

          {!id && (
            <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
              <Code2 size={48} className="mb-4 text-violet-300" />
              <h2 className="mb-2 text-2xl font-bold text-white">Chọn một đề để bắt đầu</h2>
              <p className="max-w-md text-sm leading-6 text-slate-400">
                Danh sách bên trái đã sẵn sàng để lọc theo độ khó và tìm nhanh theo tên đề.
              </p>
            </div>
          )}

          {id && detailQuery.isLoading && (
            <div className="flex items-center justify-center gap-2 py-32 text-sm text-slate-400">
              <Loader2 size={18} className="animate-spin text-violet-400" />
              Đang tải đề bài...
            </div>
          )}

          {id && detailQuery.isError && (
            <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-300">
              <AlertCircle size={18} />
              <span className="text-sm">Không tìm thấy đề bài.</span>
            </div>
          )}

          {detailQuery.data && <ProblemStatement problem={detailQuery.data} />}
        </div>
      </main>
    </div>
  );
};

export default ExamListPage;
