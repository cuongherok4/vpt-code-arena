import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, LockKeyhole } from 'lucide-react';
import { examApi, type ExamLanguage, type SubmissionDto } from '@/api/exam.api';
import ProblemStatement from '@/components/exam/ProblemStatement';
import SubmitPanel from '@/components/exam/SubmitPanel';
import SubmissionHistory from '@/components/exam/SubmissionHistory';
import ExamLeaderboard from '@/components/exam/ExamLeaderboard';

export const ExamProblemPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [leaderboardLanguage, setLeaderboardLanguage] = useState<ExamLanguage>('python');

  const problemQuery = useQuery({
    queryKey: ['exam-problem', id],
    queryFn: () => examApi.getProblem(id!),
    enabled: !!id,
  });

  const problemsQuery = useQuery({
    queryKey: ['exam-problems', 'path'],
    queryFn: () => examApi.getProblems(),
  });

  const submissionsQuery = useQuery({
    queryKey: ['exam-submissions', id],
    queryFn: () => examApi.getSubmissions(id!),
    enabled: !!id,
    refetchInterval: query => {
      const submissions = query.state.data as SubmissionDto[] | undefined;
      return submissions?.some(submission => submission.result === 'PENDING') ? 1500 : false;
    },
  });

  const leaderboardQuery = useQuery({
    queryKey: ['exam-leaderboard', id, leaderboardLanguage],
    queryFn: () => examApi.getLeaderboard(id!, leaderboardLanguage, 20),
    enabled: !!id,
    refetchInterval: submissionsQuery.data?.some(submission => submission.result === 'PENDING') ? 2500 : false,
  });

  const submitMutation = useMutation({
    mutationFn: ({ sourceCode, language }: { sourceCode: string; language: ExamLanguage }) =>
      examApi.submit(id!, sourceCode, language),
    onSuccess: (_submission, variables) => {
      setLeaderboardLanguage(variables.language);
      queryClient.invalidateQueries({ queryKey: ['exam-submissions', id] });
      queryClient.invalidateQueries({ queryKey: ['exam-leaderboard', id] });
    },
  });

  const submissions = submissionsQuery.data ?? [];
  const latestSubmission = submissions[0];
  const problems = problemsQuery.data ?? [];
  const currentIndex = problems.findIndex(problem => problem.id === id);
  const previousProblem = currentIndex > 0 ? problems[currentIndex - 1] : null;
  const nextProblem = currentIndex >= 0 ? problems[currentIndex + 1] : null;
  const hasAccepted = submissions.some(submission => submission.result === 'AC');
  const hasAttempted = submissions.length > 0;
  const canMoveNext = Boolean(nextProblem && hasAttempted);

  if (problemQuery.isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#0B0F19] text-slate-400">
        <Loader2 size={22} className="mr-2 animate-spin text-violet-300" />
        Đang tải workspace...
      </div>
    );
  }

  if (problemQuery.isError || !problemQuery.data) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#0B0F19] px-6">
        <div className="flex items-center gap-3 border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300">
          <AlertCircle size={18} />
          <span className="text-sm">Không tìm thấy đề bài.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0B0F19] lg:h-[calc(100vh-64px)] lg:overflow-hidden">
      <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(460px,46vw)]">
        <main className="border-r border-white/10 bg-slate-950/40 lg:overflow-y-auto">
          <div className="mx-auto max-w-4xl space-y-6 p-5 md:p-8">
            <Link
              to="/exam"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft size={16} />
              Danh sách đề
            </Link>
            <ProblemStatement problem={problemQuery.data} />
            <div className="flex flex-col gap-3 border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${
                  hasAccepted
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                    : hasAttempted
                      ? 'border-sky-400/30 bg-sky-400/10 text-sky-200'
                      : 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                }`}>
                  {hasAttempted ? <CheckCircle2 size={18} /> : <LockKeyhole size={18} />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {hasAccepted ? 'Đã giải đúng' : hasAttempted ? 'Đã nộp bài' : 'Nộp bài để mở bài tiếp'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {hasAttempted
                      ? 'Bạn có thể chuyển sang chặng kế tiếp hoặc quay lại bài trước.'
                      : 'Sau lần nộp đầu tiên, nút bài tiếp sẽ được mở.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previousProblem ? (
                  <Link
                    to={`/exam/problems/${previousProblem.id}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <ArrowLeft size={16} />
                    Bài trước
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-600"
                  >
                    <ArrowLeft size={16} />
                    Bài trước
                  </button>
                )}

                {nextProblem && canMoveNext ? (
                  <Link
                    to={`/exam/problems/${nextProblem.id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
                  >
                    Bài tiếp
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-500"
                    title={nextProblem ? 'Nộp bài hiện tại trước khi sang bài tiếp.' : 'Bạn đang ở bài cuối.'}
                  >
                    {nextProblem ? 'Bài tiếp' : 'Hết lộ trình'}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        <aside className="bg-slate-950/70 lg:overflow-y-auto">
          <div className="space-y-4 p-4">
            <SubmitPanel
              isSubmitting={submitMutation.isPending}
              latestSubmission={latestSubmission}
              onLanguageChange={setLeaderboardLanguage}
              onSubmit={(sourceCode, language) => submitMutation.mutate({ sourceCode, language })}
            />

            <div className="grid gap-4 xl:grid-cols-2">
              <SubmissionHistory
                isLoading={submissionsQuery.isLoading || submissionsQuery.isFetching}
                submissions={submissions}
              />
              <ExamLeaderboard
                language={leaderboardLanguage}
                isLoading={leaderboardQuery.isLoading || leaderboardQuery.isFetching}
                entries={leaderboardQuery.data ?? []}
                onLanguageChange={setLeaderboardLanguage}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ExamProblemPage;
