/**
 * Resource Subscription Store
 *
 * Factory and singleton management for subscription stores.
 * Uses same config pattern as @platformatic/mcp (redis option).
 */

import type { Redis } from 'ioredis';

export type { SubscriptionStore, SubscriptionStoreOptions } from './base.js';
export { DEFAULT_SUBSCRIPTION_TTL_MS } from './base.js';
export { MemorySubscriptionStore } from './memory.js';
export { RedisSubscriptionStore } from './redis.js';

import type { SubscriptionStore, SubscriptionStoreOptions } from './base.js';
import { MemorySubscriptionStore } from './memory.js';
import { RedisSubscriptionStore } from './redis.js';

export interface CreateSubscriptionStoreOptions extends SubscriptionStoreOptions {
  redis?: Redis;
}

/**
 * Create a subscription store.
 * Uses Redis if redis option provided, otherwise memory.
 */
export function createSubscriptionStore(
  options: CreateSubscriptionStoreOptions = {}
): SubscriptionStore {
  if (options.redis) {
    return new RedisSubscriptionStore({
      redis: options.redis,
      ttlMs: options.ttlMs,
    });
  }
  return new MemorySubscriptionStore({ ttlMs: options.ttlMs });
}

// Singleton instance
let store: SubscriptionStore | null = null;

/**
 * Initialize the subscription store singleton.
 */
export function initSubscriptionStore(
  options: CreateSubscriptionStoreOptions = {}
): SubscriptionStore {
  if (store) {
    store.close().catch(() => {});
  }
  store = createSubscriptionStore(options);
  return store;
}

/**
 * Get the subscription store instance.
 */
export function getSubscriptionStore(): SubscriptionStore {
  if (!store) {
    throw new Error(
      'SubscriptionStore not initialized. Call initSubscriptionStore() first.'
    );
  }
  return store;
}

/**
 * Shutdown the subscription store.
 */
export async function shutdownSubscriptionStore(): Promise<void> {
  if (store) {
    await store.close();
    store = null;
  }
}
