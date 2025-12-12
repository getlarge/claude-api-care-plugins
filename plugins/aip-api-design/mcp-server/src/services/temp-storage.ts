/**
 * Temporary Storage Service
 *
 * Stores modified specs temporarily and provides signed URLs for retrieval.
 * Used to avoid returning large specs in MCP tool responses (token efficiency).
 *
 * - For HTTP transport: Returns signed URLs with expiry
 * - For STDIO transport: Returns local file paths
 */

import { randomBytes, createHmac } from 'node:crypto';
import { writeFile, readFile, unlink, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yaml from 'yaml';

export interface StoredSpec {
  id: string;
  content: string;
  contentType: 'json' | 'yaml';
  createdAt: number;
  expiresAt: number;
  sessionId?: string;
}

export interface StorageOptions {
  /** Time-to-live in milliseconds (default: 5 minutes) */
  ttlMs?: number;
  /** Secret for signing URLs */
  secret?: string;
  /** Base URL for generating download URLs (HTTP transport) */
  baseUrl?: string;
  /** Use file system instead of memory (for STDIO transport) */
  useFileSystem?: boolean;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

/**
 * Temporary storage for modified specs.
 */
export class TempStorage {
  private storage = new Map<string, StoredSpec>();
  private secret: string;
  private ttlMs: number;
  private baseUrl?: string;
  private useFileSystem: boolean;
  private tempDir?: string;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(options: StorageOptions = {}) {
    this.secret = options.secret ?? randomBytes(32).toString('hex');
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.baseUrl = options.baseUrl;
    this.useFileSystem = options.useFileSystem ?? false;

    // Start cleanup interval
    this.cleanupInterval = setInterval(
      () => this.cleanup(),
      CLEANUP_INTERVAL_MS
    );
  }

  /**
   * Initialize file system storage if needed.
   */
  async initialize(): Promise<void> {
    if (this.useFileSystem) {
      this.tempDir = join(tmpdir(), 'aip-mcp-specs');
      await mkdir(this.tempDir, { recursive: true });
    }
  }

  /**
   * Store a spec and return access info.
   */
  async store(
    spec: Record<string, unknown>,
    options: {
      contentType?: 'json' | 'yaml';
      sessionId?: string;
      filename?: string;
    } = {}
  ): Promise<{ id: string; url?: string; path?: string; expiresAt: number }> {
    const id = randomBytes(16).toString('hex');
    const contentType = options.contentType ?? 'json';
    const now = Date.now();
    const expiresAt = now + this.ttlMs;

    const content =
      contentType === 'yaml'
        ? await this.serializeYaml(spec)
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

      // Store metadata only
      this.storage.set(id, { ...stored, content: '' });

      return { id, path, expiresAt };
    } else {
      // Store in memory (HTTP transport)
      this.storage.set(id, stored);

      const url = this.generateSignedUrl(id, expiresAt);
      return { id, url, expiresAt };
    }
  }

  /**
   * Retrieve a spec by ID (internal use).
   */
  async get(id: string): Promise<StoredSpec | null> {
    const stored = this.storage.get(id);
    if (!stored) return null;

    if (Date.now() > stored.expiresAt) {
      await this.delete(id);
      return null;
    }

    // If using file system, read content from file
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
   * Delete a stored spec.
   */
  async delete(id: string): Promise<void> {
    const stored = this.storage.get(id);
    if (stored && this.useFileSystem && this.tempDir) {
      const ext = stored.contentType === 'yaml' ? 'yaml' : 'json';
      const path = join(this.tempDir, `${id}.${ext}`);
      try {
        await unlink(path);
      } catch {
        // Ignore
      }
    }
    this.storage.delete(id);
  }

  /**
   * Generate a signed URL for accessing a stored spec.
   */
  private generateSignedUrl(id: string, expiresAt: number): string | undefined {
    if (!this.baseUrl) return undefined;

    const signature = this.sign(id, expiresAt);
    return `${this.baseUrl}/specs/${id}?expires=${expiresAt}&sig=${signature}`;
  }

  /**
   * Sign an ID with expiry timestamp.
   */
  private sign(id: string, expiresAt: number): string {
    const data = `${id}:${expiresAt}`;
    return createHmac('sha256', this.secret)
      .update(data)
      .digest('hex')
      .slice(0, 32);
  }

  /**
   * Serialize spec to YAML.
   */
  private async serializeYaml(spec: Record<string, unknown>): Promise<string> {
    try {
      return yaml.stringify(spec);
    } catch {
      // Fall back to JSON if yaml not available
      return JSON.stringify(spec, null, 2);
    }
  }

  /**
   * Clean up expired entries.
   */
  private async cleanup(): Promise<void> {
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
  }

  /**
   * Shutdown and cleanup.
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Clean up all stored specs
    for (const id of this.storage.keys()) {
      await this.delete(id);
    }
  }

  /**
   * Get storage statistics.
   */
  get stats() {
    return {
      count: this.storage.size,
      useFileSystem: this.useFileSystem,
    };
  }
}

// Singleton instance
let storage: TempStorage | null = null;

/**
 * Get or create the temp storage instance.
 */
export function getTempStorage(options?: StorageOptions): TempStorage {
  if (!storage) {
    storage = new TempStorage(options);
  }
  return storage;
}

/**
 * Initialize temp storage (call once at startup).
 */
export async function initTempStorage(
  options?: StorageOptions
): Promise<TempStorage> {
  storage = new TempStorage(options);
  await storage.initialize();
  return storage;
}

/**
 * Shutdown temp storage.
 */
export async function shutdownTempStorage(): Promise<void> {
  if (storage) {
    await storage.shutdown();
    storage = null;
  }
}
