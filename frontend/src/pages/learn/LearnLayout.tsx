import { useQuery } from '@tanstack/react-query';
import { Outlet, useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { learnApi } from '@/api/learn.api';
import ChapterTree from '@/components/learn/ChapterTree';
import { useEffect } from 'react';

const LANGUAGES = [
  { id: 'java',   label: 'Java',   emoji: '☕', color: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-400/30', text: 'text-amber-200', dot: 'bg-amber-400' },
  { id: 'c',      label: 'C',      emoji: '🔷', color: 'from-sky-500/20 to-blue-500/10',    border: 'border-sky-400/30',   text: 'text-sky-200',   dot: 'bg-sky-400'   },
  { id: 'python', label: 'Python', emoji: '🐍', color: 'from-teal-500/20 to-green-500/10', border: 'border-teal-400/30',  text: 'text-teal-200',  dot: 'bg-teal-400'  },
];

const LearnLayout = () => {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (lang && !LANGUAGES.some((l) => l.id === lang)) {
      navigate('/learn/java', { replace: true });
    }
  }, [lang, navigate]);

  const { data: chapters, isLoading, isError, refetch } = useQuery({
    queryKey: ['chapters', lang],
    queryFn: () => learnApi.getChapters(lang!),
    enabled: !!lang,
  });

  const flatLessons = chapters?.flatMap((c) => c.lessons) || [];
  const totalLessons = flatLessons.length;
  const completedLessons = flatLessons.filter((l) => l.completed).length;
  const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  const activeLang = LANGUAGES.find((l) => l.id === lang) ?? LANGUAGES[0];

  return (
    <div className="grid h-[calc(100vh-64px)] overflow-hidden bg-transparent lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* ── Sidebar ── */}
      <aside className="flex min-h-0 flex-col overflow-hidden border-b border-white/[0.07] bg-slate-950/40 lg:border-r lg:border-b-0">
        {/* Sidebar Header */}
        <div className="shrink-0 border-b border-white/[0.07] bg-slate-950/60 backdrop-blur-md">
          <div className="p-4">
            {/* Header row */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-400/10 text-teal-300">
                <BookOpen size={15} />
              </div>
              <h2 className="font-bold text-white text-sm">Mục lục khóa học</h2>
            </div>

            {/* Language tabs */}
            <div className="flex gap-1.5">
              {LANGUAGES.map((l) => (
                <Link
                  key={l.id}
                  to={`/learn/${l.id}`}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold transition-all duration-200 ${
                    lang === l.id
                      ? `bg-gradient-to-b ${l.color} border ${l.border} ${l.text}`
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <span>{l.emoji}</span>
                  <span>{l.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Tiến độ học</span>
              <span className="text-[11px] font-bold text-slate-300">{completedLessons}/{totalLessons} bài</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${activeLang.dot}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-1 text-right text-[11px] font-semibold text-slate-500">
              {progressPercent}%
            </div>
          </div>
        </div>

        {/* Chapter list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-3">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-xs">Đang tải...</span>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                <AlertCircle size={20} />
              </div>
              <p className="mb-4 text-sm text-slate-400">Không thể tải dữ liệu.</p>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5 transition-colors"
              >
                <RefreshCw size={12} />
                Thử lại
              </button>
            </div>
          )}

          {chapters && chapters.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-slate-500">Chưa có bài học nào.</p>
            </div>
          )}

          {chapters && chapters.length > 0 && (
            <ChapterTree chapters={chapters} lang={lang!} />
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="min-h-0 overflow-y-auto custom-scrollbar bg-slate-950/20">
        <div className="mx-auto max-w-4xl p-6 min-h-full md:p-10">
          <Outlet context={{ chapters, lang }} />
        </div>
      </main>
    </div>
  );
};

export default LearnLayout;
