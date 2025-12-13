/**
 * Get AIP Info Tool
 *
 * Returns information about a specific AIP.
 */

import { z } from 'zod';
import { AIP_METADATA } from '@getlarge/aip-openapi-reviewer';

export const GetInfoInputSchema = z.object({
  aip: z
    .number()
    .describe('AIP number (e.g., 122 for Resource Names, 158 for Pagination)'),
});

export type GetInfoInput = z.infer<typeof GetInfoInputSchema>;

export const GetInfoOutputSchema = z.object({
  aip: z.string(),
  title: z.string(),
  summary: z.string(),
  category: z.string().optional(),
  url: z.string(),
  linterDocs: z.string(),
});

export type GetInfoOutput = z.infer<typeof GetInfoOutputSchema>;

export const getInfoTool = {
  name: 'aip-get-info',
  description:
    'Get information about a specific AIP (API Improvement Proposal). Returns the AIP summary and link.',
  inputSchema: GetInfoInputSchema,

  async execute(input: GetInfoInput) {
    const { aip } = input;
    const info = AIP_METADATA[aip];

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
  },
};
