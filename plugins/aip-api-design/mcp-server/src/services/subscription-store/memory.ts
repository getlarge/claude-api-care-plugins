/**
 * Memory Subscription Store
 *
 * In-memory implementation using Map with TTL support.
 * Suitable for single-instance deployments.
 */

import type { SubscriptionStore, SubscriptionStoreOptions } from './base.js';
import { DEFAULT_SUBSCRIPTION_TTL_MS } from './base.js';

interface SubscriptionEntry {
  sessionId: string;
  expiresAt: number;
}

export class MemorySubscriptionStore implements SubscriptionStore {
  private subscriptions = new Map<string, Map<string, SubscriptionEntry>>(); // uri -> Map<sessionId, entry>
  private ttlMs: number;
  private cleanupInterval?: ReturnType<typeof setInterval>;

  constructor(options: SubscriptionStoreOptions = {}) {
    this.ttlMs = options.ttlMs ?? DEFAULT_SUBSCRIPTION_TTL_MS;

    // Periodic cleanup every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup().catch(() => {});
      },
      5 * 60 * 1000
    );
  }

  async subscribe(sessionId: string, uri: string): Promise<void> {
    let sessions = this.subscriptions.get(uri);
    if (!sessions) {
      sessions = new Map();
      this.subscriptions.set(uri, sessions);
    }

    // Add or refresh subscription with new TTL
    sessions.set(sessionId, {
      sessionId,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  async unsubscribe(sessionId: string, uri: string): Promise<void> {
    const sessions = this.subscriptions.get(uri);
    if (sessions) {
      sessions.delete(sessionId);
      if (sessions.size === 0) {
        this.subscriptions.delete(uri);
      }
    }
  }

  async getSubscribers(uri: string): Promise<string[]> {
    const sessions = this.subscriptions.get(uri);
    if (!sessions) return [];

    const now = Date.now();
    const validSessions: string[] = [];

    for (const [sessionId, entry] of sessions) {
      if (entry.expiresAt > now) {
        validSessions.push(sessionId);
      }
    }

    return validSessions;
  }

  async unsubscribeAll(sessionId: string): Promise<void> {
    for (const [uri, sessions] of this.subscriptions) {
      sessions.delete(sessionId);
      if (sessions.size === 0) {
        this.subscriptions.delete(uri);
      }
    }
  }

  async cleanup(): Promise<number> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [uri, sessions] of this.subscriptions) {
      for (const [sessionId, entry] of sessions) {
        if (entry.expiresAt <= now) {
          sessions.delete(sessionId);
          cleanedCount++;
        }
      }
      if (sessions.size === 0) {
        this.subscriptions.delete(uri);
      }
    }

    return cleanedCount;
  }

  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.subscriptions.clear();
  }
}
