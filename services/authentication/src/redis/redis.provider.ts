import { createClient } from 'redis';

export const redisClient = createClient({
  url: 'redis://redis:6379',
});

void redisClient.connect();

export default redisClient;
