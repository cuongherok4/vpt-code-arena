import { apiClient } from './client';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface ProblemListItemDto {
  id: string;
  title: string;
  difficulty: Difficulty;
  topic: string;
  timeLimitMs: number;
  memoryLimitKb: number;
}

export interface SampleCaseDto {
  input: string;
  expected: string;
}

export interface ProblemDetailDto extends ProblemListItemDto {
  description: string;
  sampleCases: SampleCaseDto[];
}

export interface ProblemFilters {
  difficulty?: Difficulty | '';
  topic?: string;
  keyword?: string;
}

export const examApi = {
  getProblems: (filters: ProblemFilters = {}) =>
    apiClient.get<ProblemListItemDto[]>('/exam/problems', {
      params: {
        difficulty: filters.difficulty || undefined,
        topic: filters.topic || undefined,
        keyword: filters.keyword || undefined,
      },
    }).then(r => r.data),

  getProblem: (id: string) =>
    apiClient.get<ProblemDetailDto>(`/exam/problems/${id}`).then(r => r.data),
};
