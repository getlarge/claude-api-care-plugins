/**
 * List Rules Tool
 *
 * Lists available AIP rules with optional filtering.
 */

import { z } from 'zod';
import { defaultRegistry } from '@getlarge/aip-openapi-reviewer';
import type { RuleCategory } from '@getlarge/aip-openapi-reviewer/types';

export const ListRulesInputSchema = z.object({
  aip: z.number().optional().describe('Filter by AIP number (e.g., 122, 158)'),
  category: z
    .string()
    .optional()
    .describe(
      'Filter by category (naming, pagination, errors, standard-methods, idempotency, filtering)'
    ),
});

export type ListRulesInput = z.infer<typeof ListRulesInputSchema>;

export const ListRulesOutputSchema = z.object({
  rules: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      aip: z.string().optional(),
      severity: z.enum(['error', 'warning', 'suggestion']),
      category: z.string(),
      description: z.string(),
    })
  ),
  count: z.number(),
});

export type ListRulesOutput = z.infer<typeof ListRulesOutputSchema>;

export const listRulesTool = {
  name: 'aip-list-rules',
  description:
    'List available AIP rules. Can filter by AIP number, category, or return all rules.',
  inputSchema: ListRulesInputSchema,

  async execute(input: ListRulesInput) {
    const { aip, category } = input;
    let rules = defaultRegistry.getAll();

    if (aip !== undefined) {
      rules = defaultRegistry.getByAip(aip);
    } else if (category) {
      rules = defaultRegistry.getByCategory(category as RuleCategory);
    }

    const ruleInfo: ListRulesOutput['rules'] = rules.map((r) => ({
      id: r.id,
      name: r.name,
      aip: r.aip,
      severity: r.severity,
      category: r.category,
      description: r.description,
    }));

    const output: ListRulesOutput = { rules: ruleInfo, count: ruleInfo.length };

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
