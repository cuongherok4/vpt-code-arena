import { Clock, History } from 'lucide-react';
import type { SubmissionDto } from '@/api/exam.api';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonText } from '@/components/common/LoadingSkeleton';

interface SubmissionHistoryProps {
  isLoading: boolean;
  submissions: SubmissionDto[];
}

export const SubmissionHistory = ({ isLoading, submissions }: SubmissionHistoryProps) => {
  return (
    <section aria-label="Lịch sử nộp bài" className="border border-white/10 bg-slate-950/60 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">Lịch sử nộp bài</h2>
        {isLoading && <span className="text-xs text-cyan-300 animate-pulse">Đang cập nhật...</span>}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading && submissions.length === 0 ? (
          <div className="p-4 space-y-3">
            <SkeletonText className="h-10 w-full" />
            <SkeletonText className="h-10 w-full" />
          </div>
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={<History className="h-5 w-5" />}
            title="Chưa có lần nộp nào"
            description="Hãy thử viết code và bấm Nộp bài để kiểm tra kết quả."
            className="border-0 bg-transparent py-6"
          />
        ) : (
          <div className="divide-y divide-white/10">
            {submissions.map(submission => (
              <div key={submission.id} className="px-4 py-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className={statusClass(submission.result)}>{statusText(submission.result)}</span>
                  <span className="text-xs text-slate-400 font-mono">{submission.language}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>{submission.points} pts</span>
                  {submission.executionTime != null && <span>{submission.executionTime} ms</span>}
                  {submission.memoryUsed != null && <span>{submission.memoryUsed} KB</span>}
                  {submission.submittedAt && (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(submission.submittedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

function statusText(status: SubmissionDto['result']) {
  return ({
    PENDING: 'Pending',
    AC: 'Accepted',
    WA: 'Wrong Answer',
    TLE: 'Time Limit',
    RE: 'Runtime Error',
    CE: 'Compile Error',
  })[status];
}

function statusClass(status: SubmissionDto['result']) {
  if (status === 'AC') return 'text-sm font-semibold text-emerald-300';
  if (status === 'PENDING') return 'text-sm font-semibold text-sky-300';
  return 'text-sm font-semibold text-red-300';
}

export default SubmissionHistory;
