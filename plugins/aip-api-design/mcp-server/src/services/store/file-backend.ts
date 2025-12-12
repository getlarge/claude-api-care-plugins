/**
 * File Backend Interface
 *
 * Abstraction for storing spec content.
 * Allows pluggable storage: local FS, S3, GCS, Azure Blob, etc.
 */

import { mkdir, writeFile, readFile, unlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

export interface FileBackend {
  /**
   * Initialize the backend (create directories, authenticate, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Write content to a file.
   * @returns The path/key where the file was stored
   */
  write(filename: string, content: string): Promise<string>;

  /**
   * Read content from a file.
   * @returns Content or null if not found
   */
  read(filename: string): Promise<string | null>;

  /**
   * Delete a file.
   */
  delete(filename: string): Promise<void>;

  /**
   * Delete all files (cleanup on shutdown).
   */
  deleteAll(): Promise<void>;

  /**
   * Get backend type identifier.
   */
  readonly type: string;
}

/**
 * Local file system backend.
 * Default implementation for development and STDIO transport.
 */
export class LocalFileBackend implements FileBackend {
  readonly type = 'local-fs';
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? join(tmpdir(), 'aip-mcp-specs', 'files');
  }

  async initialize(): Promise<void> {
    await mkdir(this.baseDir, { recursive: true });
  }

  async write(filename: string, content: string): Promise<string> {
    const filePath = join(this.baseDir, filename);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  async read(filename: string): Promise<string | null> {
    const filePath = join(this.baseDir, filename);
    try {
      return await readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  async delete(filename: string): Promise<void> {
    const filePath = join(this.baseDir, filename);
    try {
      await unlink(filePath);
    } catch {
      // Ignore file not found
    }
  }

  async deleteAll(): Promise<void> {
    try {
      await rm(this.baseDir, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  }
}

// Future implementations can be added:
// - S3FileBackend
// - GCSFileBackend
// - AzureBlobFileBackend
