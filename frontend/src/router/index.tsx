import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Loader2 } from 'lucide-react';

const LazyLoad = (Component: React.ComponentType<any>) => (
  <Suspense fallback={
    <div className="flex justify-center items-center py-32 text-slate-400">
      <Loader2 size={24} className="animate-spin" />
    </div>
  }>
    <Component />
  </Suspense>
);

const Home = lazy(() => import('@/pages/Home'));
const LearnLayout = lazy(() => import('@/pages/learn/LearnLayout'));
const LearnWelcome = lazy(() => import('@/pages/learn/LearnWelcome'));
const LessonPage = lazy(() => import('@/pages/learn/LessonPage'));
const ChallengePage = lazy(() => import('@/pages/learn/ChallengePage'));
const ExamListPage = lazy(() => import('@/pages/exam/ExamListPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PageLayout />,
    children: [
      { index: true, element: LazyLoad(Home) },
      {
        path: 'learn',
        children: [
          {
            index: true,
            element: <Navigate to="/learn/java" replace />,
          },
          {
            path: ':lang',
            element: LazyLoad(LearnLayout),
            children: [
              {
                index: true,
                element: LazyLoad(LearnWelcome),
              },
              {
                path: 'lesson/:id',
                element: LazyLoad(LessonPage),
              },
              {
                path: 'lesson/:id/challenge',
                element: LazyLoad(ChallengePage),
              },
            ],
          },
        ],
      },
      { path: 'exam', element: LazyLoad(ExamListPage) },
      { path: 'exam/problems/:id', element: LazyLoad(ExamListPage) },
      { path: 'battle', element: <div>Battle Module (Coming soon)</div> },
      { path: 'chat', element: <div>Chat Module (Coming soon)</div> },
      { path: 'profile', element: <div>User Profile (Coming soon)</div> },
    ],
  },
]);
