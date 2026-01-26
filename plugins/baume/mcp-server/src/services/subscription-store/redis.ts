/**
 * Redis Subscription Store
 *
 * Redis-backed implementation using Sets with TTL.
 * Suitable for multi-instance/cluster deployments.
 *
 * Keys:
 * - {prefix}:subscriptions:{uri} -> Set of sessionIds (with TTL)
 * - {prefix}:sessions:{sessionId}:subscriptions -> Set of URIs (with TTL)
 *
 * TTL is refreshed on each subscribe call.
 */

import type { Redis } from 'ioredis';
import type { SubscriptionStore, SubscriptionStoreOptions } from './base.js';
import { DEFAULT_SUBSCRIPTION_TTL_MS } from './base.js';

export interface RedisSubscriptionStoreOptions extends SubscriptionStoreOptions {
  redis: Redis;
  keyPrefix?: string;
}

export class RedisSubscriptionStore implements SubscriptionStore {
  private redis: Redis;
  private keyPrefix: string;
  private ttlSeconds: number;

  constructor(options: RedisSubscriptionStoreOptions) {
    this.redis = options.redis;
    this.keyPrefix = options.keyPrefix ?? 'mcp';
    this.ttlSeconds = Math.ceil(
      (options.ttlMs ?? DEFAULT_SUBSCRIPTION_TTL_MS) / 1000
    );
  }

  private uriKey(uri: string): string {
    return `${this.keyPrefix}:subscriptions:${encodeURIComponent(uri)}`;
  }

  private sessionKey(sessionId: string): string {
    return `${this.keyPrefix}:sessions:${sessionId}:subscriptions`;
  }

  async subscribe(sessionId: string, uri: string): Promise<void> {
    const uriK = this.uriKey(uri);
    const sessionK = this.sessionKey(sessionId);

    const pipeline = this.redis.pipeline();
    // Add to sets
    pipeline.sadd(uriK, sessionId);
    pipeline.sadd(sessionK, uri);
    // Refresh TTL on both keys
    pipeline.expire(uriK, this.ttlSeconds);
    pipeline.expire(sessionK, this.ttlSeconds);
    await pipeline.exec();
  }

  async unsubscribe(sessionId: string, uri: string): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.srem(this.uriKey(uri), sessionId);
    pipeline.srem(this.sessionKey(sessionId), uri);
    await pipeline.exec();
  }

  async getSubscribers(uri: string): Promise<string[]> {
    // Redis TTL handles expiration automatically
    return this.redis.smembers(this.uriKey(uri));
  }

  async unsubscribeAll(sessionId: string): Promise<void> {
    // Get all URIs this session is subscribed to
    const sessionK = this.sessionKey(sessionId);
    const uris = await this.redis.smembers(sessionK);

    if (uris.length > 0) {
      const pipeline = this.redis.pipeline();
      // Remove sessionId from each URI's subscriber set
      for (const uri of uris) {
        pipeline.srem(this.uriKey(uri), sessionId);
      }
      // Delete the session's subscription set
      pipeline.del(sessionK);
      await pipeline.exec();
    }
  }

  async cleanup(): Promise<number> {
    // Redis TTL handles cleanup automatically
    // This method is a no-op for Redis
    return 0;
  }

  async close(): Promise<void> {
    // Don't close the Redis connection - it's shared with @platformatic/mcp
  }
}
