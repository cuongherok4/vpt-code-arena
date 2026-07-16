import { Clock, Database, Tag } from 'lucide-react';
import type { ProblemDetailDto } from '@/api/exam.api';

const difficultyClass = {
  EASY: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  MEDIUM: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  HARD: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
};

const formatMemory = (kb: number) => `${Math.round(kb / 1024)} MB`;

interface ProblemStatementProps {
  problem: ProblemDetailDto;
}

export const ProblemStatement = ({ problem }: ProblemStatementProps) => {
  return (
    <article className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${difficultyClass[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/25 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-300">
            <Tag size={12} />
            {problem.topic}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white">{problem.title}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={15} className="text-violet-300" />
            {problem.timeLimitMs} ms
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Database size={15} className="text-violet-300" />
            {formatMemory(problem.memoryLimitKb)}
          </span>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase text-slate-400">Đề bài</h2>
        <p className="whitespace-pre-line text-base leading-7 text-slate-200">{problem.description}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase text-slate-400">Ví dụ</h2>
        {problem.sampleCases.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có ví dụ công khai.</p>
        ) : (
          <div className="space-y-4">
            {problem.sampleCases.map((sample, index) => (
              <div key={`${sample.input}-${index}`} className="grid gap-3 md:grid-cols-2">
                <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/70">
                  <div className="border-b border-white/10 px-3 py-2 text-xs font-medium text-slate-400">
                    Input {index + 1}
                  </div>
                  <pre className="min-h-24 overflow-x-auto p-3 text-sm text-slate-200"><code>{sample.input || '(trống)'}</code></pre>
                </div>
                <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/70">
                  <div className="border-b border-white/10 px-3 py-2 text-xs font-medium text-slate-400">
                    Output {index + 1}
                  </div>
                  <pre className="min-h-24 overflow-x-auto p-3 text-sm text-slate-200"><code>{sample.expected || '(trống)'}</code></pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </article>
  );
};

export default ProblemStatement;
