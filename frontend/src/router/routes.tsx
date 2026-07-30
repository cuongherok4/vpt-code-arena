import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { RouteErrorFallback } from '@/components/common/RouteErrorFallback';
import { NotFoundPage } from '@/components/common/NotFoundPage';
import { LazyLoad } from './LazyLoad';

const homePage = lazy(() => import('@/pages/Home'));
const learnLayout = lazy(() => import('@/pages/learn/LearnLayout'));
const learnWelcome = lazy(() => import('@/pages/learn/LearnWelcome'));
const lessonPage = lazy(() => import('@/pages/learn/LessonPage'));
const challengePage = lazy(() => import('@/pages/learn/ChallengePage'));
const examListPage = lazy(() => import('@/pages/exam/ExamListPage'));
const examProblemPage = lazy(() => import('@/pages/exam/ExamProblemPage'));
const battleLobbyPage = lazy(() => import('@/pages/battle/BattleLobbyPage'));
const battleRoomPage = lazy(() => import('@/pages/battle/BattleRoomPage'));
const chatPage = lazy(() => import('@/pages/chat/ChatPage'));
const friendsPage = lazy(() => import('@/pages/social/FriendsPage'));
const leaderboardPage = lazy(() => import('@/pages/leaderboard/LeaderboardPage'));
const adminPage = lazy(() => import('@/pages/admin/AdminPage'));
const loginPage = lazy(() => import('@/pages/auth/LoginPage'));
const registerPage = lazy(() => import('@/pages/auth/RegisterPage'));
const forgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const resetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const verifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));
const oAuthCallbackPage = lazy(() => import('@/pages/auth/OAuthCallbackPage'));
const profilePage = lazy(() => import('@/pages/auth/ProfilePage'));

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <PageLayout />,
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, element: LazyLoad(homePage) },
      {
        path: 'learn',
        children: [
          { index: true, element: <Navigate to="/learn/java" replace /> },
          {
            path: ':lang',
            element: LazyLoad(learnLayout),
            children: [
              { index: true, element: LazyLoad(learnWelcome) },
              { path: 'lesson/:id', element: LazyLoad(lessonPage) },
              { path: 'lesson/:id/challenge', element: LazyLoad(challengePage) },
            ],
          },
        ],
      },
      { path: 'exam', element: LazyLoad(examListPage) },
      { path: 'exam/problems/:id', element: LazyLoad(examProblemPage) },
      { path: 'battle', element: LazyLoad(battleLobbyPage) },
      { path: 'battle/rooms/:roomId', element: LazyLoad(battleRoomPage) },
      { path: 'chat', element: LazyLoad(chatPage) },
      { path: 'friends', element: LazyLoad(friendsPage) },
      { path: 'leaderboard', element: LazyLoad(leaderboardPage) },
      { path: 'profile', element: LazyLoad(profilePage) },
    ],
  },
  { path: '/login', element: LazyLoad(loginPage), errorElement: <RouteErrorFallback /> },
  { path: '/register', element: LazyLoad(registerPage), errorElement: <RouteErrorFallback /> },
  { path: '/forgot-password', element: LazyLoad(forgotPasswordPage), errorElement: <RouteErrorFallback /> },
  { path: '/reset-password', element: LazyLoad(resetPasswordPage), errorElement: <RouteErrorFallback /> },
  { path: '/verify-email', element: LazyLoad(verifyEmailPage), errorElement: <RouteErrorFallback /> },
  { path: '/auth/callback', element: LazyLoad(oAuthCallbackPage), errorElement: <RouteErrorFallback /> },
  { path: '/admin', element: LazyLoad(adminPage), errorElement: <RouteErrorFallback /> },
  { path: '*', element: <NotFoundPage /> },
];
