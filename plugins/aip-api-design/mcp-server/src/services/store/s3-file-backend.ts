/**
 * S3 File Backend
 *
 * S3-compatible storage backend for spec content.
 * Works with AWS S3, MinIO, Cloudflare R2, and other S3-compatible services.
 */

import type { FileBackend } from './file-backend.js';

/**
 * S3 client interface - minimal subset we need.
 * This allows using any S3-compatible client (aws-sdk v3, minio, etc.)
 */
export interface S3Client {
  send(command: S3Command): Promise<S3CommandOutput>;
}

export interface S3Command {
  input: Record<string, unknown>;
}

export interface S3CommandOutput {
  Body?: {
    transformToString(): Promise<string>;
  };
  Contents?: Array<{ Key?: string }>;
}

export interface S3FileBackendOptions {
  /**
   * S3 client instance.
   * Use @aws-sdk/client-s3 or compatible client.
   */
  client: S3Client;

  /**
   * S3 bucket name.
   */
  bucket: string;

  /**
   * Key prefix for all objects (e.g., 'specs/' or 'findings/').
   * Default: ''
   */
  prefix?: string;
}

/**
 * Factory functions for S3 commands.
 * These match @aws-sdk/client-s3 signatures.
 */
export interface S3CommandFactories {
  PutObjectCommand: new (input: {
    Bucket: string;
    Key: string;
    Body: string;
    ContentType: string;
  }) => S3Command;
  GetObjectCommand: new (input: { Bucket: string; Key: string }) => S3Command;
  DeleteObjectCommand: new (input: {
    Bucket: string;
    Key: string;
  }) => S3Command;
  ListObjectsV2Command: new (input: {
    Bucket: string;
    Prefix: string;
  }) => S3Command;
  DeleteObjectsCommand: new (input: {
    Bucket: string;
    Delete: { Objects: Array<{ Key: string }> };
  }) => S3Command;
}

/**
 * S3-compatible file backend.
 * Stores spec content in S3 buckets.
 */
export class S3FileBackend implements FileBackend {
  readonly type = 's3';
  private client: S3Client;
  private bucket: string;
  private prefix: string;
  private commands: S3CommandFactories;

  constructor(options: S3FileBackendOptions, commands: S3CommandFactories) {
    this.client = options.client;
    this.bucket = options.bucket;
    this.prefix = options.prefix ?? '';
    this.commands = commands;
  }

  async initialize(): Promise<void> {
    // S3 doesn't need initialization - bucket should exist
    // Could add bucket existence check here if desired
  }

  async write(filename: string, content: string): Promise<string> {
    const key = this.getKey(filename);
    const contentType = filename.endsWith('.yaml')
      ? 'application/x-yaml'
      : 'application/json';

    const command = new this.commands.PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: content,
      ContentType: contentType,
    });

    await this.client.send(command);
    return `s3://${this.bucket}/${key}`;
  }

  async read(filename: string): Promise<string | null> {
    const key = this.getKey(filename);

    try {
      const command = new this.commands.GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);
      if (response.Body) {
        return await response.Body.transformToString();
      }
      return null;
    } catch (error) {
      // Handle NoSuchKey error
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        (error.name === 'NoSuchKey' || error.name === 'NotFound')
      ) {
        return null;
      }
      throw error;
    }
  }

  async delete(filename: string): Promise<void> {
    const key = this.getKey(filename);

    try {
      const command = new this.commands.DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
    } catch {
      // Ignore delete errors (object may not exist)
    }
  }

  async deleteAll(): Promise<void> {
    try {
      // List all objects with prefix
      const listCommand = new this.commands.ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: this.prefix,
      });

      const listResponse = await this.client.send(listCommand);
      const objects = listResponse.Contents ?? [];

      if (objects.length === 0) {
        return;
      }

      // Delete all objects
      const deleteCommand = new this.commands.DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: objects
            .filter((obj) => obj.Key)
            .map((obj) => ({ Key: obj.Key! })),
        },
      });

      await this.client.send(deleteCommand);
    } catch {
      // Ignore cleanup errors
    }
  }

  private getKey(filename: string): string {
    return this.prefix ? `${this.prefix}${filename}` : filename;
  }
}

/**
 * Create an S3FileBackend using @aws-sdk/client-s3.
 * This is a convenience factory for the most common use case.
 */
export async function createS3FileBackend(options: {
  endpoint?: string;
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  prefix?: string;
  forcePathStyle?: boolean;
}): Promise<S3FileBackend> {
  // Dynamic import to avoid bundling issues
  const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    DeleteObjectsCommand,
  } = await import('@aws-sdk/client-s3');

  const client = new S3Client({
    endpoint: options.endpoint,
    region: options.region ?? 'us-east-1',
    credentials: {
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
    },
    forcePathStyle: options.forcePathStyle ?? true, // Required for MinIO
  });

  return new S3FileBackend(
    {
      client: client as unknown as S3FileBackend['client'],
      bucket: options.bucket,
      prefix: options.prefix,
    },
    {
      PutObjectCommand:
        PutObjectCommand as unknown as S3CommandFactories['PutObjectCommand'],
      GetObjectCommand:
        GetObjectCommand as unknown as S3CommandFactories['GetObjectCommand'],
      DeleteObjectCommand:
        DeleteObjectCommand as unknown as S3CommandFactories['DeleteObjectCommand'],
      ListObjectsV2Command:
        ListObjectsV2Command as unknown as S3CommandFactories['ListObjectsV2Command'],
      DeleteObjectsCommand:
        DeleteObjectsCommand as unknown as S3CommandFactories['DeleteObjectsCommand'],
    }
  );
}
