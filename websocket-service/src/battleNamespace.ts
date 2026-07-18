import type { Namespace, Server, Socket } from 'socket.io';
import { authenticateSocket, type AuthUser } from './auth.js';

const ROOM_PREFIX = 'room:';
const USER_PREFIX = 'user:';
const DEFAULT_TICK_INTERVAL_MS = 1000;

export type BattleMember = {
  userId: string;
  name?: string;
  socketId: string;
  isReady: boolean;
  joinedAt: string;
};

export type BattleEvent =
  | { type: 'started'; roomId: string; payload: { endTime?: string; [key: string]: unknown } }
  | { type: 'submission-result'; roomId: string; userId?: string; payload: Record<string, unknown> }
  | { type: 'leaderboard-update'; roomId: string; payload: Record<string, unknown> }
  | { type: 'finished'; roomId: string; payload: Record<string, unknown> }
  | { type: 'invite'; roomId: string; userId: string; payload: Record<string, unknown> }
  | { type: 'member-kicked'; roomId: string; userId: string; payload: Record<string, unknown> };

export interface BattleStore {
  getMembers(roomId: string): Promise<BattleMember[]>;
  upsertMember(roomId: string, member: BattleMember): Promise<void>;
  updateReady(roomId: string, userId: string, ready: boolean): Promise<BattleMember | null>;
  removeMember(roomId: string, userId: string, socketId: string): Promise<BattleMember | null>;
  setRoomEndTime(roomId: string, endTime: string): Promise<void>;
  getRoomEndTime(roomId: string): Promise<string | null>;
  clearRoomEndTime(roomId: string): Promise<void>;
}

export type BattleNamespaceOptions = {
  jwtSecret: string;
  authDisabled?: boolean;
  tickIntervalMs?: number;
};

export type BattleNamespaceController = {
  namespace: Namespace;
  handleBattleEvent(event: BattleEvent): void;
  stopAllCountdowns(): void;
};

export function registerBattleNamespace(io: Server, store: BattleStore, options: BattleNamespaceOptions): BattleNamespaceController {
  const battle = io.of('/battle');
  const tickers = new Map<string, NodeJS.Timeout>();
  const tickIntervalMs = options.tickIntervalMs ?? DEFAULT_TICK_INTERVAL_MS;

  battle.use(authenticateSocket(options.jwtSecret, options.authDisabled === true));

  battle.on('connection', (socket) => {
    socket.data.joinedBattleRooms = new Set<string>();
    const connectedUser = requireUser(socket);
    socket.join(userChannel(connectedUser.userId));

    socket.on('battle:join', async (payload, ack) => {
      try {
        const roomId = requireRoomId(payload);
        const user = requireUser(socket);
        const roomName = roomChannel(roomId);
        const member: BattleMember = {
          userId: user.userId,
          name: user.name,
          socketId: socket.id,
          isReady: false,
          joinedAt: new Date().toISOString()
        };

        await socket.join(roomName);
        socket.data.joinedBattleRooms.add(roomId);
        await store.upsertMember(roomId, member);

        const members = await store.getMembers(roomId);
        ack?.({ success: true, room: { id: roomId, memberCount: members.length, members } });
        socket.to(roomName).emit('battle:member-joined', {
          roomId,
          userId: member.userId,
          name: member.name,
          memberCount: members.length
        });

        const endTime = await store.getRoomEndTime(roomId);
        if (endTime) startCountdown(roomId, endTime);
      } catch (error) {
        emitError(socket, errorCode(error), errorMessage(error));
        ack?.({ success: false, error: errorCode(error) });
      }
    });

    socket.on('battle:ready', async (payload, ack) => {
      try {
        const roomId = requireRoomId(payload);
        const ready = Boolean(payload?.ready);
        const user = requireUser(socket);
        const member = await store.updateReady(roomId, user.userId, ready);
        if (!member) throw new BattleSocketError('NOT_A_MEMBER', 'User is not in this battle room');

        const members = await store.getMembers(roomId);
        const readyCount = members.filter((item) => item.isReady).length;
        const event = {
          roomId,
          userId: user.userId,
          isReady: ready,
          readyCount,
          totalMembers: members.length
        };
        battle.to(roomChannel(roomId)).emit('battle:ready-update', event);
        ack?.({ success: true, ...event });
      } catch (error) {
        emitError(socket, errorCode(error), errorMessage(error));
        ack?.({ success: false, error: errorCode(error) });
      }
    });

    socket.on('battle:leave', async (payload, ack) => {
      try {
        const roomId = requireRoomId(payload);
        await leaveRoom(battle, store, socket, roomId);
        ack?.({ success: true });
      } catch (error) {
        emitError(socket, errorCode(error), errorMessage(error));
        ack?.({ success: false, error: errorCode(error) });
      }
    });

    socket.on('battle:invite', async (payload, ack) => {
      try {
        const user = requireUser(socket);
        const roomId = requireRoomId(payload);
        const toUserId = requireUserId(payload, 'toUserId');
        const roomNameValue = typeof payload === 'object' && payload !== null
          ? (payload as { roomName?: unknown }).roomName
          : undefined;
        const roomName = typeof roomNameValue === 'string'
          ? roomNameValue
          : 'Battle Room';
        battle.to(userChannel(toUserId)).emit('battle:invite-received', {
          roomId,
          roomName,
          inviterId: user.userId,
          inviterName: user.name,
          invitedAt: new Date().toISOString()
        });
        ack?.({ success: true });
      } catch (error) {
        emitError(socket, errorCode(error), errorMessage(error));
        ack?.({ success: false, error: errorCode(error) });
      }
    });

    socket.on('battle:kick-member', async (payload, ack) => {
      try {
        const roomId = requireRoomId(payload);
        const userId = requireUserId(payload, 'userId');
        await kickMember(battle, store, roomId, userId);
        ack?.({ success: true });
      } catch (error) {
        emitError(socket, errorCode(error), errorMessage(error));
        ack?.({ success: false, error: errorCode(error) });
      }
    });

    socket.on('disconnect', async () => {
      const rooms = Array.from(socket.data.joinedBattleRooms ?? []) as string[];
      await Promise.all(rooms.map((roomId) => leaveRoom(battle, store, socket, roomId)));
    });
  });

  function handleBattleEvent(event: BattleEvent): void {
    const roomName = roomChannel(event.roomId);
    if (event.type === 'started') {
      battle.to(roomName).emit('battle:started', event.payload);
      if (event.payload.endTime) {
        store.setRoomEndTime(event.roomId, event.payload.endTime).catch(() => undefined);
        startCountdown(event.roomId, event.payload.endTime);
      }
      return;
    }

    if (event.type === 'submission-result') {
      if (event.userId) {
        battle.to(roomName).fetchSockets().then((sockets) => {
          sockets
            .filter((client) => client.data.user?.userId === event.userId)
            .forEach((client) => client.emit('battle:submission-result', event.payload));
        }).catch(() => undefined);
      } else {
        battle.to(roomName).emit('battle:submission-result', event.payload);
      }
      return;
    }

    if (event.type === 'leaderboard-update') {
      battle.to(roomName).emit('battle:leaderboard-update', event.payload);
      return;
    }

    if (event.type === 'invite') {
      battle.to(userChannel(event.userId)).emit('battle:invite-received', {
        ...event.payload,
        invitedAt: new Date().toISOString()
      });
      return;
    }

    if (event.type === 'member-kicked') {
      kickMember(battle, store, event.roomId, event.userId).catch(() => undefined);
      return;
    }

    if (event.type === 'finished') {
      stopCountdown(event.roomId);
      store.clearRoomEndTime(event.roomId).catch(() => undefined);
      battle.to(roomName).emit('battle:finished', event.payload);
    }
  }

  function startCountdown(roomId: string, endTime: string): void {
    if (tickers.has(roomId)) return;
    const end = Date.parse(endTime);
    if (Number.isNaN(end)) return;

    const tick = () => {
      const remainingSeconds = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      battle.to(roomChannel(roomId)).emit('battle:tick', { roomId, remainingSeconds });
      if (remainingSeconds <= 0) {
        stopCountdown(roomId);
      }
    };
    tick();
    tickers.set(roomId, setInterval(tick, tickIntervalMs));
  }

  function stopCountdown(roomId: string): void {
    const ticker = tickers.get(roomId);
    if (ticker) clearInterval(ticker);
    tickers.delete(roomId);
  }

  const stopAllCountdowns = () => {
    Array.from(tickers.keys()).forEach((roomId) => stopCountdown(roomId));
  };

  return {
    namespace: battle,
    handleBattleEvent,
    stopAllCountdowns
  };
}

async function kickMember(namespace: Namespace, store: BattleStore, roomId: string, userId: string): Promise<void> {
  const roomName = roomChannel(roomId);
  const sockets = await namespace.in(roomName).fetchSockets();
  await Promise.all(sockets
    .filter((client) => client.data.user?.userId === userId)
    .map(async (client) => {
      await client.leave(roomName);
      client.data.joinedBattleRooms?.delete(roomId);
      await store.removeMember(roomId, userId, client.id);
      client.emit('battle:kicked', { roomId, userId });
    }));
  const members = await store.getMembers(roomId);
  namespace.to(roomName).emit('battle:member-kicked', { roomId, userId, memberCount: members.length });
}

async function leaveRoom(namespace: Namespace, store: BattleStore, socket: Socket, roomId: string): Promise<void> {
  const user = requireUser(socket);
  const roomName = roomChannel(roomId);
  await socket.leave(roomName);
  socket.data.joinedBattleRooms?.delete(roomId);
  const removed = await store.removeMember(roomId, user.userId, socket.id);
  const members = await store.getMembers(roomId);
  if (removed) {
    namespace.to(roomName).emit('battle:member-left', {
      roomId,
      userId: removed.userId,
      name: removed.name,
      memberCount: members.length
    });
  }
}

function requireUser(socket: Socket): AuthUser {
  const user = socket.data.user as AuthUser | undefined;
  if (!user?.userId) throw new BattleSocketError('UNAUTHORIZED', 'Authentication required');
  return user;
}

function requireRoomId(payload: unknown): string {
  const roomId = typeof payload === 'object' && payload !== null && 'roomId' in payload
    ? String((payload as { roomId?: unknown }).roomId)
    : '';
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(roomId)) {
    throw new BattleSocketError('INVALID_ROOM', 'roomId is required');
  }
  return roomId;
}

function roomChannel(roomId: string): string {
  return `${ROOM_PREFIX}${roomId}`;
}

function userChannel(userId: string): string {
  return `${USER_PREFIX}${userId}`;
}

function requireUserId(payload: unknown, field: string): string {
  const userId = typeof payload === 'object' && payload !== null && field in payload
    ? String((payload as Record<string, unknown>)[field])
    : '';
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(userId)) {
    throw new BattleSocketError('INVALID_USER', `${field} is required`);
  }
  return userId;
}

function emitError(socket: Socket, code: string, message: string): void {
  socket.emit('battle:error', { code, message });
}

function errorCode(error: unknown): string {
  return error instanceof BattleSocketError ? error.code : 'INTERNAL_ERROR';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected battle socket error';
}

class BattleSocketError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}
