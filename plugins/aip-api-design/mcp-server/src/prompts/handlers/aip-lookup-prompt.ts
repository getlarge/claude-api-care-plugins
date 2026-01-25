/**
 * AIP Lookup Prompt
 *
 * Prompt handler for fetching and explaining Google API Improvement Proposals.
 * Migrated from Zod to TypeBox for @getlarge/fastify-mcp compatibility.
 */

import { Type, type Static } from '@sinclair/typebox';
import type { GetPromptResult } from '@getlarge/fastify-mcp';
import type { PromptDefinition } from '../types.js';

/**
 * TypeBox schema for AIP lookup prompt arguments.
 */
export const AipLookupArgsSchema = Type.Object({
  aip: Type.String({
    description: 'AIP number to look up (e.g., 122, 158, 193)',
    pattern: '^[0-9]+$', // Must be a numeric string
  }),
  context: Type.Optional(
    Type.String({
      description: 'Optional context or specific question about the AIP',
    })
  ),
  finding: Type.Optional(
    Type.String({
      description: 'Optional review finding that references this AIP',
    })
  ),
});

export type AipLookupArgs = Static<typeof AipLookupArgsSchema>;

/**
 * Build the AIP lookup prompt text based on the agent definition.
 */
function buildAipLookupPrompt(args: AipLookupArgs): string {
  const { context, finding } = args;
  const aip = parseInt(args.aip, 10);

  let prompt = `# AIP Lookup Agent

Fetch and explain Google API Improvement Proposal (AIP) ${aip}.

## Task

`;

  if (finding) {
    prompt += `A review finding referenced AIP-${aip}:

\`\`\`
${finding}
\`\`\`

`;
  }

  if (context) {
    prompt += `User's question or context:

${context}

`;
  }

  prompt += `## AIP Sources

- **Individual AIP:** https://google.aip.dev/${aip}
- **GitHub (raw markdown):** https://github.com/aip-dev/google.aip.dev/tree/master/aip/general

## Instructions

1. **Fetch the AIP** from google.aip.dev/${aip}
   - Use web fetch to get the page
   - Extract the key guidance

2. **Summarize for the user**:
   - What the AIP requires (MUST/SHOULD/MAY)
   - Why this matters (rationale)
   - Practical examples
   - Common mistakes to avoid

3. **Relate to the specific case**:`;

  if (finding) {
    prompt += `
   - How does this AIP apply to the review finding?
   - What changes would bring the API into compliance?`;
  } else if (context) {
    prompt += `
   - How does this AIP apply to the user's question?
   - What specific guidance is relevant?`;
  } else {
    prompt += `
   - Provide practical examples of how to apply this AIP
   - Common patterns and anti-patterns`;
  }

  prompt += `

## Key AIP Reference

`;

  // Add specific guidance for commonly requested AIPs
  const aipGuidance: Record<number, string> = {
    121: '**AIP-121**: Resource-oriented design principles',
    122: '**AIP-122**: Resource names (plural, noun-based)',
    123: '**AIP-123**: Resource types',
    131: '**AIP-131**: Standard method: Get',
    132: '**AIP-132**: Standard method: List (includes ordering)',
    133: '**AIP-133**: Standard method: Create',
    134: '**AIP-134**: Standard method: Update (field masks)',
    135: '**AIP-135**: Standard method: Delete',
    136: '**AIP-136**: Custom methods (non-CRUD operations)',
    151: '**AIP-151**: Long-running operations',
    155: '**AIP-155**: Request identification (idempotency)',
    158: '**AIP-158**: Pagination',
    160: '**AIP-160**: Filtering',
    161: '**AIP-161**: Field masks',
    193: '**AIP-193**: Errors (standard error model)',
    194: '**AIP-194**: Automatic retry (retry guidance)',
    231: '**AIP-231**: Batch methods',
  };

  if (aipGuidance[aip]) {
    prompt += `${aipGuidance[aip]}

`;
  }

  prompt += `## Important

- Do NOT invent AIP content - fetch from google.aip.dev
- Summarize key points, don't overwhelm with entire AIP text
- Focus on practical application to REST/OpenAPI (not just gRPC/protobuf)
- Provide concrete examples
`;

  return prompt;
}

export const aipLookupPrompt: PromptDefinition<typeof AipLookupArgsSchema> = {
  name: 'aip-lookup',
  title: 'Fetch and Explain AIP',
  description:
    'Fetch and explain a specific Google API Improvement Proposal (AIP)',
  argsSchema: AipLookupArgsSchema,
  handler: {
    async execute(args: AipLookupArgs): Promise<GetPromptResult> {
      // @getlarge/fastify-mcp validates the schema before calling this handler
      // So we only need to do additional business logic validation here

      const promptText = buildAipLookupPrompt(args);
      const aipNum = parseInt(args.aip, 10);

      return {
        description: `Fetch and explain AIP-${aipNum}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: promptText,
            },
          },
        ],
      };
    },
  },
};
