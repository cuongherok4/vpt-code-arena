import { Clock, Loader2 } from 'lucide-react';
import type { SubmissionDto } from '@/api/exam.api';

interface SubmissionHistoryProps {
  isLoading: boolean;
  submissions: SubmissionDto[];
}

export const SubmissionHistory = ({ isLoading, submissions }: SubmissionHistoryProps) => {
  return (
    <section className="border border-white/10 bg-slate-950/60">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">Lịch sử nộp bài</h2>
        {isLoading && <Loader2 size={15} className="animate-spin text-slate-500" />}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {submissions.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">Chưa có lần nộp nào.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {submissions.map(submission => (
              <div key={submission.id} className="px-4 py-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className={statusClass(submission.result)}>{statusText(submission.result)}</span>
                  <span className="text-xs text-slate-500">{submission.language}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
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
