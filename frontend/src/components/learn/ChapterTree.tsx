import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, BookOpen, Zap } from 'lucide-react';
import type { ChapterDto } from '@/api/learn.api';

interface Props {
  chapters: ChapterDto[];
  lang: string;
}

const langColors: Record<string, { dot: string; active: string; activeBg: string }> = {
  java:   { dot: 'bg-amber-400',  active: 'text-amber-200',  activeBg: 'bg-amber-400/10 ring-amber-400/20' },
  c:      { dot: 'bg-sky-400',    active: 'text-sky-200',    activeBg: 'bg-sky-400/10 ring-sky-400/20' },
  python: { dot: 'bg-teal-400',   active: 'text-teal-200',   activeBg: 'bg-teal-400/10 ring-teal-400/20' },
};

export const ChapterTree = ({ chapters, lang }: Props) => {
  const { pathname } = useLocation();
  const colors = langColors[lang] ?? langColors['java'];

  return (
    <nav aria-label="Danh mục bài học" className="pb-8 px-2">
      {chapters.map((chapter, chapterIdx) => {
        const completedCount = chapter.lessons.filter((l) => l.completed).length;
        const totalCount = chapter.lessons.length;
        const chapterProgress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

        return (
          <div key={chapter.id} className="mb-5">
            {/* Chapter Header */}
            <div className="mb-2 px-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${colors.dot} shrink-0`} />
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    {chapter.title}
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {completedCount}/{totalCount}
                </span>
              </div>
              {/* Mini progress */}
              <div className="h-0.5 w-full rounded-full bg-white/[0.06]" aria-label={`Tiến độ chương ${chapter.title}: ${chapterProgress}%`}>
                <div
                  className={`h-full rounded-full transition-all duration-700 ${colors.dot}`}
                  style={{ width: `${chapterProgress}%` }}
                />
              </div>
            </div>

            {/* Lessons */}
            <ul className="space-y-0.5" role="group">
              {chapter.lessons.map((lesson, lessonIdx) => {
                const href = `/learn/${lang}/lesson/${lesson.id}`;
                const isActive = pathname === href;
                const isFirst = chapterIdx === 0 && lessonIdx === 0;

                return (
                  <li key={lesson.id}>
                    <Link
                      to={href}
                      aria-current={isActive ? 'page' : undefined}
                      className={`group flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-150 text-sm focus-visible:outline-none ${
                        isActive
                          ? `${colors.activeBg} ${colors.active} ring-1`
                          : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                      }`}
                    >
                      {/* Icon */}
                      <div className="mt-0.5 shrink-0">
                        {lesson.completed ? (
                          <CheckCircle2 size={14} className="text-teal-400" />
                        ) : lesson.hasChallenge ? (
                          <Zap
                            size={14}
                            className={lesson.challengePassed ? 'text-amber-400' : 'text-amber-600/50'}
                          />
                        ) : isFirst ? (
                          <BookOpen size={14} className={isActive ? colors.active : 'text-slate-500'} />
                        ) : (
                          <div className={`h-3.5 w-3.5 flex items-center justify-center`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-current' : 'bg-slate-600 group-hover:bg-slate-400'} transition-colors`} />
                          </div>
                        )}
                      </div>

                      {/* Label */}
                      <span className="flex-1 leading-snug">{lesson.title}</span>

                      {/* Badges */}
                      {lesson.hasChallenge && (
                        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                          lesson.challengePassed
                            ? 'bg-amber-400/15 text-amber-300'
                            : 'bg-white/[0.05] text-slate-500'
                        }`}>
                          Quiz
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
};

export default ChapterTree;
