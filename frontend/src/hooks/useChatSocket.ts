import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ChatMessage } from '@/api/chat.api';
import { useAuthStore } from '@/stores/authStore';

type SocketAck<T = unknown> = {
  success: boolean;
  error?: string;
  message?: T;
  userIds?: string[];
};

type OnlineUser = {
  userId: string;
  name?: string;
};

type ChatSocketOptions = {
  enabled?: boolean;
  onMessage?: (message: ChatMessage) => void;
  onDirectMessage?: (message: ChatMessage) => void;
  onError?: (message: string) => void;
};

const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export function useChatSocket({ enabled = true, onMessage, onDirectMessage, onError }: ChatSocketOptions) {
  const { accessToken, user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const onMessageRef = useRef(onMessage);
  const onDirectMessageRef = useRef(onDirectMessage);
  const onErrorRef = useRef(onError);
  const refreshingTokenRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    onMessageRef.current = onMessage;
    onDirectMessageRef.current = onDirectMessage;
    onErrorRef.current = onError;
  }, [onMessage, onDirectMessage, onError]);

  useEffect(() => {
    if (!enabled || !accessToken || !user?.id) {
      setConnected(false);
      setOnlineUserIds(new Set());
      return;
    }

    const socket = io(`${wsUrl}/chat`, {
      transports: ['websocket'],
      auth: { token: `Bearer ${accessToken}` },
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', async (error) => {
      if (error.message === 'UNAUTHORIZED') {
        if (refreshingTokenRef.current === accessToken) return;
        refreshingTokenRef.current = accessToken;
        const refreshed = await useAuthStore.getState().refresh();
        if (!refreshed) onErrorRef.current?.('Phiên đăng nhập đã hết hạn.');
        return;
      }
      onErrorRef.current?.(error.message || 'Không thể kết nối chat.');
    });
    socket.on('chat:error', (error: { message?: string; code?: string }) => {
      onErrorRef.current?.(error.message || error.code || 'Lỗi chat realtime.');
    });
    socket.on('chat:online-users', (event: { userIds?: string[] }) => {
      setOnlineUserIds(new Set(event.userIds ?? []));
    });
    socket.on('chat:user-online', (event: OnlineUser) => {
      setOnlineUserIds((prev) => new Set(prev).add(event.userId));
    });
    socket.on('chat:user-offline', (event: OnlineUser) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(event.userId);
        return next;
      });
    });
    socket.on('chat:message', (message: ChatMessage) => onMessageRef.current?.(message));
    socket.on('chat:dm', (message: ChatMessage) => onDirectMessageRef.current?.(message));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, enabled, user?.id]);

  const emit = useCallback(<T = unknown,>(event: string, payload?: Record<string, unknown>) => {
    return new Promise<SocketAck<T>>((resolve) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        resolve({ success: false, error: 'SOCKET_DISCONNECTED', message: 'Chat chưa kết nối.' as T });
        return;
      }
      socket.emit(event, payload ?? {}, (response: SocketAck<T>) => resolve(response));
    });
  }, []);

  const joinGlobal = useCallback(() => emit<string>('chat:join-global'), [emit]);
  const leaveGlobal = useCallback(() => emit<string>('chat:leave-global'), [emit]);
  const joinRoom = useCallback((roomId: string) => emit<string>('chat:join-room', { roomId }), [emit]);
  const leaveRoom = useCallback((roomId: string) => emit<string>('chat:leave-room', { roomId }), [emit]);
  const refreshOnlineUsers = useCallback(async () => {
    const response = await emit<{ userIds?: string[] }>('chat:get-online-users');
    const userIds = response.userIds ?? response.message?.userIds;
    if (response.success && Array.isArray(userIds)) {
      setOnlineUserIds(new Set(userIds));
    }
    return response;
  }, [emit]);
  const sendGlobal = useCallback(async (message: string) => {
    const response = await emit<ChatMessage>('chat:send-global', { message });
    if (response.success && isChatMessage(response.message)) onMessageRef.current?.(response.message);
    return response;
  }, [emit]);
  const sendRoom = useCallback(async (roomId: string, message: string) => {
    const response = await emit<ChatMessage>('chat:send-room', { roomId, message });
    if (response.success && isChatMessage(response.message)) onMessageRef.current?.(response.message);
    return response;
  }, [emit]);
  const sendDirect = useCallback(async (toUserId: string, message: string) => {
    const response = await emit<ChatMessage>('chat:send-dm', { toUserId, message });
    if (response.success && isChatMessage(response.message)) onDirectMessageRef.current?.(response.message);
    return response;
  }, [emit]);

  return {
    connected,
    onlineUserIds,
    joinGlobal,
    leaveGlobal,
    joinRoom,
    leaveRoom,
    refreshOnlineUsers,
    sendGlobal,
    sendRoom,
    sendDirect,
  };
}

function isChatMessage(value: unknown): value is ChatMessage {
  return typeof value === 'object'
    && value !== null
    && 'id' in value
    && 'channel' in value
    && 'message' in value;
}
