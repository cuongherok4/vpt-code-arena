import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

type ReadyUpdate = {
  roomId: string;
  userId: string;
  isReady: boolean;
  readyCount: number;
  totalMembers: number;
};

type LeaderboardEvent = {
  roomId?: string;
  leaderboard: unknown[];
};

type SubmissionResultEvent = {
  submissionId: string;
  problemId: string;
  result: string;
  points: number;
  executionTime?: number | null;
  output?: string | null;
  errorOutput?: string | null;
};

type FinishedEvent = {
  roomId?: string;
  finalLeaderboard: unknown[];
};

type MemberEvent = {
  roomId: string;
  userId: string;
  name?: string;
  memberCount: number;
};

type BattleSocketOptions = {
  roomId?: string;
  onJoined?: () => void;
  onMemberChange?: (event: MemberEvent) => void;
  onReadyUpdate?: (event: ReadyUpdate) => void;
  onStarted?: () => void;
  onTick?: (remainingSeconds: number) => void;
  onLeaderboardUpdate?: (leaderboard: unknown[]) => void;
  onSubmissionResult?: (result: SubmissionResultEvent) => void;
  onFinished?: (leaderboard: unknown[]) => void;
  onError?: (message: string) => void;
};

const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export function useBattleSocket({
  roomId,
  onJoined,
  onMemberChange,
  onReadyUpdate,
  onStarted,
  onTick,
  onLeaderboardUpdate,
  onSubmissionResult,
  onFinished,
  onError,
}: BattleSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId') || '3fa85f64-5717-4562-b3fc-2c963f66afa6';
    const name = localStorage.getItem('userName') || 'Dev User';
    const socket = io(`${wsUrl}/battle`, {
      transports: ['websocket'],
      auth: token ? { token: `Bearer ${token}` } : { userId, name },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('battle:join', { roomId }, (response: { success: boolean; error?: string }) => {
        if (response.success) onJoined?.();
        else onError?.(response.error || 'Không thể kết nối phòng battle.');
      });
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (error) => onError?.(error.message || 'Không thể kết nối WebSocket.'));
    socket.on('battle:error', (error: { message?: string; code?: string }) => {
      onError?.(error.message || error.code || 'Lỗi WebSocket battle.');
    });
    socket.on('battle:member-joined', onMemberChange || (() => undefined));
    socket.on('battle:member-left', onMemberChange || (() => undefined));
    socket.on('battle:ready-update', onReadyUpdate || (() => undefined));
    socket.on('battle:started', () => onStarted?.());
    socket.on('battle:tick', (event: { remainingSeconds?: number }) => {
      if (typeof event.remainingSeconds === 'number') onTick?.(event.remainingSeconds);
    });
    socket.on('battle:leaderboard-update', (event: LeaderboardEvent) => {
      onLeaderboardUpdate?.(event.leaderboard ?? []);
    });
    socket.on('battle:submission-result', (event: SubmissionResultEvent) => onSubmissionResult?.(event));
    socket.on('battle:finished', (event: FinishedEvent) => onFinished?.(event.finalLeaderboard ?? []));

    return () => {
      socket.emit('battle:leave', { roomId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    roomId,
    onJoined,
    onMemberChange,
    onReadyUpdate,
    onStarted,
    onTick,
    onLeaderboardUpdate,
    onSubmissionResult,
    onFinished,
    onError,
  ]);

  const setReady = useCallback((ready: boolean) => {
    if (!roomId || !socketRef.current?.connected) return;
    socketRef.current.emit('battle:ready', { roomId, ready });
  }, [roomId]);

  return { connected, setReady };
}
