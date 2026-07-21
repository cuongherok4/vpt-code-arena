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
const ExamProblemPage = lazy(() => import('@/pages/exam/ExamProblemPage'));
const BattleLobbyPage = lazy(() => import('@/pages/battle/BattleLobbyPage'));
const BattleRoomPage = lazy(() => import('@/pages/battle/BattleRoomPage'));
const ChatPage = lazy(() => import('@/pages/chat/ChatPage'));
const FriendsPage = lazy(() => import('@/pages/social/FriendsPage'));
const LeaderboardPage = lazy(() => import('@/pages/leaderboard/LeaderboardPage'));
const AdminPage = lazy(() => import('@/pages/admin/AdminPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));
const OAuthCallbackPage = lazy(() => import('@/pages/auth/OAuthCallbackPage'));
const ProfilePage = lazy(() => import('@/pages/auth/ProfilePage'));

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
      { path: 'exam/problems/:id', element: LazyLoad(ExamProblemPage) },
      { path: 'battle', element: LazyLoad(BattleLobbyPage) },
      { path: 'battle/rooms/:roomId', element: LazyLoad(BattleRoomPage) },
      { path: 'chat', element: LazyLoad(ChatPage) },
      { path: 'friends', element: LazyLoad(FriendsPage) },
      { path: 'leaderboard', element: LazyLoad(LeaderboardPage) },
      { path: 'profile', element: LazyLoad(ProfilePage) },
    ],
  },
  { path: '/login', element: LazyLoad(LoginPage) },
  { path: '/register', element: LazyLoad(RegisterPage) },
  { path: '/forgot-password', element: LazyLoad(ForgotPasswordPage) },
  { path: '/reset-password', element: LazyLoad(ResetPasswordPage) },
  { path: '/verify-email', element: LazyLoad(VerifyEmailPage) },
  { path: '/auth/callback', element: LazyLoad(OAuthCallbackPage) },
  {
    path: '/admin',
    element: LazyLoad(AdminPage),
  },
]);
