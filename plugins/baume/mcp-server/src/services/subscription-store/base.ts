/**
 * Resource Subscription Store - Base Interface
 *
 * Abstract interface for tracking MCP resource subscriptions.
 * Maps resource URIs to subscribed session IDs.
 *
 * Subscriptions have a TTL (default 1 hour, matching platformatic session TTL).
 * TTL is refreshed on subscribe. Expired subscriptions are cleaned up automatically.
 */

/** Default TTL: 1 hour (matches platformatic session TTL) */
export const DEFAULT_SUBSCRIPTION_TTL_MS = 60 * 60 * 1000;

export interface SubscriptionStoreOptions {
  /** TTL for subscriptions in milliseconds (default: 1 hour) */
  ttlMs?: number;
}

export interface SubscriptionStore {
  /**
   * Subscribe a session to a resource.
   * Refreshes TTL if already subscribed.
   */
  subscribe(sessionId: string, uri: string): Promise<void>;

  /**
   * Unsubscribe a session from a resource.
   */
  unsubscribe(sessionId: string, uri: string): Promise<void>;

  /**
   * Get all session IDs subscribed to a resource.
   * Filters out expired subscriptions.
   */
  getSubscribers(uri: string): Promise<string[]>;

  /**
   * Unsubscribe a session from all resources.
   * Call this when a session disconnects.
   */
  unsubscribeAll(sessionId: string): Promise<void>;

  /**
   * Clean up expired subscriptions.
   * @returns Number of subscriptions cleaned up
   */
  cleanup(): Promise<number>;

  /**
   * Close and clean up resources.
   */
  close(): Promise<void>;
}
