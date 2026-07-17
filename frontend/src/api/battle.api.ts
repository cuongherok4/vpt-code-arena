import { apiClient } from './client';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type RoomStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';

export type BattleMemberDto = {
  userId: string;
  name: string;
  ready: boolean;
  creator: boolean;
  joinedAt?: string;
};

export type BattleProblemDto = {
  id: string;
  title: string;
  difficulty: Difficulty;
  topic?: string;
  order: number;
};

export type BattleSubmissionDto = {
  id: string;
  submissionId: string;
  roomId: string;
  userId: string;
  problemId: string;
  language: BattleLanguage;
  result: JudgeResult;
  status: JudgeResult;
  points: number;
  executionTime?: number | null;
  output?: string | null;
  errorOutput?: string | null;
  submittedAt: string;
};

export type BattleLeaderboardEntryDto = {
  userId: string;
  name: string;
  rank: number;
  totalPoints: number;
  acceptedCount: number;
  lastAcceptedAt?: string | null;
  lastAcTime?: string | null;
};

export type BattleLanguage = 'java' | 'c' | 'python';
export type JudgeResult = 'PENDING' | 'AC' | 'WA' | 'TLE' | 'RE' | 'CE';

export type BattleRoomDto = {
  id: string;
  name: string;
  status: RoomStatus;
  isPublic: boolean;
  maxMembers: number;
  numProblems: number;
  timeLimitMin: number;
  difficulty?: Difficulty | null;
  topic?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  creatorId: string;
  creatorName: string;
  memberCount: number;
  members: BattleMemberDto[];
  problems: BattleProblemDto[];
};

export type BattleRoomCreateRequest = {
  name: string;
  isPublic: boolean;
  maxMembers: number;
  numProblems: number;
  timeLimitMin: number;
  difficulty?: Difficulty | null;
  topic?: string | null;
};

export const battleApi = {
  getRooms: () => apiClient.get<BattleRoomDto[]>('/battle/rooms').then(r => r.data),
  getRoom: (roomId: string) => apiClient.get<BattleRoomDto>(`/battle/rooms/${roomId}`).then(r => r.data),
  createRoom: (payload: BattleRoomCreateRequest) => apiClient.post<BattleRoomDto>('/battle/rooms', payload).then(r => r.data),
  joinRoom: (roomId: string) => apiClient.post<BattleRoomDto>(`/battle/rooms/${roomId}/join`).then(r => r.data),
  leaveRoom: (roomId: string) => apiClient.post<BattleRoomDto | void>(`/battle/rooms/${roomId}/leave`).then(r => r.data),
  startRoom: (roomId: string) => apiClient.post<BattleRoomDto>(`/battle/rooms/${roomId}/start`).then(r => r.data),
  finishRoom: (roomId: string) =>
    apiClient.post<BattleLeaderboardEntryDto[]>(`/battle/rooms/${roomId}/finish`).then(r => r.data),
  submit: (roomId: string, problemId: string, sourceCode: string, language: BattleLanguage) =>
    apiClient.post<BattleSubmissionDto>(`/battle/rooms/${roomId}/submissions`, { problemId, sourceCode, language }).then(r => r.data),
  getLeaderboard: (roomId: string) =>
    apiClient.get<BattleLeaderboardEntryDto[]>(`/battle/rooms/${roomId}/leaderboard`).then(r => r.data),
};
