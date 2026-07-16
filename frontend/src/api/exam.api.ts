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

export type JudgeResult = 'PENDING' | 'AC' | 'WA' | 'TLE' | 'RE' | 'CE';
export type ExamLanguage = 'java' | 'c' | 'python';

export interface SubmissionDto {
  id: string;
  problemId: string;
  language: ExamLanguage;
  result: JudgeResult;
  points: number;
  executionTime: number | null;
  memoryUsed: number | null;
  output: string | null;
  errorOutput: string | null;
  submittedAt: string | null;
}

export interface ExamLeaderboardEntryDto {
  rank: number;
  userId: string;
  userName: string;
  points: number;
  executionTime: number | null;
  memoryUsed: number | null;
  submittedAt: string | null;
  acceptedCount: number;
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

  submit: (problemId: string, sourceCode: string, language: ExamLanguage) =>
    apiClient.post<SubmissionDto>(`/exam/problems/${problemId}/submissions`, { sourceCode, language }).then(r => r.data),

  getSubmissions: (problemId: string) =>
    apiClient.get<SubmissionDto[]>(`/exam/problems/${problemId}/submissions`).then(r => r.data),

  getLeaderboard: (problemId: string, language: ExamLanguage = 'python', limit: number = 20) =>
    apiClient.get<ExamLeaderboardEntryDto[]>(`/exam/problems/${problemId}/leaderboard`, { params: { language, limit } }).then(r => r.data),
};
