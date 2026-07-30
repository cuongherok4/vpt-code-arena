import type { Redis } from 'ioredis';
import type { BattleMember, BattleStore } from './battleNamespace.js';

export class RedisBattleStore implements BattleStore {
  constructor(private readonly redis: Redis) {}

  async getMembers(roomId: string): Promise<BattleMember[]> {
    const values = await this.redis.hvals(this.membersKey(roomId));
    return values
      .map((value) => JSON.parse(value) as BattleMember)
      .sort((left, right) => left.joinedAt.localeCompare(right.joinedAt));
  }

  async upsertMember(roomId: string, member: BattleMember): Promise<void> {
    const existing = await this.getMember(roomId, member.userId);
    await this.redis.hset(this.membersKey(roomId), member.userId, JSON.stringify({
      ...member,
      isReady: existing?.isReady ?? member.isReady,
      joinedAt: existing?.joinedAt ?? member.joinedAt
    }));
  }

  async updateReady(roomId: string, userId: string, ready: boolean): Promise<BattleMember | null> {
    const member = await this.getMember(roomId, userId);
    if (!member) return null;
    const updated = { ...member, isReady: ready };
    await this.redis.hset(this.membersKey(roomId), userId, JSON.stringify(updated));
    return updated;
  }

  async removeMember(roomId: string, userId: string, socketId: string): Promise<BattleMember | null> {
    const member = await this.getMember(roomId, userId);
    if (member && member.socketId !== socketId) {
      return null;
    }
    await this.redis.hdel(this.membersKey(roomId), userId);
    return member;
  }

  async setRoomEndTime(roomId: string, endTime: string): Promise<void> {
    await this.redis.set(this.endTimeKey(roomId), endTime);
  }

  async getRoomEndTime(roomId: string): Promise<string | null> {
    return this.redis.get(this.endTimeKey(roomId));
  }

  async clearRoomEndTime(roomId: string): Promise<void> {
    await this.redis.del(this.endTimeKey(roomId));
  }

  private async getMember(roomId: string, userId: string): Promise<BattleMember | null> {
    const value = await this.redis.hget(this.membersKey(roomId), userId);
    return value ? JSON.parse(value) as BattleMember : null;
  }

  private membersKey(roomId: string): string {
    return `battle:room:${roomId}:members`;
  }

  private endTimeKey(roomId: string): string {
    return `battle:room:${roomId}:endTime`;
  }
}
