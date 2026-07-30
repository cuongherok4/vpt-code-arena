import { BookOpen, Code, TerminalSquare, Zap } from 'lucide-react';

export const LearnWelcome = () => {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-18 w-18 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/10">
        <Code size={34} className="text-cyan-200" />
      </div>
      <div className="app-kicker justify-center">
        <TerminalSquare size={16} />
        Học lập trình
      </div>
      <h1 className="app-page-heading">VPT Code Arena</h1>
      <p className="app-page-subtitle mx-auto max-w-lg leading-6">
        Chọn một bài học trong mục lục để bắt đầu. Tiến độ học tập được lưu tự động theo tài khoản.
      </p>

      <div className="mt-8 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <div className="app-card flex items-start gap-4 p-5 text-left">
          <BookOpen className="mt-1 shrink-0 text-cyan-300" size={22} />
          <div>
            <h3 className="mb-1 font-semibold text-white">Lý thuyết trọng tâm</h3>
            <p className="text-sm text-slate-400">Các khái niệm được giải thích ngắn gọn, dễ hiểu kèm ví dụ minh họa trực quan.</p>
          </div>
        </div>
        <div className="app-card flex items-start gap-4 p-5 text-left">
          <Zap className="mt-1 shrink-0 text-amber-300" size={22} />
          <div>
            <h3 className="mb-1 font-semibold text-white">Thực hành ngay</h3>
            <p className="text-sm text-slate-400">Thực hành ngay trên trình duyệt với hệ thống tự động chấm điểm (Auto-grading).</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnWelcome;
