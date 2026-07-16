import { apiClient } from './client';

export interface LessonDto {
  id: string;
  title: string;
  order: number;
  hasChallenge: boolean;
  completed: boolean;
  challengePassed: boolean;
}

export interface ChapterDto {
  id: string;
  title: string;
  description: string;
  order: number;
  groupName: string;
  lessons: LessonDto[];
}

export interface LessonDetailDto {
  id: string;
  chapterId: string;
  title: string;
  content: string;
  order: number;
  hasChallenge: boolean;
  challengeDescription: string;
  completed: boolean;
  challengePassed: boolean;
}

export interface RunCodeResponse {
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  status: string;
  expectedOutput: string | null;
  time: string | null;
  memory: string | null;
  passed: boolean;
}

export const learnApi = {
  getChapters: (language: string = 'java') => apiClient.get<ChapterDto[]>('/learn/chapters', { params: { language } }).then(r => r.data),
  getLesson: (id: string) => apiClient.get<LessonDetailDto>(`/learn/lessons/${id}`).then(r => r.data),
  completeLesson: (id: string) => apiClient.post(`/learn/lessons/${id}/complete`),
  runCode: (sourceCode: string, languageId: number) =>
    apiClient.post<RunCodeResponse>('/learn/run-code', { sourceCode, languageId }).then(r => r.data),
  submitChallenge: (id: string, sourceCode: string, languageId: number) =>
    apiClient.post<RunCodeResponse>(`/learn/lessons/${id}/challenge`, { sourceCode, languageId }).then(r => r.data),
};
