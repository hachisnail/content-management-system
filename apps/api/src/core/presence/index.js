import { config } from '../../config/env.js';
import { MemoryPresenceAdapter } from './MemoryPresenceAdapter.js';

const ADAPTER_TYPE = config.presenceAdapter;

let presenceService;

if (ADAPTER_TYPE === 'redis') {
  // Future: import { RedisPresenceAdapter } from './RedisPresenceAdapter.js';
  // presenceService = new RedisPresenceAdapter(redisClient);
  console.warn("Redis adapter not implemented yet, falling back to Memory");
  presenceService = new MemoryPresenceAdapter();
} else {
  presenceService = new MemoryPresenceAdapter();
}

export { presenceService };