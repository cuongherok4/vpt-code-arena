import { apiClient } from '@/api/client';

export type LeaderboardLanguage = 'all' | 'java' | 'python' | 'c';

export type GlobalLeaderboardEntry = {
  rank: number;
  userId: string;
  publicId: string;
  userName: string;
  totalPoints: number;
  totalAccepted: number;
  lastAcceptedAt: string | null;
};

export const leaderboardApi = {
  global: (language: LeaderboardLanguage, limit = 50) =>
    apiClient
      .get<GlobalLeaderboardEntry[]>('/leaderboard/global', {
        params: {
          type: 'exam',
          language: language === 'all' ? undefined : language,
          limit,
        },
      })
      .then((res) => res.data),
};
