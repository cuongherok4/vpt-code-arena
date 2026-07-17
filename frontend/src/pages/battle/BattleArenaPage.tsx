import { useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { battleApi, type BattleLanguage, type BattleProblemDto, type BattleSubmissionDto } from '@/api/battle.api';
import { examApi } from '@/api/exam.api';
import ProblemStatement from '@/components/exam/ProblemStatement';

const languageOptions: Array<{ value: BattleLanguage; label: string; monaco: string; defaultCode: string }> = [
  { value: 'python', label: 'Python', monaco: 'python', defaultCode: '# Code here\n' },
  { value: 'java', label: 'Java', monaco: 'java', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // Code here\n    }\n}' },
  { value: 'c', label: 'C', monaco: 'cpp', defaultCode: '#include <stdio.h>\nint main() {\n    // Code here\n    return 0;\n}' },
];

type BattleArenaPageProps = {
  roomId: string;
  problems: BattleProblemDto[];
  latestSubmission?: BattleSubmissionDto;
  onSubmitted: (submission: BattleSubmissionDto) => void;
};

export const BattleArenaPage = ({ roomId, problems, latestSubmission, onSubmitted }: BattleArenaPageProps) => {
  const [activeProblemId, setActiveProblemId] = useState(problems[0]?.id ?? '');
  const [language, setLanguage] = useState<BattleLanguage>('python');
  const [codeByProblem, setCodeByProblem] = useState<Record<string, string>>({});
  const currentLanguage = useMemo(() => languageOptions.find(item => item.value === language) ?? languageOptions[0], [language]);
  const activeProblem = problems.find(problem => problem.id === activeProblemId) ?? problems[0];
  const activeProblemPoints = activeProblem ? pointsForDifficulty(activeProblem.difficulty) : 0;
  const codeKey = `${activeProblem?.id ?? 'empty'}:${language}`;
  const code = codeByProblem[codeKey] ?? currentLanguage.defaultCode;
  const displayedSubmission = latestSubmission?.problemId === activeProblem?.id ? latestSubmission : undefined;

  const problemDetailQuery = useQuery({
    queryKey: ['battle-problem-detail', activeProblem?.id],
    queryFn: () => examApi.getProblem(activeProblem!.id),
    enabled: !!activeProblem?.id,
  });

  const submitMutation = useMutation({
    mutationFn: () => battleApi.submit(roomId, activeProblem.id, code, language),
    onSuccess: onSubmitted,
  });

  if (!activeProblem) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
        Phòng chưa có bài. Hãy refresh sau khi chủ phòng bắt đầu trận.
      </div>
    );
  }

  const running = submitMutation.isPending || displayedSubmission?.result === 'PENDING';

  return (
    <section className="grid min-h-[720px] overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 lg:grid-cols-[420px_minmax(0,1fr)]">
      <aside className="max-h-[720px] overflow-y-auto border-b border-white/10 lg:border-b-0 lg:border-r">
        <div className="border-b border-white/10 p-4 font-semibold text-white">Bài thi</div>
        <div className="space-y-2 p-3">
          {problems.map(problem => (
            <button
              key={problem.id}
              type="button"
              onClick={() => setActiveProblemId(problem.id)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                problem.id === activeProblem.id ? 'border-violet-500/40 bg-violet-500/15' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className="min-w-0 text-sm font-semibold text-white">#{problem.order} {problem.title}</span>
                <span className="shrink-0 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                  {pointsForDifficulty(problem.difficulty)}đ
                </span>
              </div>
              <div className="text-xs text-slate-500">{problem.difficulty} · {problem.topic || 'general'}</div>
            </button>
          ))}
        </div>
        <div className="border-t border-white/10 p-4">
          {problemDetailQuery.isLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin text-violet-300" />
              Đang tải chi tiết đề...
            </div>
          )}
          {problemDetailQuery.error && (
            <p className="text-sm text-red-300">Không tải được chi tiết đề. Kiểm tra API Exam hoặc refresh lại phòng.</p>
          )}
          {problemDetailQuery.data && (
            <div className="[&_article]:space-y-4 [&_h1]:text-xl [&_p]:text-sm [&_pre]:min-h-16 [&_pre]:text-xs [&_section]:space-y-2">
              <ProblemStatement problem={problemDetailQuery.data} />
            </div>
          )}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
              {languageOptions.map(item => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setLanguage(item.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    language === item.value ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300">
              Bài này tối đa {activeProblemPoints} điểm
            </span>
          </div>
          <button
            type="button"
            onClick={() => submitMutation.mutate()}
            disabled={running || !code.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {displayedSubmission?.result === 'PENDING' ? 'Đang chấm' : 'Submit'}
          </button>
        </div>

        <Editor
          height="520px"
          language={currentLanguage.monaco}
          value={code}
          onChange={value => setCodeByProblem(prev => ({ ...prev, [codeKey]: value ?? '' }))}
          theme="vs-dark"
          options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, automaticLayout: true }}
        />

        {(displayedSubmission || submitMutation.error) && (
          <div className="space-y-3 border-t border-white/10 p-4">
            {displayedSubmission && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className={statusClass(displayedSubmission.result)}>{statusText(displayedSubmission.result)}</span>
                <span className="text-slate-500">+{displayedSubmission.points}/{activeProblemPoints} điểm</span>
                {displayedSubmission.executionTime != null && <span className="text-slate-500">{displayedSubmission.executionTime} ms</span>}
                {displayedSubmission.result === 'AC' && <CheckCircle2 size={16} className="text-emerald-300" />}
              </div>
            )}
            {displayedSubmission?.errorOutput && (
              <ResultBlock title="Lỗi" tone="error" value={displayedSubmission.errorOutput} />
            )}
            {displayedSubmission?.output && (
              <ResultBlock title="Output" tone="output" value={displayedSubmission.output} />
            )}
            {submitMutation.error && <p className="text-sm text-red-300">Submit thất bại. Kiểm tra phòng còn thời gian và bạn là thành viên.</p>}
          </div>
        )}
      </div>
    </section>
  );
};

function statusText(status: BattleSubmissionDto['result']) {
  return ({ PENDING: 'Đang chấm', AC: 'Accepted', WA: 'Wrong Answer', TLE: 'Time Limit', RE: 'Runtime Error', CE: 'Compile Error' })[status];
}

function statusClass(status: BattleSubmissionDto['result']) {
  if (status === 'AC') return 'font-semibold text-emerald-300';
  if (status === 'PENDING') return 'font-semibold text-sky-300';
  return 'font-semibold text-red-300';
}

function pointsForDifficulty(difficulty: BattleProblemDto['difficulty']) {
  return ({ EASY: 100, MEDIUM: 200, HARD: 300 })[difficulty];
}

const ResultBlock = ({ title, tone, value }: { title: string; tone: 'error' | 'output'; value: string }) => (
  <div className={`overflow-hidden rounded-lg border ${
    tone === 'error' ? 'border-red-500/20 bg-red-500/10' : 'border-sky-500/20 bg-sky-500/10'
  }`}>
    <div className={`border-b px-3 py-2 text-xs font-semibold ${
      tone === 'error' ? 'border-red-500/20 text-red-200' : 'border-sky-500/20 text-sky-200'
    }`}>
      {title}
    </div>
    <pre className="max-h-48 overflow-auto whitespace-pre-wrap p-3 text-xs leading-5 text-slate-100"><code>{value}</code></pre>
  </div>
);

export default BattleArenaPage;
