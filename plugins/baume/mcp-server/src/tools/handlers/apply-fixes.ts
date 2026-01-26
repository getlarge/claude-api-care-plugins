/**
 * Apply Fixes Handler
 *
 * Applies suggested fixes to an OpenAPI spec.
 * Adapted for @platformatic/mcp HandlerContext.
 *
 * Supports two input modes for the spec:
 * - specPath: Local file path (STDIO transport)
 * - specUrl: HTTP(S) URL to fetch spec (HTTP transport)
 *
 * Spec data is transferred to worker via SharedArrayBuffer for
 * zero-copy transfer. Parsing and fixing happens in the worker thread.
 *
 * For token efficiency, modified specs are stored temporarily and a
 * signed URL is returned instead of the full spec content.
 */

import type {
  HandlerContext,
  CallToolResult,
} from '../../types/mcp-context.js';

import { loadSpecRaw, writeSpecToPath } from '../spec-loader.js';
import { getTempStorage } from '../../services/temp-storage.js';
import { getFindings } from '../../services/findings-storage.js';
import type { WorkerPool, WorkerTask } from '../worker-pool.js';
import type {
  ApplyFixesInput,
  ApplyFixesOutput,
  BaseFinding,
} from '../../schemas/index.js';

interface ApplyFixesHandlerDeps {
  workerPool: WorkerPool;
  context: HandlerContext;
}

interface ApplyFixesResult {
  modifiedSpec: Record<string, unknown>;
  results: ApplyFixesOutput['results'];
  summary: ApplyFixesOutput['summary'];
  errors: string[];
  sourcePath: string;
}

/**
 * Execute the baume-apply-fixes tool.
 */
export async function executeApplyFixes(
  params: ApplyFixesInput,
  deps: ApplyFixesHandlerDeps
): Promise<CallToolResult> {
  const { workerPool } = deps;
  const { specPath, specUrl, reviewId, dryRun, writeBack } = params;

  // Validate input: either specPath or specUrl must be provided
  if (!specPath && !specUrl) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: 'Either specPath or specUrl must be provided',
          }),
        },
      ],
      isError: true,
    };
  }

  // Retrieve cached findings using reviewId
  const cached = await getFindings(reviewId);
  if (!cached) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: `No cached findings found for reviewId: ${reviewId}. Run baume-review first.`,
          }),
        },
      ],
      isError: true,
    };
  }

  // Use cached findings (they include the fix property)
  const findings = (cached as { findings: BaseFinding[] }).findings;

  if (!findings || findings.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: 'No findings to apply.',
          }),
        },
      ],
      isError: true,
    };
  }

  // Load spec as raw buffer (no parsing on main thread)
  const loaded = await loadSpecRaw({ specPath, specUrl });
  if (!loaded) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: 'No spec provided. Use specPath or specUrl.',
          }),
        },
      ],
      isError: true,
    };
  }

  // Copy to SharedArrayBuffer for zero-copy transfer to worker
  const sharedBuffer = new SharedArrayBuffer(loaded.buffer.byteLength);
  new Uint8Array(sharedBuffer).set(new Uint8Array(loaded.buffer));

  const task: WorkerTask = {
    type: 'apply-fixes',
    payload: {
      findings,
      dryRun,
    },
    specBuffer: sharedBuffer,
    contentType: loaded.contentType,
    sourcePath: loaded.sourcePath,
  };

  const result = await workerPool.execute(task);

  if (!result.success) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ error: result.error }),
        },
      ],
      isError: true,
    };
  }

  const data = result.data as ApplyFixesResult;
  const { modifiedSpec, results, summary, errors, sourcePath } = data;

  // Write back to file if requested and using specPath
  let writtenTo: string | undefined;
  if (writeBack && specPath && !dryRun) {
    await writeSpecToPath(modifiedSpec, specPath);
    writtenTo = specPath;
  }

  // Store modified spec and get signed URL (token efficiency)
  const tempStorage = getTempStorage();
  const contentType = loaded.contentType;

  const stored = await tempStorage.store(modifiedSpec, {
    contentType,
    filename: `fixed-${Date.now()}.${contentType === 'yaml' ? 'yaml' : 'json'}`,
  });

  // Build typed output
  const output: ApplyFixesOutput = {
    results: results as ApplyFixesOutput['results'],
    summary: summary as ApplyFixesOutput['summary'],
    errors: errors as ApplyFixesOutput['errors'],
    specSource: sourcePath,
    ...(writtenTo && { writtenTo }),
    expiresAt: new Date(stored.expiresAt).toISOString(),
  };

  // Build content array with text and optional resource link
  const mimeType =
    contentType === 'yaml' ? 'application/x-yaml' : 'application/json';
  const filename = `fixed-spec.${contentType === 'yaml' ? 'yaml' : 'json'}`;

  const resourceUri = `baume://specs?id=${stored.id}`;

  // TODO: Notify subscribers of updated findings resource
  // await fastify.mcpSendToSession(sessionId, {
  //   jsonrpc: '2.0',
  //   method: 'notifications/resources/updated',
  //   params: { uri: resourceUri },
  // });

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(output, null, 2),
      },
      {
        type: 'resource_link' as const,
        uri: resourceUri,
        name: filename,
        description: 'Modified OpenAPI spec with fixes applied',
        mimeType,
      },
    ],
    structuredContent: output,
  };
}
