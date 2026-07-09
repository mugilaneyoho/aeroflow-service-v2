import { Injectable } from '@nestjs/common';
import redisClient from './redis.provider';

@Injectable()
export class RedisUserCache {
  private readonly PREFIX = 'student';

  async setUser(userId: string, user: object) {
    const key = `${this.PREFIX}:${userId}`;

    await redisClient.set(key, JSON.stringify(user), {
      EX: 86400,
    });

    await redisClient.expire(key, 86400);
  }

  async getUser(userId: string) {
    const key = `${this.PREFIX}:${userId}`;

    const profile = await redisClient.get(key);

    if (!profile) {
      return null;
    }

    return JSON.parse(profile) as object;
  }

  async deleteUser(userId: string) {
    const key = `${this.PREFIX}:${userId}`;

    await redisClient.del(key);
  }
}
