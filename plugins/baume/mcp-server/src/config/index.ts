/**
 * Configuration Module
 *
 * Centralized configuration for the MCP server.
 */

export {
  getStorageConfig,
  buildStoreOptions,
  createFileBackendFromConfig,
  type StorageConfig,
  type S3Config,
} from './storage.js';
