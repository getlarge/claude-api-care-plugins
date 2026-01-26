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
   * Use 0 or negative for infinite TTL (no expiration).
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
    // Default to infinite TTL for postgres (persistent), 24h for others
    findingsTtlMs: parseFindingsTtl(storeType),
  };
}

/**
 * Get S3 configuration if environment variables are set.
 */
function getS3Config(): S3Config | undefined {
  // Support both S3_* (explicit) and AWS_* (Fly Tigris auto-set) env vars
  const accessKeyId =
    process.env['S3_ACCESS_KEY_ID'] ?? process.env['AWS_ACCESS_KEY_ID'];
  const secretAccessKey =
    process.env['S3_SECRET_ACCESS_KEY'] ?? process.env['AWS_SECRET_ACCESS_KEY'];

  if (!accessKeyId || !secretAccessKey) {
    return undefined;
  }

  // Fly Tigris uses BUCKET_NAME for a single bucket, we need two
  // Fall back to single bucket with prefixes if separate buckets not configured
  const defaultBucket = process.env['BUCKET_NAME'] ?? 'baume-mcp';

  return {
    endpoint: process.env['S3_ENDPOINT'] ?? process.env['AWS_ENDPOINT_URL_S3'],
    accessKeyId,
    secretAccessKey,
    bucketSpecs: process.env['S3_BUCKET_SPECS'] ?? defaultBucket,
    bucketFindings: process.env['S3_BUCKET_FINDINGS'] ?? defaultBucket,
    region: process.env['S3_REGION'] ?? process.env['AWS_REGION'] ?? 'auto',
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
 * Parse findings TTL from environment.
 * Defaults to infinite (0) for postgres, 24 hours for others.
 */
function parseFindingsTtl(storeType: StoreType): number {
  const envValue = process.env['FINDINGS_TTL_MS'];
  if (envValue !== undefined) {
    return parseInt(envValue, 10);
  }
  // Default: infinite for postgres, 24 hours for others
  return storeType === 'postgres' ? 0 : 24 * 60 * 60 * 1000;
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
    await import('../services/store/files/s3-file-backend.js');

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
        purpose === 'findings' ? 'baume-mcp-findings' : 'baume-mcp-specs',
    };
  }

  return options;
}
