import { lazy, Suspense } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Loader2, AlertCircle, Zap, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { learnApi, type ChapterDto } from '@/api/learn.api';

const TryItEditor = lazy(() => import('@/components/learn/TryItEditor'));

const LessonPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { chapters, lang } = useOutletContext<{ chapters: ChapterDto[], lang: string }>();

  const { data: lesson, isLoading, isError } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => learnApi.getLesson(id!),
    enabled: !!id,
  });

  const completeMutation = useMutation({
    mutationFn: () => learnApi.completeLesson(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      queryClient.invalidateQueries({ queryKey: ['lesson', id] });
    },
  });

  // Tính toán Previous / Next
  const flatLessons = chapters?.flatMap(c => c.lessons) || [];
  const currentIndex = flatLessons.findIndex(l => l.id === id);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex !== -1 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400 gap-3">
        <Loader2 size={20} className="animate-spin text-violet-500" />
        <span>Đang tải bài học...</span>
      </div>
    );
  }

  if (isError || !lesson) {
    return (
      <div>
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-4">
          <AlertCircle size={18} />
          <span className="text-sm">Không tìm thấy bài học này.</span>
        </div>
      </div>
    );
  }

  const renderNavButtons = () => (
    <div className="flex items-center justify-between py-4 border-y border-white/10 my-8">
      {prevLesson ? (
        <Link
          to={`/learn/${lang}/lesson/${prevLesson.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm"
        >
          <ChevronLeft size={16} />
          Previous
        </Link>
      ) : (
        <div /> // Spacer
      )}

      {nextLesson ? (
        <Link
          to={`/learn/${lang}/lesson/${nextLesson.id}`}
          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors text-sm"
        >
          Next
          <ChevronRight size={16} />
        </Link>
      ) : (
        <div />
      )}
    </div>
  );

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-3">{lesson.title}</h1>
        
        {/* Top Nav */}
        {renderNavButtons()}

        {/* Status badges */}
        <div className="flex gap-2 mb-6">
          {lesson.completed && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-green-500/15 text-green-400 rounded-full border border-green-500/20">
              <CheckCircle size={11} /> Đã hoàn thành
            </span>
          )}
          {lesson.challengePassed && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-yellow-500/15 text-yellow-400 rounded-full border border-yellow-500/20">
              <Zap size={11} /> Challenge passed
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="prose prose-invert prose-sm max-w-none mb-8 text-slate-300 lesson-content-html"
        dangerouslySetInnerHTML={{ __html: lesson.content ?? '' }}
      />

      {/* Challenge description */}
      {lesson.hasChallenge && lesson.challengeDescription && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl px-6 py-5 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={15} className="text-yellow-400" />
            <span className="font-semibold text-yellow-300 text-sm">Challenge</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{lesson.challengeDescription}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {!lesson.hasChallenge && !lesson.completed && (
          <button
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {completeMutation.isPending
              ? <Loader2 size={15} className="animate-spin" />
              : <CheckCircle size={15} />
            }
            Đánh dấu hoàn thành
          </button>
        )}

        {lesson.hasChallenge && (
          <Link
            to={`/learn/${lang}/lesson/${id}/challenge`}
            className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Zap size={15} />
            Làm Challenge
          </Link>
        )}
      </div>

      {/* Try It Editor (hiện cho tất cả bài học) */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <BookOpen size={14} /> Try It — Thực hành ngay
        </h3>
        <Suspense fallback={<div className="h-40 rounded-xl bg-white/5 animate-pulse" />}>
          <TryItEditor lang={lang} />
        </Suspense>
      </div>

      {/* Bottom Nav */}
      {renderNavButtons()}
    </div>
  );
};

export default LessonPage;
