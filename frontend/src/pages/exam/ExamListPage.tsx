import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Code2,
  Loader2,
  Medal,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
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

const difficultyNodeClass = {
  EASY: 'border-emerald-300/40 bg-emerald-400 text-slate-950 shadow-emerald-400/20',
  MEDIUM: 'border-amber-300/40 bg-amber-400 text-slate-950 shadow-amber-400/20',
  HARD: 'border-rose-300/40 bg-rose-400 text-slate-950 shadow-rose-400/20',
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
    <div className="flex min-h-[calc(100vh-64px)] min-w-0 bg-[#0B0F19] md:h-[calc(100vh-64px)] md:overflow-hidden">
      <aside className={`${id ? 'hidden md:block' : 'block'} w-full min-w-0 shrink-0 border-r border-white/10 bg-slate-950/40 md:w-[420px]`}>
        <div className="border-b border-white/10 bg-slate-950/80 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Code2 size={19} className="text-cyan-300" />
            <h1 className="text-lg font-semibold text-white">Lộ trình kỳ thi</h1>
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
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 focus-within:border-cyan-400/50">
              <Search size={16} className="text-slate-500" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm chặng thi..."
                aria-label="Tìm kiếm chặng thi"
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-slate-500" />
              <div className="grid flex-1 grid-cols-4 gap-1" role="tablist" aria-label="Lọc độ khó">
                {difficulties.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    role="tab"
                    aria-selected={difficulty === item.value}
                    onClick={() => setDifficulty(item.value)}
                    className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                      difficulty === item.value
                        ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100'
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

        <div className="max-h-[calc(100vh-240px)] overflow-y-auto p-4 md:h-[calc(100%-145px)] md:max-h-none">
          {problemsQuery.isLoading && (
            <div className="space-y-3">
              <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/60 p-4 h-24" />
              <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/60 p-4 h-24" />
              <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/60 p-4 h-24" />
            </div>
          )}

          {problemsQuery.isError && (
            <div role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              Không thể tải danh sách đề.
            </div>
          )}

          {!problemsQuery.isLoading && !problemsQuery.isError && problems.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-400">
              Không tìm thấy bài thi phù hợp với bộ lọc.
            </div>
          )}

          <div className="relative space-y-4 py-2">
            {problems.length > 1 && (
              <div className="absolute bottom-10 left-1/2 top-10 hidden w-px -translate-x-1/2 bg-gradient-to-b from-cyan-400/0 via-cyan-400/25 to-cyan-400/0 sm:block" />
            )}

            {problems.map((problem, index) => {
              const active = problem.id === id;
              const side = index % 2 === 0 ? 'pr-10 sm:pr-20' : 'pl-10 sm:pl-20';
              return (
                <Link
                  key={problem.id}
                  to={`/exam/problems/${problem.id}`}
                  className={`group relative block ${side}`}
                >
                  <div className={`rounded-lg border p-3 transition-all ${
                    active
                      ? 'border-cyan-300/50 bg-cyan-400/[0.12] shadow-[0_16px_40px_rgba(45,212,191,0.12)]'
                      : 'border-white/10 bg-white/[0.035] hover:border-cyan-300/30 hover:bg-white/[0.06]'
                  }`}>
                    <div className="mb-3 flex items-center gap-3">
                      <span className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-base font-black shadow-lg transition-transform group-hover:scale-105 ${
                        active ? 'border-cyan-100 bg-cyan-300 text-slate-950 shadow-cyan-300/30' : difficultyNodeClass[problem.difficulty]
                      }`}>
                        {index + 1}
                        {active && (
                          <span className="absolute -right-1 -top-1 rounded-full bg-slate-950 p-0.5 text-cyan-200 ring-1 ring-cyan-300/40">
                            <Sparkles size={12} />
                          </span>
                        )}
                      </span>

                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-sm font-semibold text-white">{problem.title}</h2>
                        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-400">
                          <span>{problem.topic}</span>
                          <span>{problem.timeLimitMs} ms</span>
                          <span>{formatMemory(problem.memoryLimitKb)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${difficultyClass[problem.difficulty]}`}>
                        {problem.difficulty}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${active ? 'text-cyan-100' : 'text-slate-500 group-hover:text-cyan-200'}`}>
                        {active ? <CheckCircle2 size={13} /> : <Code2 size={13} />}
                        {active ? 'Đang chọn' : 'Bắt đầu'}
                      </span>
                    </div>
                  </div>

                  <span className={`absolute top-6 hidden h-px w-10 bg-cyan-400/20 sm:block ${
                    index % 2 === 0 ? 'right-8 sm:right-12' : 'left-8 sm:left-12'
                  }`} />
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      <main className={`${id ? 'block' : 'hidden md:block'} min-w-0 flex-1 overflow-y-auto bg-slate-950/50`}>
        <div className="mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
          {id && (
            <Link
              to="/exam"
              className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white md:hidden"
            >
              <ArrowLeft size={16} />
              Lộ trình đề
            </Link>
          )}

          {!id && (
            <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-cyan-200 shadow-[0_18px_60px_rgba(45,212,191,0.12)]">
                <Sparkles size={36} />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-white">Chọn một chặng để bắt đầu</h2>
              <p className="max-w-md text-sm leading-6 text-slate-400">
                Các đề được sắp thành lộ trình từng bước. Hãy chọn một số trong đường học bên trái để luyện thi.
              </p>
            </div>
          )}

          {id && detailQuery.isLoading && (
            <div className="flex items-center justify-center gap-2 py-32 text-sm text-slate-400">
              <Loader2 size={18} className="animate-spin text-cyan-300" />
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
