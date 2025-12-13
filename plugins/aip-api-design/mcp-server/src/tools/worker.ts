/**
 * Worker thread for CPU-intensive spec operations.
 *
 * Runs review and apply-fixes operations off the main thread.
 * Receives spec data via SharedArrayBuffer and handles parsing.
 */

import { parentPort } from 'node:worker_threads';
import { createHash } from 'node:crypto';
import { parse as parseYaml } from 'yaml';
import {
  OpenAPIReviewer,
  OpenAPIFixer,
  formatJSON,
} from '@getlarge/aip-openapi-reviewer';
import type {
  RuleCategory,
  Finding,
} from '@getlarge/aip-openapi-reviewer/types';
import type { WorkerTask, WorkerResult } from './worker-pool.js';

interface ReviewPayload {
  strict?: boolean;
  categories?: string[];
  skipRules?: string[];
}

interface ApplyFixesPayload {
  findings: Finding[];
  dryRun?: boolean;
}

/**
 * Generate reviewId from spec content.
 * Uses SHA-256, truncated to 16 chars for readability.
 */
function generateReviewId(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Parse spec from SharedArrayBuffer.
 * Decodes bytes to string, then parses as JSON or YAML.
 * Also returns the raw text for reviewId generation.
 *
 * Note: Uint8Array creates a view over the SharedArrayBuffer, not a copy.
 */
function parseSpecFromBuffer(
  buffer: SharedArrayBuffer,
  contentType: 'json' | 'yaml'
): { spec: Record<string, unknown>; rawText: string } {
  const uint8 = new Uint8Array(buffer);
  const text = new TextDecoder().decode(uint8);

  const spec =
    contentType === 'yaml'
      ? (parseYaml(text) as Record<string, unknown>)
      : JSON.parse(text);

  return { spec, rawText: text };
}

function handleReview(
  payload: ReviewPayload,
  spec: Record<string, unknown>,
  sourcePath: string,
  rawText: string
): WorkerResult {
  try {
    const { strict, categories, skipRules } = payload;

    // Generate reviewId from raw spec content
    const reviewId = generateReviewId(rawText);

    const reviewer = new OpenAPIReviewer({
      strict,
      categories: categories as RuleCategory[] | undefined,
      skipRules,
    });

    const result = reviewer.review(spec, sourcePath);

    // Return structured data with reviewId
    return {
      success: true,
      data: {
        reviewId,
        ...JSON.parse(formatJSON(result)),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function handleApplyFixes(
  payload: ApplyFixesPayload,
  spec: Record<string, unknown>,
  sourcePath: string
): WorkerResult {
  try {
    const { findings, dryRun } = payload;

    const fixer = new OpenAPIFixer(spec, { dryRun });
    const results = fixer.applyFixes(findings);
    const summary = fixer.getSummary();
    const modifiedSpec = fixer.getSpec();

    return {
      success: true,
      data: {
        modifiedSpec,
        results,
        summary,
        errors: fixer.getErrors(),
        sourcePath,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Listen for tasks from the main thread.
 *
 * Spec data is received via SharedArrayBuffer for zero-copy transfer:
 * - Main thread fetches spec as ArrayBuffer (HTTP) or reads file as Buffer
 * - Copies to SharedArrayBuffer (single memcpy)
 * - Worker receives SAB reference (zero-copy)
 * - Worker decodes (TextDecoder) and parses (JSON/YAML)
 *
 * This moves ALL CPU-intensive work (parsing + review) to the worker thread,
 * leaving the main thread free to handle other requests.
 *
 * Future enhancement: Use Atomics for progress reporting on large specs,
 * allowing the main thread to poll review progress without blocking.
 *
 * @see https://nodejs.org/api/worker_threads.html#workerpostmessagevalue-transferlist
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
 */
parentPort?.on('message', (task: WorkerTask) => {
  let result: WorkerResult;

  try {
    // Parse spec from SharedArrayBuffer (CPU-intensive, done in worker)
    const { spec, rawText } = parseSpecFromBuffer(
      task.specBuffer,
      task.contentType
    );

    switch (task.type) {
      case 'review':
        result = handleReview(
          task.payload as ReviewPayload,
          spec,
          task.sourcePath,
          rawText
        );
        break;
      case 'apply-fixes':
        result = handleApplyFixes(
          task.payload as ApplyFixesPayload,
          spec,
          task.sourcePath
        );
        break;
      default:
        result = { success: false, error: `Unknown task type: ${task.type}` };
    }
  } catch (error) {
    result = {
      success: false,
      error: `Failed to parse spec: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  parentPort?.postMessage(result);
});
