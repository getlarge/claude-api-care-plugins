/**
 * Findings Storage Service (Facade)
 *
 * Manages storage for AIP review findings using the same store infrastructure
 * as temp-storage, but with:
 * - Longer TTL (1 day default)
 * - Custom ID support (reviewId = spec content hash)
 * - Separate storage location
 */

import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BaseStore, createStore, CreateStoreOptions } from './store/index.js';

// Default TTL: 1 day (findings are useful across sessions)
const DEFAULT_FINDINGS_TTL_MS = 24 * 60 * 60 * 1000;

// Singleton storage instance for findings
let findingsStore: BaseStore | null = null;

/**
 * Generate a reviewId from spec content.
 * Uses SHA-256, truncated to 16 chars for readability.
 */
export function generateReviewId(specContent: string | Buffer): string {
  const content =
    typeof specContent === 'string' ? specContent : specContent.toString();
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Get the current findings storage instance.
 * Throws if not initialized.
 */
export function getFindingsStorage(): BaseStore {
  if (!findingsStore) {
    throw new Error(
      'FindingsStorage not initialized. Call initFindingsStorage() first.'
    );
  }
  return findingsStore;
}

/**
 * Initialize findings storage (call once at startup).
 *
 * @param options - Store options (type, ttlMs, etc.)
 */
export async function initFindingsStorage(
  options?: Partial<CreateStoreOptions>
): Promise<BaseStore> {
  if (findingsStore) {
    await findingsStore.shutdown();
  }

  // Configure for findings storage
  const findingsOptions: CreateStoreOptions = {
    type: options?.type ?? 'memory',
    ttlMs: options?.ttlMs ?? DEFAULT_FINDINGS_TTL_MS,
    ...options,
    // Use separate paths for findings
    memory: {
      useFileSystem: options?.memory?.useFileSystem ?? true,
      ...options?.memory,
    },
    sqlite: {
      dbPath:
        options?.sqlite?.dbPath ??
        join(tmpdir(), 'aip-mcp-findings', 'findings.db'),
      ...options?.sqlite,
    },
  };

  findingsStore = createStore(findingsOptions);
  await findingsStore.initialize();
  return findingsStore;
}

/**
 * Shutdown findings storage.
 */
export async function shutdownFindingsStorage(): Promise<void> {
  if (findingsStore) {
    await findingsStore.shutdown();
    findingsStore = null;
  }
}

/**
 * Store review findings.
 *
 * @param reviewId - Spec content hash (use generateReviewId())
 * @param findings - The findings data to store
 * @param contentType - Format: 'json' or 'yaml'
 */
export async function storeFindings(
  reviewId: string,
  findings: Record<string, unknown>,
  contentType: 'json' | 'yaml' = 'json'
): Promise<{ id: string; expiresAt: number }> {
  const store = getFindingsStorage();
  const result = await store.store(findings, {
    id: reviewId,
    contentType,
    filename: `findings-${reviewId}.${contentType === 'yaml' ? 'yaml' : 'json'}`,
  });
  return { id: result.id, expiresAt: result.expiresAt };
}

/**
 * Retrieve stored findings by reviewId.
 *
 * @param reviewId - The review ID (spec content hash)
 * @returns The stored findings or null if not found/expired
 */
export async function getFindings(
  reviewId: string
): Promise<Record<string, unknown> | null> {
  const store = getFindingsStorage();
  const stored = await store.get(reviewId);
  if (!stored) return null;

  try {
    return JSON.parse(stored.content);
  } catch {
    return null;
  }
}

/**
 * Check if findings exist for a reviewId.
 */
export async function hasFindings(reviewId: string): Promise<boolean> {
  const store = getFindingsStorage();
  const stored = await store.get(reviewId);
  return stored !== null;
}

/**
 * Delete stored findings.
 */
export async function deleteFindings(reviewId: string): Promise<void> {
  const store = getFindingsStorage();
  await store.delete(reviewId);
}
