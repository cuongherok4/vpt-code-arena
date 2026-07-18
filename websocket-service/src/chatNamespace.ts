import type { Namespace, Server, Socket } from 'socket.io';
import { authenticateSocket, type AuthUser } from './auth.js';
import type { RedisChatPresenceStore } from './redisChatPresenceStore.js';

const GLOBAL_ROOM = 'chat:global';
const ROOM_PREFIX = 'chat:room:';
const USER_PREFIX = 'chat:user:';
const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export type ChatNamespaceOptions = {
  jwtSecret: string;
  authDisabled?: boolean;
  backendUrl: string;
};

export type ChatNamespaceController = {
  namespace: Namespace;
};

export function registerChatNamespace(
  io: Server,
  presenceStore: RedisChatPresenceStore,
  options: ChatNamespaceOptions
): ChatNamespaceController {
  const chat = io.of('/chat');
  chat.use(authenticateSocket(options.jwtSecret, options.authDisabled === true));

  chat.on('connection', async (socket) => {
    const user = requireUser(socket);
    socket.data.joinedChatRooms = new Set<string>();
    await socket.join(userChannel(user.userId));
    await socket.join(GLOBAL_ROOM);

    const becameOnline = await presenceStore.addSocket(user.userId, socket.id);
    if (becameOnline) {
      chat.emit('chat:user-online', publicUser(user));
    }
    socket.emit('chat:online-users', { userIds: await presenceStore.onlineUsers() });

    socket.on('chat:join-global', async (_payload, ack) => {
      try {
        await socket.join(GLOBAL_ROOM);
        ack?.({ success: true });
      } catch (error) {
        fail(socket, ack, error);
      }
    });

    socket.on('chat:leave-global', async (_payload, ack) => {
      try {
        await socket.leave(GLOBAL_ROOM);
        ack?.({ success: true });
      } catch (error) {
        fail(socket, ack, error);
      }
    });

    socket.on('chat:join-room', async (payload, ack) => {
      try {
        const roomId = requireUuid(payload?.roomId, 'roomId');
        await socket.join(roomChannel(roomId));
        socket.data.joinedChatRooms.add(roomId);
        ack?.({ success: true, roomId });
      } catch (error) {
        fail(socket, ack, error);
      }
    });

    socket.on('chat:leave-room', async (payload, ack) => {
      try {
        const roomId = requireUuid(payload?.roomId, 'roomId');
        await socket.leave(roomChannel(roomId));
        socket.data.joinedChatRooms.delete(roomId);
        ack?.({ success: true, roomId });
      } catch (error) {
        fail(socket, ack, error);
      }
    });

    socket.on('chat:send-global', async (payload, ack) => {
      try {
        const message = await persist(socket, '/api/v1/chat/global', { message: requireMessage(payload?.message) });
        chat.emit('chat:message', message);
        ack?.({ success: true, message });
      } catch (error) {
        fail(socket, ack, error);
      }
    });

    socket.on('chat:send-room', async (payload, ack) => {
      try {
        const roomId = requireUuid(payload?.roomId, 'roomId');
        const message = await persist(socket, `/api/v1/chat/rooms/${roomId}`, { message: requireMessage(payload?.message) });
        chat.to(roomChannel(roomId)).emit('chat:message', message);
        ack?.({ success: true, message });
      } catch (error) {
        fail(socket, ack, error);
      }
    });

    socket.on('chat:send-dm', async (payload, ack) => {
      try {
        const toUserId = requireUuid(payload?.toUserId, 'toUserId');
        const message = await persist(socket, `/api/v1/chat/dm/${toUserId}`, { message: requireMessage(payload?.message) });
        chat.to(userChannel(toUserId)).to(userChannel(user.userId)).emit('chat:dm', message);
        ack?.({ success: true, message });
      } catch (error) {
        fail(socket, ack, error);
      }
    });

    socket.on('disconnect', async () => {
      const wentOffline = await presenceStore.removeSocket(user.userId, socket.id);
      if (wentOffline) {
        chat.emit('chat:user-offline', publicUser(user));
      }
    });
  });

  async function persist(socket: Socket, path: string, body: Record<string, unknown>): Promise<unknown> {
    const user = requireUser(socket);
    if (!user.token) {
      throw new ChatSocketError('AUTH_TOKEN_REQUIRED', 'A JWT token is required to send chat messages');
    }

    const response = await fetch(`${options.backendUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new ChatSocketError('PERSIST_FAILED', `Backend rejected chat message with status ${response.status}`);
    }
    return response.json();
  }

  return { namespace: chat };
}

function requireUser(socket: Socket): AuthUser {
  const user = socket.data.user as AuthUser | undefined;
  if (!user?.userId) throw new ChatSocketError('UNAUTHORIZED', 'Authentication required');
  return user;
}

function requireUuid(value: unknown, field: string): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!UUID_PATTERN.test(text)) {
    throw new ChatSocketError('INVALID_PAYLOAD', `${field} is required`);
  }
  return text;
}

function requireMessage(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new ChatSocketError('INVALID_PAYLOAD', 'message is required');
  if (text.length > 2000) throw new ChatSocketError('INVALID_PAYLOAD', 'message is too long');
  return text;
}

function roomChannel(roomId: string): string {
  return `${ROOM_PREFIX}${roomId}`;
}

function userChannel(userId: string): string {
  return `${USER_PREFIX}${userId}`;
}

function publicUser(user: AuthUser): { userId: string; name?: string } {
  return { userId: user.userId, name: user.name };
}

function fail(socket: Socket, ack: ((payload: unknown) => void) | undefined, error: unknown): void {
  const code = error instanceof ChatSocketError ? error.code : 'INTERNAL_ERROR';
  const message = error instanceof Error ? error.message : 'Unexpected chat socket error';
  socket.emit('chat:error', { code, message });
  ack?.({ success: false, error: code, message });
}

class ChatSocketError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}
