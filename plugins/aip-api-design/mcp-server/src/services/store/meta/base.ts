/**
 * Abstract Store Interface
 *
 * Base class for temporary spec storage implementations.
 * Provides shared functionality for URL signing and common types.
 *
 * Events emitted:
 * - 'resource:created' - New resource stored, payload: { id, type, timestamp }
 * - 'resource:updated' - Existing resource overwritten, payload: { id, type, timestamp }
 * - 'resource:deleted' - Resource deleted/expired, payload: { id, type, timestamp }
 */

import { EventEmitter } from 'node:events';
import { randomBytes } from 'node:crypto';

export interface StoredSpec {
  id: string;
  content: string;
  contentType: 'json' | 'yaml';
  createdAt: number;
  expiresAt: number;
  sessionId?: string;
}

export interface StoreOptions {
  /**
   * Time-to-live in milliseconds.
   * - Positive value: entries expire after this duration
   * - 0 or negative: entries never expire (infinite TTL)
   * Default: 5 minutes
   */
  ttlMs?: number;
}

export interface StoreResult {
  id: string;
  path?: string;
  expiresAt: number;
}

export interface StoreStats {
  count: number;
  type: string;
}

/**
 * Options for listing stored items.
 */
export interface ListOptions {
  /**
   * Cursor for pagination (opaque token).
   * Omit or pass undefined to get first page.
   */
  cursor?: string;

  /**
   * Maximum number of items to return per page.
   * Default: 50
   */
  pageSize?: number;

  /**
   * If true, return only metadata without loading content.
   * Items will have empty string for content field.
   * Useful for listing large numbers of items efficiently.
   * Default: false
   */
  metadataOnly?: boolean;

  /**
   * Maximum concurrent file fetches (when metadataOnly is false).
   * Default: 10
   */
  concurrency?: number;
}

/**
 * Result of listing stored items.
 */
export interface ListResult {
  /**
   * Array of stored items (not expired).
   */
  items: StoredSpec[];

  /**
   * Cursor for next page, if more items exist.
   * Undefined if this is the last page.
   */
  nextCursor?: string;
}

/**
 * Event payload for resource lifecycle events.
 */
export interface ResourceEvent {
  id: string;
  type: string;
  timestamp: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Abstract base class for spec storage implementations.
 * Extends EventEmitter to notify listeners of resource changes.
 */
export abstract class BaseStore extends EventEmitter {
  protected ttlMs: number;

  constructor(options: StoreOptions = {}) {
    super();
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  }

  /**
   * Initialize the store (called once at startup).
   */
  abstract initialize(): Promise<void>;

  /**
   * Store a spec and return access info.
   */
  abstract store(
    spec: Record<string, unknown>,
    options?: {
      /** Use this ID instead of generating one (e.g., for reviewId = spec hash) */
      id?: string;
      contentType?: 'json' | 'yaml';
      sessionId?: string;
      filename?: string;
    }
  ): Promise<StoreResult>;

  /**
   * Retrieve a spec by ID (internal use).
   */
  abstract get(id: string): Promise<StoredSpec | null>;

  /**
   * Delete a stored spec.
   */
  abstract delete(id: string): Promise<void>;

  /**
   * List all stored items, with pagination.
   *
   * @param options - Pagination options
   * @returns List result with items and optional next cursor
   */
  abstract listAll(options?: ListOptions): Promise<ListResult>;

  /**
   * Clean up expired entries.
   */
  abstract cleanup(): Promise<number>;

  /**
   * Shutdown and cleanup all resources.
   */
  abstract shutdown(): Promise<void>;

  /**
   * Get storage statistics.
   */
  abstract get stats(): StoreStats;

  /**
   * Check if the store is healthy and can accept requests.
   * Default implementation returns true. Override for stores
   * that need connection health checks (e.g., PostgreSQL, Redis).
   *
   * @returns true if healthy, false otherwise
   */
  async isHealthy(): Promise<boolean> {
    return true;
  }

  /**
   * Generate a random ID.
   */
  protected generateId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Check if TTL is infinite (no expiration).
   */
  protected get hasInfiniteTtl(): boolean {
    return this.ttlMs <= 0;
  }

  /**
   * Calculate expiry timestamp from now.
   * Returns Number.MAX_SAFE_INTEGER for infinite TTL.
   */
  protected calculateExpiry(): number {
    if (this.hasInfiniteTtl) {
      return Number.MAX_SAFE_INTEGER;
    }
    return Date.now() + this.ttlMs;
  }

  /**
   * Determine resource type from ID.
   * Findings use hash-based IDs, specs use UUID/timestamp-based IDs with 'fixed-' prefix.
   */
  protected getResourceType(id: string): string {
    if (id.startsWith('fixed-')) {
      return 'specs';
    }
    return 'findings';
  }
}
