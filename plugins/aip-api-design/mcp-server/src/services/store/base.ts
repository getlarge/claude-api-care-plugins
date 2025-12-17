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
import { randomBytes, createHmac } from 'node:crypto';

export interface StoredSpec {
  id: string;
  content: string;
  contentType: 'json' | 'yaml';
  createdAt: number;
  expiresAt: number;
  sessionId?: string;
}

export interface StoreOptions {
  /** Time-to-live in milliseconds (default: 5 minutes) */
  ttlMs?: number;
  /** Secret for signing URLs */
  secret?: string;
  /** Base URL for generating download URLs (HTTP transport) */
  baseUrl?: string;
}

export interface StoreResult {
  id: string;
  url?: string;
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
  protected secret: string;
  protected ttlMs: number;
  protected baseUrl?: string;

  constructor(options: StoreOptions = {}) {
    super();
    this.secret = options.secret ?? randomBytes(32).toString('hex');
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.baseUrl = options.baseUrl;
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
   * Validate a signed URL and return the spec if valid.
   */
  async getBySignedUrl(
    id: string,
    signature: string,
    expires: string
  ): Promise<StoredSpec | null> {
    const expiresAt = parseInt(expires, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return null;
    }

    const expectedSig = this.sign(id, expiresAt);
    if (signature !== expectedSig) {
      return null;
    }

    return this.get(id);
  }

  /**
   * Generate a signed URL for accessing a stored spec.
   */
  protected generateSignedUrl(
    id: string,
    expiresAt: number
  ): string | undefined {
    if (!this.baseUrl) return undefined;

    const signature = this.sign(id, expiresAt);
    return `${this.baseUrl}/specs/${id}?expires=${expiresAt}&sig=${signature}`;
  }

  /**
   * Sign an ID with expiry timestamp.
   */
  protected sign(id: string, expiresAt: number): string {
    const data = `${id}:${expiresAt}`;
    return createHmac('sha256', this.secret)
      .update(data)
      .digest('hex')
      .slice(0, 32);
  }

  /**
   * Generate a random ID.
   */
  protected generateId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Calculate expiry timestamp from now.
   */
  protected calculateExpiry(): number {
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
