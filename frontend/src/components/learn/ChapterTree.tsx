import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Circle, BookOpen, Zap, Code2 } from 'lucide-react';
import type { ChapterDto } from '@/api/learn.api';

interface Props {
  chapters: ChapterDto[];
  lang: string;
}

export const ChapterTree = ({ chapters, lang }: Props) => {
  const { pathname } = useLocation();

  return (
    <nav className="pb-8">
      {chapters.map((chapter) => {
        return (
          <div key={chapter.id} className="mb-6">
            {/* Chapter Header */}
            <h3 className="px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              {chapter.title}
            </h3>

            {/* Lessons List */}
            <ul className="space-y-0.5">
              {chapter.lessons.map((lesson) => {
                const href = `/learn/${lang}/lesson/${lesson.id}`;
                const isActive = pathname === href;

                return (
                  <li key={lesson.id}>
                    <Link
                      to={href}
                      className={`flex items-start gap-3 px-4 py-2 transition-colors text-sm rounded-lg mx-2
                        ${isActive
                          ? 'bg-violet-600/20 text-violet-300'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }
                      `}
                    >
                      <div className="mt-0.5 shrink-0">
                        {lesson.completed ? (
                          <CheckCircle size={14} className="text-green-400" />
                        ) : lesson.hasChallenge ? (
                          <Zap size={14} className={lesson.challengePassed ? "text-yellow-400" : "text-yellow-600/50"} />
                        ) : (
                          <BookOpen size={14} className="text-slate-600" />
                        )}
                      </div>
                      <span className="flex-1 leading-snug">{lesson.title}</span>
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
