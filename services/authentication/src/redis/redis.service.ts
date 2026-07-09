import { Injectable } from '@nestjs/common';
import redisClient from './redis.provider';

@Injectable()
export class RedisCacheService {
  private readonly PREFIX = 'role';

  async setRole(roleId: string, role: object) {
    const key = `${this.PREFIX}:${roleId}`;

    await redisClient.set(key, JSON.stringify(role), {
      EX: 86400,
    });
  }

  async getRole(roleId: string) {
    const key = `${this.PREFIX}:${roleId}`;

    const data = (await redisClient.get(key)) as string;

    if (!data) {
      return null;
    }

    return JSON.parse(data) as object;
  }

  async deleteRole(roleId: string) {
    await redisClient.del(`${this.PREFIX}:${roleId}`);
  }
}
