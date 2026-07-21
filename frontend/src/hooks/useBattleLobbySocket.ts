import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export function useBattleLobbySocket(onLobbyUpdated: () => void) {
  const { accessToken, user } = useAuthStore();
  const callbackRef = useRef(onLobbyUpdated);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    callbackRef.current = onLobbyUpdated;
  }, [onLobbyUpdated]);

  useEffect(() => {
    if (!accessToken || !user?.id) {
      setConnected(false);
      return;
    }

    const socket: Socket = io(`${wsUrl}/battle`, {
      transports: ['websocket'],
      auth: { token: `Bearer ${accessToken}` },
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('battle:join-lobby');
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('battle:lobby-updated', () => callbackRef.current());

    return () => {
      socket.emit('battle:leave-lobby');
      socket.disconnect();
    };
  }, [accessToken, user?.id]);

  return { connected };
}
