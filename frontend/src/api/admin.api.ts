import { apiClient } from './client';
import type { Difficulty } from './exam.api';
import type { Role } from './auth.api';

export interface AdminUser {
  id: string;
  publicId: string;
  email: string;
  name: string;
  role: Role;
  emailVerified: boolean;
  banned: boolean;
  oauthProvider?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminProblemTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface AdminProblemPayload {
  title: string;
  description: string;
  difficulty: Difficulty;
  topic: string;
  timeLimitMs: number;
  memoryLimitKb: number;
  testCases: AdminProblemTestCase[];
  solutionCode?: string;
  published: boolean;
}

export interface AdminProblem extends AdminProblemPayload {
  id: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminStats {
  totalUsers: number;
  activeUsersToday: number;
  totalProblems: number;
  publishedProblems: number;
  totalSubmissions: number;
  totalBattleRooms: number;
}

export const adminApi = {
  users: (params: { search?: string; page?: number; size?: number } = {}) =>
    apiClient.get<PageResponse<AdminUser>>('/admin/users', { params }).then((res) => res.data),

  setUserBan: (userId: string, banned: boolean) =>
    apiClient.put<AdminUser>(`/admin/users/${userId}/ban`, { banned }).then((res) => res.data),

  problems: (params: { search?: string; difficulty?: Difficulty | ''; published?: boolean | ''; page?: number; size?: number } = {}) =>
    apiClient.get<PageResponse<AdminProblem>>('/admin/problems', {
      params: {
        ...params,
        difficulty: params.difficulty || undefined,
        published: params.published === '' ? undefined : params.published,
      },
    }).then((res) => res.data),

  createProblem: (payload: AdminProblemPayload) =>
    apiClient.post<AdminProblem>('/admin/problems', payload).then((res) => res.data),

  updateProblem: (problemId: string, payload: AdminProblemPayload) =>
    apiClient.put<AdminProblem>(`/admin/problems/${problemId}`, payload).then((res) => res.data),

  deleteProblem: (problemId: string) =>
    apiClient.delete(`/admin/problems/${problemId}`).then((res) => res.data),

  stats: () =>
    apiClient.get<AdminStats>('/admin/stats').then((res) => res.data),
};
