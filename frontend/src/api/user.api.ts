import { apiClient } from '@/api/client';
import type { AuthUser, Role } from '@/api/auth.api';

export type UserProfile = AuthUser & {
  oauthProvider: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type UserSubmissionHistory = {
  id: string;
  type: 'EXAM' | 'BATTLE';
  problemId: string;
  problemTitle: string;
  roomId: string | null;
  roomName: string | null;
  language: string;
  result: 'PENDING' | 'AC' | 'WA' | 'TLE' | 'RE' | 'CE';
  points: number;
  executionTime: number | null;
  submittedAt: string | null;
};

const toAuthUser = (profile: UserProfile): AuthUser => ({
  id: profile.id,
  publicId: profile.publicId,
  email: profile.email,
  name: profile.name,
  role: profile.role as Role,
  emailVerified: profile.emailVerified,
});

export const userApi = {
  me: () => apiClient.get<UserProfile>('/users/me').then((res) => res.data),
  updateMe: (payload: { name: string }) =>
    apiClient.put<UserProfile>('/users/me', payload).then((res) => res.data),
  history: () =>
    apiClient.get<UserSubmissionHistory[]>('/users/me/history').then((res) => res.data),
  toAuthUser,
};
