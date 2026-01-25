/**
 * Get AIP Info Handler
 *
 * Returns information about a specific AIP.
 * Adapted for @getlarge/fastify-mcp HandlerContext.
 */

import { AIP_METADATA } from '@getlarge/aip-openapi-reviewer';
import type { CallToolResult } from '@getlarge/fastify-mcp';

import type { GetInfoInput, GetInfoOutput } from '../../schemas/index.js';

/**
 * Execute the get-info tool.
 */
export async function executeGetInfo(
  params: GetInfoInput
): Promise<CallToolResult> {
  const { aip } = params;
  const info = AIP_METADATA[aip as keyof typeof AIP_METADATA];

  if (!info) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: `AIP-${aip} not found in local cache`,
            hint: `View at https://google.aip.dev/${aip}`,
          }),
        },
      ],
    };
  }

  const output: GetInfoOutput = {
    aip: `AIP-${aip}`,
    title: info.title,
    summary: info.summary,
    category: info.category,
    url: `https://google.aip.dev/${aip}`,
    linterDocs: `https://linter.aip.dev/${aip}`,
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(output, null, 2),
      },
    ],
    structuredContent: output,
  };
}
