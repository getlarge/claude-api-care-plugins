/**
 * Shared utilities for loading OpenAPI specs from various sources.
 *
 * Supports two loading modes:
 * - Parsed: Returns spec as JavaScript object (for inline execution)
 * - Raw: Returns spec as ArrayBuffer (for worker thread transfer via SharedArrayBuffer)
 */

import { readFile, writeFile } from 'node:fs/promises';
import { DEFAULT_TIMEOUTS } from '../utils/timeout.js';

export interface LoadedSpec {
  spec: Record<string, unknown>;
  sourcePath: string;
}

export interface LoadedSpecRaw {
  buffer: ArrayBuffer;
  sourcePath: string;
  contentType: 'json' | 'yaml';
}

/**
 * Parse spec content from string (handles both JSON and YAML)
 */
export async function parseSpec(
  content: string,
  sourcePath: string
): Promise<Record<string, unknown>> {
  // Try JSON first
  try {
    return JSON.parse(content);
  } catch {
    // Try YAML if file extension suggests it
    if (sourcePath.endsWith('.yaml') || sourcePath.endsWith('.yml')) {
      try {
        const yaml = await import('yaml');
        return yaml.parse(content);
      } catch {
        throw new Error(
          `Failed to parse YAML spec. Ensure 'yaml' package is installed.`
        );
      }
    }
    throw new Error(`Failed to parse spec as JSON from ${sourcePath}`);
  }
}

/**
 * Load spec from local file path
 */
export async function loadSpecFromPath(specPath: string): Promise<LoadedSpec> {
  try {
    const content = await readFile(specPath, 'utf-8');
    const spec = await parseSpec(content, specPath);
    return { spec, sourcePath: specPath };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Spec file not found: ${specPath}`);
    }
    throw error;
  }
}

/**
 * Load spec from HTTP(S) URL
 */
export async function loadSpecFromUrl(
  specUrl: string,
  timeoutMs = DEFAULT_TIMEOUTS.fetch
): Promise<LoadedSpec> {
  const response = await fetch(specUrl, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch spec from ${specUrl}: ${response.status}`);
  }
  const content = await response.text();
  const spec = await parseSpec(content, specUrl);
  return { spec, sourcePath: specUrl };
}

/**
 * Load spec from any supported source
 */
export async function loadSpec(options: {
  specPath?: string;
  specUrl?: string;
  spec?: Record<string, unknown>;
}): Promise<LoadedSpec | null> {
  const { specPath, specUrl, spec } = options;

  if (specPath) {
    return loadSpecFromPath(specPath);
  }
  if (specUrl) {
    return loadSpecFromUrl(specUrl);
  }
  if (spec) {
    return { spec, sourcePath: 'inline-spec.json' };
  }
  return null;
}

/**
 * Serialize spec back to string (JSON or YAML based on path extension)
 */
export async function serializeSpec(
  spec: Record<string, unknown>,
  sourcePath: string
): Promise<string> {
  if (sourcePath.endsWith('.yaml') || sourcePath.endsWith('.yml')) {
    try {
      const yaml = await import('yaml');
      return yaml.stringify(spec);
    } catch {
      // Fall back to JSON if yaml not available
      return JSON.stringify(spec, null, 2);
    }
  }
  return JSON.stringify(spec, null, 2);
}

/**
 * Write spec back to file
 */
export async function writeSpecToPath(
  spec: Record<string, unknown>,
  specPath: string
): Promise<void> {
  const serialized = await serializeSpec(spec, specPath);
  await writeFile(specPath, serialized, 'utf-8');
}

// ============================================================================
// Raw Buffer Loading (for worker thread transfer via SharedArrayBuffer)
// ============================================================================

/**
 * Determine content type from file extension.
 */
function getContentTypeFromExtension(path: string): 'json' | 'yaml' {
  return path.endsWith('.yaml') || path.endsWith('.yml') ? 'yaml' : 'json';
}

/**
 * Determine content type from Content-Type header.
 * Falls back to extension-based detection if header is ambiguous.
 */
function getContentTypeFromHeader(
  contentType: string | null,
  fallbackPath: string
): 'json' | 'yaml' {
  if (contentType) {
    const lower = contentType.toLowerCase();
    if (lower.includes('yaml') || lower.includes('x-yaml')) {
      return 'yaml';
    }
    if (lower.includes('json')) {
      return 'json';
    }
  }
  // Fall back to extension-based detection
  return getContentTypeFromExtension(fallbackPath);
}

/**
 * Load spec as raw buffer from local file (no parsing).
 * Parsing will happen in the worker thread.
 */
export async function loadSpecRawFromPath(
  specPath: string
): Promise<LoadedSpecRaw> {
  try {
    const buffer = await readFile(specPath);
    return {
      // Convert Node.js Buffer to ArrayBuffer (handling potential shared buffer)
      buffer: buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      ),
      sourcePath: specPath,
      contentType: getContentTypeFromExtension(specPath),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Spec file not found: ${specPath}`);
    }
    throw error;
  }
}

/**
 * Load spec as raw buffer from URL (no parsing).
 * Uses Content-Type header to determine format, falls back to URL extension.
 * Parsing will happen in the worker thread.
 */
export async function loadSpecRawFromUrl(
  specUrl: string,
  timeoutMs = DEFAULT_TIMEOUTS.fetch
): Promise<LoadedSpecRaw> {
  const response = await fetch(specUrl, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch spec from ${specUrl}: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const contentType = getContentTypeFromHeader(
    response.headers.get('content-type'),
    specUrl
  );
  return {
    buffer,
    sourcePath: specUrl,
    contentType,
  };
}

/**
 * Load spec as raw buffer from path or URL.
 * No parsing happens here — that's done in the worker thread.
 *
 * Note: Inline spec objects are not supported for raw loading.
 * Use specPath or specUrl to avoid double-serialization overhead.
 */
export async function loadSpecRaw(options: {
  specPath?: string;
  specUrl?: string;
}): Promise<LoadedSpecRaw | null> {
  const { specPath, specUrl } = options;

  if (specPath) {
    return loadSpecRawFromPath(specPath);
  }
  if (specUrl) {
    return loadSpecRawFromUrl(specUrl);
  }
  return null;
}
