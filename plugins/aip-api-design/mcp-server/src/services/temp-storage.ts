/**
 * Temporary Storage Service (Facade)
 *
 * Re-exports store types and provides singleton management.
 * This file maintains backward compatibility with existing code.
 */

export {
  BaseStore,
  StoredSpec,
  StoreOptions,
  StoreResult,
  StoreStats,
  MemoryStore,
  SqliteStore,
  FileBackend,
  LocalFileBackend,
  createStore,
  detectStoreType,
  StoreType,
  CreateStoreOptions,
} from './store/index.js';

import { BaseStore, createStore, CreateStoreOptions } from './store/index.js';

// Singleton storage instance
let storage: BaseStore | null = null;

/**
 * Get the current storage instance.
 * Throws if not initialized.
 */
export function getTempStorage(): BaseStore {
  if (!storage) {
    throw new Error(
      'TempStorage not initialized. Call initTempStorage() first.'
    );
  }
  return storage;
}

/**
 * Initialize temp storage (call once at startup).
 */
export async function initTempStorage(
  options?: CreateStoreOptions
): Promise<BaseStore> {
  if (storage) {
    await storage.shutdown();
  }
  storage = createStore(options);
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
