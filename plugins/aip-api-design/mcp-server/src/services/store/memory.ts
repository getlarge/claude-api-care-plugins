/**
 * Memory Store Implementation
 *
 * Map-based in-memory storage for specs.
 * Best for STDIO transport and testing where persistence isn't needed.
 */

import { writeFile, readFile, unlink, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

export interface MemoryStoreOptions extends StoreOptions {
  /** Write to file system for STDIO transport (returns paths instead of URLs) */
  useFileSystem?: boolean;
  /** Custom temp directory name (default: 'aip-mcp-specs') */
  tempDirName?: string;
}

/**
 * In-memory storage using Map.
 * Optionally writes to file system for STDIO transport.
 */
export class MemoryStore extends BaseStore {
  private storage = new Map<string, StoredSpec>();
  private useFileSystem: boolean;
  private tempDirName: string;
  private tempDir?: string;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(options: MemoryStoreOptions = {}) {
    super(options);
    this.useFileSystem = options.useFileSystem ?? false;
    this.tempDirName = options.tempDirName ?? 'aip-mcp-specs';
  }

  async initialize(): Promise<void> {
    if (this.useFileSystem) {
      this.tempDir = join(tmpdir(), this.tempDirName);
      await mkdir(this.tempDir, { recursive: true });
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
    const id = options.id ?? this.generateId();
    const contentType = options.contentType ?? 'json';
    const now = Date.now();
    const expiresAt = this.calculateExpiry();

    // Check if updating existing resource
    const isUpdate = this.storage.has(id);

    const content =
      contentType === 'yaml'
        ? this.serializeYaml(spec)
        : JSON.stringify(spec, null, 2);

    const stored: StoredSpec = {
      id,
      content,
      contentType,
      createdAt: now,
      expiresAt,
      sessionId: options.sessionId,
    };

    if (this.useFileSystem && this.tempDir) {
      // Write to file system (STDIO transport)
      const filename =
        options.filename ?? `${id}.${contentType === 'yaml' ? 'yaml' : 'json'}`;
      const path = join(this.tempDir, filename);
      await writeFile(path, content, 'utf-8');

      // Store metadata only (content is on disk)
      this.storage.set(id, { ...stored, content: '' });

      // Emit event
      this.emit(isUpdate ? 'resource:updated' : 'resource:created', {
        id,
        type: this.getResourceType(id),
        timestamp: now,
      });

      return { id, path, expiresAt };
    } else {
      // Store in memory (HTTP transport)
      this.storage.set(id, stored);

      // Emit event
      this.emit(isUpdate ? 'resource:updated' : 'resource:created', {
        id,
        type: this.getResourceType(id),
        timestamp: now,
      });

      const url = this.generateSignedUrl(id, expiresAt);
      return { id, url, expiresAt };
    }
  }

  async get(id: string): Promise<StoredSpec | null> {
    const stored = this.storage.get(id);
    if (!stored) return null;

    if (Date.now() > stored.expiresAt) {
      await this.delete(id);
      return null;
    }

    // If using file system, read content from disk
    if (this.useFileSystem && this.tempDir && !stored.content) {
      const ext = stored.contentType === 'yaml' ? 'yaml' : 'json';
      const path = join(this.tempDir, `${id}.${ext}`);
      try {
        stored.content = await readFile(path, 'utf-8');
      } catch {
        return null;
      }
    }

    return stored;
  }

  async delete(id: string): Promise<void> {
    const stored = this.storage.get(id);
    if (stored && this.useFileSystem && this.tempDir) {
      const ext = stored.contentType === 'yaml' ? 'yaml' : 'json';
      const path = join(this.tempDir, `${id}.${ext}`);
      try {
        await unlink(path);
      } catch {
        // Ignore file not found
      }
    }
    this.storage.delete(id);

    // Emit deletion event
    if (stored) {
      this.emit('resource:deleted', {
        id,
        type: this.getResourceType(id),
        timestamp: Date.now(),
      });
    }
  }

  async listAll(options?: ListOptions): Promise<ListResult> {
    const pageSize = options?.pageSize ?? 50;
    const cursor = options?.cursor;

    // Get all non-expired items
    const now = Date.now();
    const allItems = Array.from(this.storage.values()).filter(
      (spec) => spec.expiresAt > now
    );

    // Sort by createdAt descending (newest first)
    allItems.sort((a, b) => b.createdAt - a.createdAt);

    // Parse cursor (format: "offset:{number}")
    let offset = 0;
    if (cursor) {
      const match = cursor.match(/^offset:(\d+)$/);
      if (match) {
        offset = parseInt(match[1], 10);
      }
    }

    // Paginate
    const items = allItems.slice(offset, offset + pageSize);
    const hasMore = allItems.length > offset + pageSize;

    // Build next cursor
    const nextCursor = hasMore ? `offset:${offset + pageSize}` : undefined;

    // Load content from files if useFileSystem
    if (this.useFileSystem) {
      for (const item of items) {
        if (!item.content) {
          try {
            const filePath = join(this.tempDir!, item.id + '.json');
            item.content = await readFile(filePath, 'utf-8');
          } catch {
            // File missing, skip
          }
        }
      }
    }

    return { items, nextCursor };
  }

  async cleanup(): Promise<number> {
    const now = Date.now();
    const expired: string[] = [];

    for (const [id, stored] of this.storage) {
      if (now > stored.expiresAt) {
        expired.push(id);
      }
    }

    for (const id of expired) {
      await this.delete(id);
    }

    return expired.length;
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Clean up all stored specs
    for (const id of this.storage.keys()) {
      await this.delete(id);
    }
  }

  get stats(): StoreStats {
    return {
      count: this.storage.size,
      type: this.useFileSystem ? 'memory+fs' : 'memory',
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
