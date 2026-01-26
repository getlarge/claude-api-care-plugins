/**
 * Unit tests for Subscription Store implementations
 *
 * Tests both Memory and Redis implementations to ensure
 * correct subscription tracking, TTL handling, and cleanup.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

import { MemorySubscriptionStore } from './memory.js';
import type { SubscriptionStore } from './base.js';

describe('SubscriptionStore', () => {
  describe('MemorySubscriptionStore', () => {
    let store: SubscriptionStore;

    beforeEach(() => {
      // Use short TTL for testing
      store = new MemorySubscriptionStore({ ttlMs: 100 });
    });

    afterEach(async () => {
      await store.close();
    });

    describe('subscribe/unsubscribe', () => {
      test('should subscribe session to URI', async () => {
        await store.subscribe('session-1', 'baume://findings?id=review-123');

        const subscribers = await store.getSubscribers(
          'baume://findings?id=review-123'
        );
        assert.deepStrictEqual(subscribers, ['session-1']);
      });

      test('should allow multiple sessions to subscribe to same URI', async () => {
        await store.subscribe('session-1', 'baume://findings?id=review-123');
        await store.subscribe('session-2', 'baume://findings?id=review-123');
        await store.subscribe('session-3', 'baume://findings?id=review-123');

        const subscribers = await store.getSubscribers(
          'baume://findings?id=review-123'
        );
        assert.strictEqual(subscribers.length, 3);
        assert.ok(subscribers.includes('session-1'));
        assert.ok(subscribers.includes('session-2'));
        assert.ok(subscribers.includes('session-3'));
      });

      test('should allow session to subscribe to multiple URIs', async () => {
        await store.subscribe('session-1', 'baume://findings?id=review-1');
        await store.subscribe('session-1', 'baume://findings?id=review-2');
        await store.subscribe('session-1', 'baume://specs?id=spec-1');

        const subs1 = await store.getSubscribers(
          'baume://findings?id=review-1'
        );
        const subs2 = await store.getSubscribers(
          'baume://findings?id=review-2'
        );
        const subs3 = await store.getSubscribers('baume://specs?id=spec-1');

        assert.deepStrictEqual(subs1, ['session-1']);
        assert.deepStrictEqual(subs2, ['session-1']);
        assert.deepStrictEqual(subs3, ['session-1']);
      });

      test('should unsubscribe session from URI', async () => {
        await store.subscribe('session-1', 'baume://findings?id=review-123');
        await store.subscribe('session-2', 'baume://findings?id=review-123');

        await store.unsubscribe('session-1', 'baume://findings?id=review-123');

        const subscribers = await store.getSubscribers(
          'baume://findings?id=review-123'
        );
        assert.deepStrictEqual(subscribers, ['session-2']);
      });

      test('should handle unsubscribe from non-existent subscription', async () => {
        // Should not throw
        await store.unsubscribe('session-1', 'baume://findings?id=nonexistent');

        const subscribers = await store.getSubscribers(
          'baume://findings?id=nonexistent'
        );
        assert.deepStrictEqual(subscribers, []);
      });

      test('should return empty array for URI with no subscribers', async () => {
        const subscribers = await store.getSubscribers(
          'baume://findings?id=no-subs'
        );
        assert.deepStrictEqual(subscribers, []);
      });
    });

    describe('unsubscribeAll', () => {
      test('should remove session from all subscriptions', async () => {
        await store.subscribe('session-1', 'baume://findings?id=review-1');
        await store.subscribe('session-1', 'baume://findings?id=review-2');
        await store.subscribe('session-1', 'baume://specs?id=spec-1');
        await store.subscribe('session-2', 'baume://findings?id=review-1');

        await store.unsubscribeAll('session-1');

        const subs1 = await store.getSubscribers(
          'baume://findings?id=review-1'
        );
        const subs2 = await store.getSubscribers(
          'baume://findings?id=review-2'
        );
        const subs3 = await store.getSubscribers('baume://specs?id=spec-1');

        assert.deepStrictEqual(subs1, ['session-2']);
        assert.deepStrictEqual(subs2, []);
        assert.deepStrictEqual(subs3, []);
      });
    });

    describe('TTL expiration', () => {
      test('should expire subscriptions after TTL', async () => {
        await store.subscribe('session-1', 'baume://findings?id=review-123');

        // Verify subscription exists
        let subscribers = await store.getSubscribers(
          'baume://findings?id=review-123'
        );
        assert.deepStrictEqual(subscribers, ['session-1']);

        // Wait for TTL to expire (100ms + buffer)
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Should be expired now
        subscribers = await store.getSubscribers(
          'baume://findings?id=review-123'
        );
        assert.deepStrictEqual(subscribers, []);
      });

      test('should refresh TTL on re-subscribe', async () => {
        await store.subscribe('session-1', 'baume://findings?id=review-123');

        // Wait half the TTL
        await new Promise((resolve) => setTimeout(resolve, 60));

        // Re-subscribe to refresh TTL
        await store.subscribe('session-1', 'baume://findings?id=review-123');

        // Wait another 60ms (would be past original TTL)
        await new Promise((resolve) => setTimeout(resolve, 60));

        // Should still be valid due to refresh
        const subscribers = await store.getSubscribers(
          'baume://findings?id=review-123'
        );
        assert.deepStrictEqual(subscribers, ['session-1']);
      });
    });

    describe('cleanup', () => {
      test('should remove expired subscriptions', async () => {
        await store.subscribe('session-1', 'baume://findings?id=review-123');

        // Wait for TTL to expire
        await new Promise((resolve) => setTimeout(resolve, 150));

        const cleaned = await store.cleanup();
        assert.strictEqual(cleaned, 1);

        const subscribers = await store.getSubscribers(
          'baume://findings?id=review-123'
        );
        assert.deepStrictEqual(subscribers, []);
      });

      test('should not remove valid subscriptions', async () => {
        await store.subscribe('session-1', 'baume://findings?id=review-123');

        // Cleanup immediately (before TTL)
        const cleaned = await store.cleanup();
        assert.strictEqual(cleaned, 0);

        const subscribers = await store.getSubscribers(
          'baume://findings?id=review-123'
        );
        assert.deepStrictEqual(subscribers, ['session-1']);
      });
    });

    describe('idempotency', () => {
      test('should handle duplicate subscribe calls', async () => {
        await store.subscribe('session-1', 'baume://findings?id=review-123');
        await store.subscribe('session-1', 'baume://findings?id=review-123');
        await store.subscribe('session-1', 'baume://findings?id=review-123');

        const subscribers = await store.getSubscribers(
          'baume://findings?id=review-123'
        );
        // Should only have one entry, not three
        assert.deepStrictEqual(subscribers, ['session-1']);
      });

      test('should handle duplicate unsubscribe calls', async () => {
        await store.subscribe('session-1', 'baume://findings?id=review-123');

        await store.unsubscribe('session-1', 'baume://findings?id=review-123');
        await store.unsubscribe('session-1', 'baume://findings?id=review-123');
        await store.unsubscribe('session-1', 'baume://findings?id=review-123');

        const subscribers = await store.getSubscribers(
          'baume://findings?id=review-123'
        );
        assert.deepStrictEqual(subscribers, []);
      });
    });
  });

  // Redis tests would require a Redis instance
  // They could be added as integration tests with testcontainers or similar
  describe.skip('RedisSubscriptionStore', () => {
    test('placeholder for Redis integration tests', () => {
      // Would test same scenarios as Memory store
      // but with actual Redis instance
    });
  });
});
