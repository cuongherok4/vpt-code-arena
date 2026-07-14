import { useQuery } from '@tanstack/react-query';
import { Outlet, useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { learnApi } from '@/api/learn.api';
import ChapterTree from '@/components/learn/ChapterTree';
import { useEffect } from 'react';

const LANGUAGES = [
  { id: 'java', label: 'Java' },
  { id: 'c', label: 'C' },
  { id: 'python', label: 'Python' }
];

const LearnLayout = () => {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();

  // Redirect to java if invalid lang
  useEffect(() => {
    if (lang && !LANGUAGES.some(l => l.id === lang)) {
      navigate('/learn/java', { replace: true });
    }
  }, [lang, navigate]);

  const { data: chapters, isLoading, isError, refetch } = useQuery({
    queryKey: ['chapters', lang],
    queryFn: () => learnApi.getChapters(lang!),
    enabled: !!lang,
  });

  // Tính toán tiến độ tổng thể của ngôn ngữ
  const flatLessons = chapters?.flatMap(c => c.lessons) || [];
  const totalLessons = flatLessons.length;
  const completedLessons = flatLessons.filter(l => l.completed).length;
  const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#0B0F19]">
      {/* Sidebar */}
      <div className="w-72 shrink-0 border-r border-white/10 flex flex-col bg-slate-950/30 overflow-hidden">
        
        {/* Header & Tabs */}
        <div className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md z-10 shrink-0">
          <div className="p-4 pb-2">
            <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-violet-400" />
              Mục lục khóa học
            </h2>

            {/* Language Tabs */}
            <div className="flex gap-2">
              {LANGUAGES.map(l => (
                <Link
                  key={l.id}
                  to={`/learn/${l.id}`}
                  className={`flex-1 text-center py-1.5 text-xs font-medium rounded-md transition-colors ${
                    lang === l.id 
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Tiến độ học</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <Loader2 size={24} className="animate-spin text-violet-500" />
              <span className="text-sm">Đang tải danh sách...</span>
            </div>
          )}

          {isError && (
            <div className="px-4 text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-400 mb-3">
                <AlertCircle size={24} />
              </div>
              <p className="text-slate-300 text-sm mb-4">Không thể tải dữ liệu.</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg transition-colors border border-white/10"
              >
                Thử lại
              </button>
            </div>
          )}

          {chapters && chapters.length === 0 && (
            <div className="px-4 text-center py-8">
              <p className="text-slate-400 text-sm">Chưa có bài học nào.</p>
            </div>
          )}

          {chapters && chapters.length > 0 && <ChapterTree chapters={chapters} lang={lang!} />}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50">
        <div className="max-w-4xl mx-auto p-6 md:p-10 min-h-full">
          <Outlet context={{ chapters, lang }} />
        </div>
      </div>
    </div>
  );
};

export default LearnLayout;
