import { MemoryPresenceAdapter } from './MemoryPresenceAdapter.js';

// Configuration: Change this to switch implementations later
const ADAPTER_TYPE = process.env.PRESENCE_ADAPTER || 'memory';

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