import { BookOpen, Code, Zap } from 'lucide-react';

export const LearnWelcome = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <div className="w-20 h-20 bg-violet-500/20 rounded-2xl flex items-center justify-center mb-6 border border-violet-500/30">
        <Code size={40} className="text-violet-400" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-4">Chào mừng đến với VPT Code Arena</h1>
      <p className="text-slate-400 max-w-lg mb-8 leading-relaxed">
        Hệ thống học lập trình tương tác. Chọn một bài học ở menu bên trái để bắt đầu. Hệ thống sẽ tự động lưu lại tiến độ học tập của bạn.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-left flex items-start gap-4">
          <BookOpen className="text-blue-400 shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-semibold text-white mb-1">Lý thuyết trọng tâm</h3>
            <p className="text-sm text-slate-400">Các khái niệm được giải thích ngắn gọn, dễ hiểu kèm ví dụ minh họa trực quan.</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-left flex items-start gap-4">
          <Zap className="text-yellow-400 shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-semibold text-white mb-1">Thử thách Code (Challenge)</h3>
            <p className="text-sm text-slate-400">Thực hành ngay trên trình duyệt với hệ thống tự động chấm điểm (Auto-grading).</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnWelcome;
