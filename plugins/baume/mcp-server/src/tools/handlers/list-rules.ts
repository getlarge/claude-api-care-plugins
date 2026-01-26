/**
 * List Rules Handler
 *
 * Lists available AIP rules with optional filtering.
 * Adapted for @getlarge/fastify-mcp HandlerContext.
 */

import { defaultRegistry } from '@getlarge/baume-reviewer';
import type { RuleCategory } from '@getlarge/baume-reviewer/types';
import type { CallToolResult } from '@getlarge/fastify-mcp';

import type { ListRulesInput, ListRulesOutput } from '../../schemas/index.js';

/**
 * Execute the list-rules tool.
 */
export async function executeListRules(
  params: ListRulesInput
): Promise<CallToolResult> {
  const { aip, category } = params;
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
}
