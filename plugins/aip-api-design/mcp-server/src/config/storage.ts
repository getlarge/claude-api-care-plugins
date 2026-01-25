/**
 * Storage Configuration
 *
 * Centralizes configuration for storage backends (metadata stores and file backends).
 * Reads from environment variables with sensible defaults.
 */

import type {
  CreateStoreOptions,
  StoreType,
  FileBackend,
} from '../services/store/index.js';

export interface StorageConfig {
  /**
   * Store type for metadata.
   */
  type: StoreType;

  /**
   * PostgreSQL connection URL (when type is 'postgres').
   */
  databaseUrl?: string;

  /**
   * S3 configuration (when using S3 file backend).
   */
  s3?: S3Config;

  /**
   * TTL for temp storage in milliseconds.
   */
  tempTtlMs: number;

  /**
   * TTL for findings storage in milliseconds.
   */
  findingsTtlMs: number;
}

export interface S3Config {
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketSpecs: string;
  bucketFindings: string;
  region: string;
  forcePathStyle: boolean;
}

/**
 * Get storage configuration from environment variables.
 */
export function getStorageConfig(): StorageConfig {
  const storeType =
    (process.env['STORE_TYPE'] as StoreType) ?? detectDefaultStoreType();

  return {
    type: storeType,
    databaseUrl: process.env['DATABASE_URL'],
    s3: getS3Config(),
    tempTtlMs: parseInt(process.env['TEMP_TTL_MS'] ?? '300000', 10), // 5 minutes
    findingsTtlMs: parseInt(process.env['FINDINGS_TTL_MS'] ?? '86400000', 10), // 24 hours
  };
}

/**
 * Get S3 configuration if environment variables are set.
 */
function getS3Config(): S3Config | undefined {
  const accessKeyId = process.env['S3_ACCESS_KEY_ID'];
  const secretAccessKey = process.env['S3_SECRET_ACCESS_KEY'];

  if (!accessKeyId || !secretAccessKey) {
    return undefined;
  }

  return {
    endpoint: process.env['S3_ENDPOINT'],
    accessKeyId,
    secretAccessKey,
    bucketSpecs: process.env['S3_BUCKET_SPECS'] ?? 'aip-specs',
    bucketFindings: process.env['S3_BUCKET_FINDINGS'] ?? 'aip-findings',
    region: process.env['S3_REGION'] ?? 'us-east-1',
    forcePathStyle: process.env['S3_FORCE_PATH_STYLE'] === 'true',
  };
}

/**
 * Detect default store type based on environment.
 */
function detectDefaultStoreType(): StoreType {
  if (process.env['DATABASE_URL']) {
    return 'postgres';
  }
  return 'sqlite';
}

/**
 * Create file backend based on configuration.
 * Returns undefined to use the default LocalFileBackend.
 */
export async function createFileBackendFromConfig(
  config: StorageConfig,
  prefix?: string
): Promise<FileBackend | undefined> {
  if (!config.s3) {
    return undefined;
  }

  // Dynamic import to avoid bundling issues
  const { createS3FileBackend } =
    await import('../services/store/s3-file-backend.js');

  return createS3FileBackend({
    endpoint: config.s3.endpoint,
    region: config.s3.region,
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
    bucket:
      prefix === 'findings' ? config.s3.bucketFindings : config.s3.bucketSpecs,
    prefix: prefix ? `${prefix}/` : undefined,
    forcePathStyle: config.s3.forcePathStyle,
  });
}

/**
 * Build CreateStoreOptions from storage configuration.
 */
export async function buildStoreOptions(
  config: StorageConfig,
  purpose: 'temp' | 'findings'
): Promise<CreateStoreOptions> {
  const ttlMs =
    purpose === 'findings' ? config.findingsTtlMs : config.tempTtlMs;
  const fileBackend = await createFileBackendFromConfig(config, purpose);

  const options: CreateStoreOptions = {
    type: config.type,
    ttlMs,
    fileBackend,
  };

  if (config.type === 'postgres' && config.databaseUrl) {
    options.postgres = {
      connectionUrl: config.databaseUrl,
      tableName: purpose === 'findings' ? 'findings' : 'specs',
    };
  }

  if (config.type === 'memory') {
    options.memory = {
      useFileSystem: true,
      tempDirName:
        purpose === 'findings' ? 'aip-mcp-findings' : 'aip-mcp-specs',
    };
  }

  return options;
}
