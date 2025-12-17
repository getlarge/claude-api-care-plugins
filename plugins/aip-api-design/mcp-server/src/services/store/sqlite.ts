/**
 * SQLite Store Implementation
 *
 * High-performance SQLite metadata store with:
 * - WAL mode for concurrent reads during writes
 * - Required FileBackend for content storage
 * - Indexed expiry for efficient cleanup
 *
 * Requires Node.js 22.5.0+
 */

import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { mkdir } from 'node:fs/promises';
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

export interface SqliteStoreOptions extends StoreOptions {
  /** Path to SQLite database file (default: temp directory) */
  dbPath?: string;
  /** File backend for storing spec content (default: LocalFileBackend) */
  fileBackend?: FileBackend;
}

/**
 * SQLite metadata store with pluggable FileBackend for content.
 * Metadata in SQLite enables efficient queries and shared access.
 * Content stored via FileBackend (local FS, S3, GCS, Azure Blob).
 */
export class SqliteStore extends BaseStore {
  private db?: DatabaseSync;
  private dbPath: string;
  private fileBackend: FileBackend;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(options: SqliteStoreOptions = {}) {
    super(options);
    const baseDir = join(tmpdir(), 'aip-mcp-specs');
    this.dbPath = options.dbPath ?? join(baseDir, 'metadata.db');
    this.fileBackend = options.fileBackend ?? new LocalFileBackend();
  }

  async initialize(): Promise<void> {
    // Ensure database directory exists
    await mkdir(dirname(this.dbPath), { recursive: true });

    // Initialize file backend
    await this.fileBackend.initialize();

    // Open database
    this.db = new DatabaseSync(this.dbPath);

    // Performance pragmas
    this.db.exec('PRAGMA main.synchronous = NORMAL');
    this.db.exec('PRAGMA main.journal_mode = WAL');
    this.db.exec('PRAGMA main.auto_vacuum = INCREMENTAL');

    // Create metadata table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS specs (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        content_type TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        session_id TEXT
      )
    `);

    // Index on expires_at for efficient cleanup
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_specs_expires_at ON specs(expires_at)
    `);

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
    if (!this.db) {
      throw new Error('SqliteStore not initialized');
    }

    const id = options.id ?? this.generateId();
    const contentType = options.contentType ?? 'json';
    const now = Date.now();
    const expiresAt = this.calculateExpiry();

    // Check if updating existing resource
    const checkStmt = this.db.prepare('SELECT 1 FROM specs WHERE id = ?');
    const isUpdate = !!checkStmt.get(id);

    const content =
      contentType === 'yaml'
        ? this.serializeYaml(spec)
        : JSON.stringify(spec, null, 2);

    // Store content via file backend
    const ext = contentType === 'yaml' ? 'yaml' : 'json';
    const filename = options.filename ?? `${id}.${ext}`;
    await this.fileBackend.write(filename, content);

    // Store metadata in SQLite (upsert for custom IDs like reviewId)
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO specs (id, filename, content_type, created_at, expires_at, session_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      filename,
      contentType,
      now,
      expiresAt,
      options.sessionId ?? null
    );

    // Emit event
    this.emit(isUpdate ? 'resource:updated' : 'resource:created', {
      id,
      type: this.getResourceType(id),
      timestamp: now,
    });

    const url = this.generateSignedUrl(id, expiresAt);
    return { id, url, expiresAt };
  }

  async get(id: string): Promise<StoredSpec | null> {
    if (!this.db) {
      throw new Error('SqliteStore not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT id, filename, content_type, created_at, expires_at, session_id
      FROM specs
      WHERE id = ? AND expires_at > ?
    `);

    const row = stmt.get(id, Date.now()) as
      | {
          id: string;
          filename: string;
          content_type: string;
          created_at: number;
          expires_at: number;
          session_id: string | null;
        }
      | undefined;

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
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      sessionId: row.session_id ?? undefined,
    };
  }

  async delete(id: string): Promise<void> {
    if (!this.db) return;

    // Get filename before deleting metadata
    const stmt = this.db.prepare('SELECT filename FROM specs WHERE id = ?');
    const row = stmt.get(id) as { filename: string } | undefined;

    if (row) {
      await this.fileBackend.delete(row.filename);
    }

    // Delete metadata
    const deleteStmt = this.db.prepare('DELETE FROM specs WHERE id = ?');
    deleteStmt.run(id);

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
    if (!this.db) {
      throw new Error('SqliteStore not initialized');
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

    // Query with WHERE expires_at > ? AND created_at < ? ORDER BY created_at DESC LIMIT ?
    const stmt = this.db.prepare(`
      SELECT id, filename, content_type, created_at, expires_at, session_id
      FROM specs
      WHERE expires_at > ?
        AND created_at < ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(now, createdAtBefore, pageSize + 1) as Array<{
      id: string;
      filename: string;
      content_type: string;
      created_at: number;
      expires_at: number;
      session_id: string | null;
    }>;

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
        createdAt: row.created_at,
        expiresAt: row.expires_at,
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
    if (!this.db) return 0;

    const now = Date.now();

    // Get expired entries to delete their files
    const selectStmt = this.db.prepare(
      'SELECT filename FROM specs WHERE expires_at < ?'
    );
    const rows = selectStmt.all(now) as { filename: string }[];

    for (const row of rows) {
      await this.fileBackend.delete(row.filename);
    }

    // Delete expired metadata
    const deleteStmt = this.db.prepare(
      'DELETE FROM specs WHERE expires_at < ?'
    );
    const result = deleteStmt.run(now);
    return Number(result.changes);
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.db) {
      // Get all files to delete
      const selectStmt = this.db.prepare('SELECT filename FROM specs');
      const rows = selectStmt.all() as { filename: string }[];

      for (const row of rows) {
        await this.fileBackend.delete(row.filename);
      }

      // Clean up database
      this.db.exec('DELETE FROM specs');
      this.db.close();
      this.db = undefined;
    }

    // Clean up file backend
    await this.fileBackend.deleteAll();
  }

  get stats(): StoreStats {
    if (!this.db) {
      return { count: 0, type: `sqlite+${this.fileBackend.type}` };
    }

    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM specs');
    const row = stmt.get() as { count: number };
    return {
      count: row.count,
      type: `sqlite+${this.fileBackend.type}`,
    };
  }

  private serializeYaml(spec: Record<string, unknown>): string {
    try {
      return yaml.stringify(spec);
    } catch {
      return JSON.stringify(spec, null, 2);
    }
  }
}
