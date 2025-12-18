/**
 * Code Locator Prompts
 *
 * Framework-specific search patterns and prompt building for code location.
 * Based on:
 * - plugins/aip-api-design/agents/aip-code-locator.md
 * - plugins/aip-api-design/skills/aip-code-correlator/SKILL.md
 */

export type Framework = 'nestjs' | 'fastify' | 'express' | 'unknown';

/**
 * Extract resource name and segments from an API path.
 */
export function extractPathInfo(path: string): {
  resourceName: string;
  segments: string[];
} {
  const segments = path
    .split('/')
    .filter((s) => s && !s.startsWith('{') && !s.startsWith(':'));
  const resourceName = segments[segments.length - 1] ?? 'resource';
  return { resourceName, segments };
}

/**
 * Get framework-specific search patterns.
 */
export function getFrameworkPatterns(
  framework: Framework,
  method: string,
  path: string,
  resourceName: string
): string {
  const methodCapitalized = method.charAt(0) + method.slice(1).toLowerCase();

  const patterns: Record<Framework, string> = {
    nestjs: `**NestJS** (look for decorators):
- @Controller('${resourceName}') or @Controller with path containing '${resourceName}'
- @${methodCapitalized}(':id') or @${methodCapitalized}()
- Files matching *.controller.ts

Search patterns to try:
- Grep for: @Controller.*${resourceName}
- Grep for: @${methodCapitalized}

Framework detection: Look for @nestjs/core in package.json`,

    fastify: `**Fastify** (look for route registration):
- fastify.${method.toLowerCase()}('${path}', handler)
- app.route({ method: '${method}', url: '${path}' })
- Files matching *.route.ts, *.routes.ts

Search patterns to try:
- Grep for: \\.${method.toLowerCase()}\\(.*${resourceName}
- Grep for: method:.*${method}.*url:.*${resourceName}

Framework detection: Look for fastify in package.json`,

    express: `**Express** (look for router methods):
- router.${method.toLowerCase()}('${path}', handler)
- app.${method.toLowerCase()}('${path}', handler)
- Files matching *.router.ts, *.routes.ts

Search patterns to try:
- Grep for: router\\.${method.toLowerCase()}.*${resourceName}
- Grep for: app\\.${method.toLowerCase()}.*${resourceName}

Framework detection: Look for express in package.json`,

    unknown: `Look for common patterns:
- HTTP method decorators/functions (${method.toLowerCase()}, @${methodCapitalized})
- Path strings containing '${resourceName}'
- Controller or route handler files

Try detecting framework from package.json:
- @nestjs/core → NestJS
- fastify → Fastify
- express → Express`,
  };

  return patterns[framework];
}

export interface LocatorPromptOptions {
  method: string;
  path: string;
  framework: Framework;
  projectRoot: string;
  operationId?: string;
}

/**
 * Build the prompt for code location.
 */
export function buildLocatorPrompt(options: LocatorPromptOptions): string {
  const { method, path, framework, projectRoot, operationId } = options;
  const { resourceName, segments } = extractPathInfo(path);
  const frameworkPattern = getFrameworkPatterns(
    framework,
    method,
    path,
    resourceName
  );

  return `# AIP Code Locator Task

Find the code that implements this API operation:
- **Method**: ${method}
- **Path**: ${path}
${operationId ? `- **OperationId**: ${operationId}` : ''}
- **Framework**: ${framework}
- **Project Root**: ${projectRoot}

## Core Responsibility

Find the code file and line number where this API operation is defined.

**DO NOT**:
- Suggest improvements or changes
- Critique the implementation
- Analyze for bugs or issues

**ONLY**:
- Find where the operation is implemented
- Report file:line locations
- Provide brief context snippets

## Search Strategy

### Step 1: Extract Search Terms
From path \`${path}\`:
- Resource name: \`${resourceName}\`
- Path segments: ${segments.map((s) => `\`${s}\``).join(', ') || 'none'}
- Parameter patterns: :id, {id}, [id]

### Step 2: Framework-Specific Search
${frameworkPattern}

${operationId ? `### Step 3: Search by OperationId\nSearch for: \`${operationId}\` in @ApiOperation decorators or function names.` : ''}

### Step 4: Verify by Reading
For each candidate file:
1. Read the file around the match
2. Confirm the HTTP method matches (${method})
3. Confirm the path matches (${path})

## Output Format

Return a JSON object with this structure:

\`\`\`json
{
  "file": "path/to/controller.ts",
  "line": 42,
  "type": "controller",
  "confidence": "high",
  "snippet": "few lines of relevant code",
  "reasoning": "why this is the correct location"
}
\`\`\`

### Confidence Levels
- **high**: Exact path match in decorator/route definition + correct HTTP method
- **medium**: Path segment match but not exact + correct HTTP method
- **low**: Only resource name matches or multiple candidates

### If Not Found
Return:
\`\`\`json
{
  "file": null,
  "confidence": "low",
  "reasoning": "why it couldn't be found"
}
\`\`\``;
}
