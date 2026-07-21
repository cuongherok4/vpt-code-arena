import type { Redis } from 'ioredis';

const ONLINE_USERS_KEY = 'chat:online:users';
const SOCKET_TTL_SECONDS = 4;

export class RedisChatPresenceStore {
  constructor(private readonly redis: Redis) {}

  async addSocket(userId: string, socketId: string): Promise<boolean> {
    const key = this.socketsKey(userId);
    const countBefore = await this.aliveSocketCount(userId);
    await this.redis
      .multi()
      .sadd(key, socketId)
      .set(this.socketKey(socketId), userId, 'EX', SOCKET_TTL_SECONDS)
      .expire(key, SOCKET_TTL_SECONDS * 2)
      .sadd(ONLINE_USERS_KEY, userId)
      .exec();
    return countBefore === 0;
  }

  async touchSocket(userId: string, socketId: string): Promise<void> {
    await this.redis
      .multi()
      .sadd(this.socketsKey(userId), socketId)
      .set(this.socketKey(socketId), userId, 'EX', SOCKET_TTL_SECONDS)
      .expire(this.socketsKey(userId), SOCKET_TTL_SECONDS * 2)
      .sadd(ONLINE_USERS_KEY, userId)
      .exec();
  }

  async removeSocket(userId: string, socketId: string): Promise<boolean> {
    const key = this.socketsKey(userId);
    await this.redis
      .multi()
      .srem(key, socketId)
      .del(this.socketKey(socketId))
      .exec();
    const remaining = await this.aliveSocketCount(userId);
    if (remaining === 0) {
      await this.redis
        .multi()
        .del(key)
        .srem(ONLINE_USERS_KEY, userId)
        .exec();
      return true;
    }
    return false;
  }

  async onlineUsers(): Promise<string[]> {
    const userIds = await this.redis.smembers(ONLINE_USERS_KEY);
    const aliveUsers: string[] = [];
    for (const userId of userIds) {
      if (await this.aliveSocketCount(userId) > 0) {
        aliveUsers.push(userId);
      } else {
        await this.redis.srem(ONLINE_USERS_KEY, userId);
      }
    }
    return aliveUsers;
  }

  private async aliveSocketCount(userId: string): Promise<number> {
    const key = this.socketsKey(userId);
    const socketIds = await this.redis.smembers(key);
    if (socketIds.length === 0) return 0;

    const aliveChecks = await this.redis
      .multi(socketIds.map((socketId) => ['exists', this.socketKey(socketId)]))
      .exec();
    const expiredSocketIds = socketIds.filter((_, index) => Number(aliveChecks?.[index]?.[1] ?? 0) === 0);
    if (expiredSocketIds.length > 0) {
      await this.redis.srem(key, ...expiredSocketIds);
    }
    return socketIds.length - expiredSocketIds.length;
  }

  private socketsKey(userId: string): string {
    return `chat:online:user:${userId}:sockets`;
  }

  private socketKey(socketId: string): string {
    return `chat:online:socket:${socketId}`;
  }
}
