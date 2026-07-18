import type { Redis } from 'ioredis';

const ONLINE_USERS_KEY = 'chat:online:users';

export class RedisChatPresenceStore {
  constructor(private readonly redis: Redis) {}

  async addSocket(userId: string, socketId: string): Promise<boolean> {
    const key = this.socketsKey(userId);
    const countBefore = await this.redis.scard(key);
    await this.redis
      .multi()
      .sadd(key, socketId)
      .expire(key, 60 * 60 * 24)
      .sadd(ONLINE_USERS_KEY, userId)
      .exec();
    return countBefore === 0;
  }

  async removeSocket(userId: string, socketId: string): Promise<boolean> {
    const key = this.socketsKey(userId);
    await this.redis.srem(key, socketId);
    const remaining = await this.redis.scard(key);
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
    return this.redis.smembers(ONLINE_USERS_KEY);
  }

  private socketsKey(userId: string): string {
    return `chat:online:user:${userId}:sockets`;
  }
}
