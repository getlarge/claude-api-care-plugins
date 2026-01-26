/**
 * LLM Response Parsing Service
 *
 * Utilities for extracting structured data from LLM text responses.
 */

/**
 * Extract JSON from LLM response text.
 *
 * Handles common formats:
 * - ```json ... ``` code blocks
 * - Raw JSON objects (finds first complete object)
 *
 * @param text - Raw LLM response text
 * @returns Extracted JSON string or null
 */
export function extractJson(text: string): string | null {
  // Try code block format first: ```json ... ```
  const codeBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Find first complete JSON object using brace counting
  let braceCount = 0;
  let start = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '{') {
      if (start === -1) {
        start = i; // Mark start of first object
      }
      braceCount++;
    } else if (char === '}') {
      braceCount--;

      // Found complete object when braces balanced
      if (braceCount === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null; // No complete JSON object found
}

/**
 * Parse JSON from LLM response text.
 *
 * @param text - Raw LLM response text
 * @returns Parsed object or null if extraction/parsing fails
 */
export function parseJsonResponse<T = unknown>(text: string): T | null {
  const jsonStr = extractJson(text);
  if (!jsonStr) {
    return null;
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

/**
 * Extract text content from MCP sampling response.
 *
 * Handles both single content block and array formats.
 *
 * @param content - MCP response content (single or array)
 * @returns Extracted text or null
 */
export function extractTextContent(
  content:
    | { type: string; text?: string }
    | Array<{ type: string; text?: string }>
): string | null {
  if (Array.isArray(content)) {
    const textBlock = content.find((c) => c.type === 'text');
    return textBlock?.text ?? null;
  }

  if (content.type === 'text') {
    return content.text ?? null;
  }

  return null;
}

/**
 * Collect text from Claude Agent SDK message stream.
 *
 * @param messages - Async iterable of SDK messages
 * @returns Concatenated text from assistant messages
 */
export async function collectAgentText(
  messages: AsyncIterable<{
    type: string;
    message?: { content?: unknown };
  }>
): Promise<string> {
  let text = '';

  for await (const message of messages) {
    if (message.type === 'assistant' && message.message?.content) {
      const content = message.message.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (
            typeof block === 'object' &&
            block !== null &&
            'type' in block &&
            block.type === 'text' &&
            'text' in block
          ) {
            text += block.text;
          }
        }
      } else if (typeof content === 'string') {
        text += content;
      }
    }
  }

  return text;
}
