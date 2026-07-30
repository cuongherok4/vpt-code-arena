import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import type { BattleInviteEvent } from './useBattleSocket';

const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export type { BattleInviteEvent };

export function useBattleInviteSocket(onInvite: (event: BattleInviteEvent) => void) {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setConnected(false);
      return;
    }

    const socket: Socket = io(`${wsUrl}/battle`, {
      transports: ['websocket'],
      auth: { token: `Bearer ${accessToken}` },
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('battle:invite-received', (event: BattleInviteEvent) => onInvite(event));

    return () => {
      socket.disconnect();
    };
  }, [accessToken, isAuthenticated, onInvite]);

  return { connected };
}
