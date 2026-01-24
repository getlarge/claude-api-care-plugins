/**
 * PostgreSQL Store Implementation
 *
 * PostgreSQL metadata store with:
 * - Connection pooling for high concurrency
 * - Required FileBackend for content storage
 * - Indexed expiry for efficient cleanup
 * - Migration-based schema management
 *
 * Requires `pg` package.
 */

import yaml from 'yaml';
import {
  BaseStore,
  StoredSpec,
  StoreOptions,
  StoreResult,
  StoreStats,
  ListOptions,
  ListResult,
} from './base.js';
import { FileBackend, LocalFileBackend } from './file-backend.js';
import { runPgMigrations } from './migrations/postgres.js';
import allPgMigrations from './migrations/all_pg.js';

/**
 * PostgreSQL client interface - minimal subset we need.
 * This allows using the pg package or compatible clients.
 */
export interface PgPool {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[]
  ): Promise<{ rows: T[]; rowCount: number | null }>;
  end(): Promise<void>;
}

export interface PostgresStoreOptions extends StoreOptions {
  /**
   * PostgreSQL connection URL.
   * Format: postgresql://user:password@host:port/database
   */
  connectionUrl?: string;

  /**
   * Existing pg Pool instance (if you want to manage the pool yourself).
   * Takes precedence over connectionUrl.
   */
  pool?: PgPool;

  /**
   * Table name for specs metadata (default: 'specs').
   */
  tableName?: string;

  /**
   * File backend for storing spec content (default: LocalFileBackend).
   */
  fileBackend?: FileBackend;
}

/**
 * PostgreSQL metadata store with pluggable FileBackend for content.
 * Metadata in PostgreSQL enables efficient queries and shared access.
 * Content stored via FileBackend (local FS, S3, GCS, Azure Blob).
 */
export class PostgresStore extends BaseStore {
  private pool?: PgPool;
  private ownPool = false;
  private connectionUrl?: string;
  private tableName: string;
  private fileBackend: FileBackend;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(options: PostgresStoreOptions = {}) {
    super(options);
    this.connectionUrl = options.connectionUrl ?? process.env['DATABASE_URL'];
    this.pool = options.pool;
    this.tableName = options.tableName ?? 'specs';
    this.fileBackend = options.fileBackend ?? new LocalFileBackend();
  }

  async initialize(): Promise<void> {
    // Initialize file backend
    await this.fileBackend.initialize();

    // Create pool if not provided
    if (!this.pool) {
      if (!this.connectionUrl) {
        throw new Error(
          'PostgresStore requires connectionUrl or DATABASE_URL environment variable'
        );
      }

      // Dynamic import to avoid bundling issues
      const { default: pg } = await import('pg');
      this.pool = new pg.Pool({
        connectionString: this.connectionUrl,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      this.ownPool = true;
    }

    // Run migrations to ensure schema is up to date
    const migrationsApplied = await runPgMigrations(this.pool, allPgMigrations);
    if (migrationsApplied > 0) {
      console.log(`PostgresStore: Applied ${migrationsApplied} migration(s)`);
    }

    // Start periodic cleanup
    this.cleanupInterval = setInterval(
      () => this.cleanup(),
      60 * 1000 // 1 minute
    );
  }

  async store(
    spec: Record<string, unknown>,
    options: {
      id?: string;
      contentType?: 'json' | 'yaml';
      sessionId?: string;
      filename?: string;
    } = {}
  ): Promise<StoreResult> {
    if (!this.pool) {
      throw new Error('PostgresStore not initialized');
    }

    const id = options.id ?? this.generateId();
    const contentType = options.contentType ?? 'json';
    const now = Date.now();
    const expiresAt = this.calculateExpiry();

    // Check if updating existing resource
    const checkResult = await this.pool.query(
      `SELECT 1 FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    const isUpdate = checkResult.rows.length > 0;

    const content =
      contentType === 'yaml'
        ? this.serializeYaml(spec)
        : JSON.stringify(spec, null, 2);

    // Store content via file backend
    const ext = contentType === 'yaml' ? 'yaml' : 'json';
    const filename = options.filename ?? `${id}.${ext}`;
    await this.fileBackend.write(filename, content);

    // Store metadata in PostgreSQL (upsert)
    await this.pool.query(
      `
      INSERT INTO ${this.tableName} (id, filename, content_type, created_at, expires_at, session_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        filename = EXCLUDED.filename,
        content_type = EXCLUDED.content_type,
        created_at = EXCLUDED.created_at,
        expires_at = EXCLUDED.expires_at,
        session_id = EXCLUDED.session_id
    `,
      [id, filename, contentType, now, expiresAt, options.sessionId ?? null]
    );

    // Emit event
    this.emit(isUpdate ? 'resource:updated' : 'resource:created', {
      id,
      type: this.getResourceType(id),
      timestamp: now,
    });

    return { id, path: options.filename, expiresAt };
  }

  async get(id: string): Promise<StoredSpec | null> {
    if (!this.pool) {
      throw new Error('PostgresStore not initialized');
    }

    const result = await this.pool.query<{
      id: string;
      filename: string;
      content_type: string;
      created_at: string;
      expires_at: string;
      session_id: string | null;
    }>(
      `
      SELECT id, filename, content_type, created_at, expires_at, session_id
      FROM ${this.tableName}
      WHERE id = $1 AND expires_at > $2
    `,
      [id, Date.now()]
    );

    const row = result.rows[0];
    if (!row) return null;

    // Read content from file backend
    const content = await this.fileBackend.read(row.filename);
    if (content === null) {
      // File missing, clean up metadata
      await this.delete(id);
      return null;
    }

    return {
      id: row.id,
      content,
      contentType: row.content_type as 'json' | 'yaml',
      createdAt: parseInt(row.created_at, 10),
      expiresAt: parseInt(row.expires_at, 10),
      sessionId: row.session_id ?? undefined,
    };
  }

  async delete(id: string): Promise<void> {
    if (!this.pool) return;

    // Get filename before deleting metadata
    const result = await this.pool.query<{ filename: string }>(
      `SELECT filename FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    const row = result.rows[0];

    if (row) {
      await this.fileBackend.delete(row.filename);
    }

    // Delete metadata
    await this.pool.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);

    // Emit deletion event
    if (row) {
      this.emit('resource:deleted', {
        id,
        type: this.getResourceType(id),
        timestamp: Date.now(),
      });
    }
  }

  async listAll(options?: ListOptions): Promise<ListResult> {
    if (!this.pool) {
      throw new Error('PostgresStore not initialized');
    }

    const pageSize = options?.pageSize ?? 50;
    const cursor = options?.cursor;

    // Parse cursor (format: "createdAt:{timestamp}")
    let createdAtBefore = Date.now();
    if (cursor) {
      const match = cursor.match(/^createdAt:(\d+)$/);
      if (match) {
        createdAtBefore = parseInt(match[1], 10);
      }
    }

    const now = Date.now();

    const result = await this.pool.query<{
      id: string;
      filename: string;
      content_type: string;
      created_at: string;
      expires_at: string;
      session_id: string | null;
    }>(
      `
      SELECT id, filename, content_type, created_at, expires_at, session_id
      FROM ${this.tableName}
      WHERE expires_at > $1 AND created_at < $2
      ORDER BY created_at DESC
      LIMIT $3
    `,
      [now, createdAtBefore, pageSize + 1]
    );

    const rows = result.rows;

    // Check if there are more pages
    const hasMore = rows.length > pageSize;
    const items: StoredSpec[] = [];

    // Process up to pageSize items
    const rowsToProcess = hasMore ? rows.slice(0, pageSize) : rows;

    for (const row of rowsToProcess) {
      // Load content from file backend
      let content: string;
      try {
        const contentResult = await this.fileBackend.read(row.filename);
        if (!contentResult) {
          // File missing, skip this item
          continue;
        }
        content = contentResult;
      } catch {
        // Error reading, skip
        continue;
      }

      items.push({
        id: row.id,
        content,
        contentType: row.content_type as 'json' | 'yaml',
        createdAt: parseInt(row.created_at, 10),
        expiresAt: parseInt(row.expires_at, 10),
        sessionId: row.session_id ?? undefined,
      });
    }

    // Build next cursor from the last item's createdAt
    const nextCursor = hasMore
      ? `createdAt:${rowsToProcess[rowsToProcess.length - 1].created_at}`
      : undefined;

    return { items, nextCursor };
  }

  async cleanup(): Promise<number> {
    if (!this.pool) return 0;

    const now = Date.now();

    // Get expired entries to delete their files
    const selectResult = await this.pool.query<{ filename: string }>(
      `SELECT filename FROM ${this.tableName} WHERE expires_at < $1`,
      [now]
    );

    for (const row of selectResult.rows) {
      await this.fileBackend.delete(row.filename);
    }

    // Delete expired metadata
    const deleteResult = await this.pool.query(
      `DELETE FROM ${this.tableName} WHERE expires_at < $1`,
      [now]
    );

    return deleteResult.rowCount ?? 0;
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.pool) {
      // Close pool if we own it
      if (this.ownPool) {
        await this.pool.end();
      }
      this.pool = undefined;
    }
  }

  /**
   * Clear all data (for testing purposes).
   * WARNING: This deletes all specs and files!
   */
  async clearAll(): Promise<void> {
    if (!this.pool) return;

    // Get all files to delete
    const selectResult = await this.pool.query<{ filename: string }>(
      `SELECT filename FROM ${this.tableName}`
    );

    for (const row of selectResult.rows) {
      await this.fileBackend.delete(row.filename);
    }

    // Clear database
    await this.pool.query(`DELETE FROM ${this.tableName}`);
  }

  get stats(): StoreStats {
    return {
      count: 0, // Would need async call to get actual count
      type: `postgres+${this.fileBackend.type}`,
    };
  }

  /**
   * Get actual count (async).
   */
  async getCount(): Promise<number> {
    if (!this.pool) return 0;

    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    );
    return parseInt(result.rows[0].count, 10);
  }

  private serializeYaml(spec: Record<string, unknown>): string {
    try {
      return yaml.stringify(spec);
    } catch {
      return JSON.stringify(spec, null, 2);
    }
  }
}
