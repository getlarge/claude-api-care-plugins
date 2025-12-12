// @ts-check
/**
 * AIP-122: Consistent Casing
 *
 * All path segments should use consistent casing style.
 *
 * @see https://google.aip.dev/122
 * @module rules/aip122/consistent-casing
 */

import { SpecRule } from '../base.js';
import {
  getResourceSegments,
  detectCasingStyle,
  pathToJsonPath,
  computeRenamedPath,
} from '../helpers/index.js';

/**
 * Convert a segment to a specific casing style
 * @param {string} segment
 * @param {string} targetStyle - 'kebab-case' | 'snake_case' | 'camelCase' | 'PascalCase'
 * @returns {string}
 */
function convertCasing(segment, targetStyle) {
  // First normalize to words (split on - _ or case boundaries)
  const words = segment
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(' ')
    .filter(Boolean);

  switch (targetStyle) {
    case 'kebab-case':
      return words.join('-');
    case 'snake_case':
      return words.join('_');
    case 'camelCase':
      return words
        .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join('');
    case 'PascalCase':
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    default:
      return segment;
  }
}

/**
 * Rule: Consistent casing across all paths
 */
export class ConsistentCasingRule extends SpecRule {
  constructor() {
    super({
      id: 'aip122/consistent-casing',
      name: 'Consistent Casing',
      aip: 'AIP-122',
      severity: 'warning',
      description: 'All path segments should use consistent casing style',
    });
  }

  /**
   * @param {import('../../types.ts').OpenAPISpec} spec
   * @param {import('../../types.ts').RuleContext} ctx
   * @returns {import('../../types.ts').Finding[]}
   */
  checkSpec(spec, ctx) {
    const findings = [];
    /** @type {Map<string, number>} */
    const casingCounts = new Map();

    // Collect all resource segments and their casing
    for (const path of Object.keys(spec.paths || {})) {
      for (const segment of getResourceSegments(path)) {
        const style = detectCasingStyle(segment);
        if (style !== 'lowercase') {
          casingCounts.set(style, (casingCounts.get(style) || 0) + 1);
        }
      }
    }

    // If we have multiple casing styles, flag inconsistency
    const styles = [...casingCounts.entries()].filter(([, count]) => count > 0);
    if (styles.length > 1) {
      // Find dominant style
      const dominant = styles.reduce((a, b) => (a[1] > b[1] ? a : b))[0];

      // Flag paths that don't match dominant style
      for (const path of Object.keys(spec.paths || {})) {
        for (const segment of getResourceSegments(path)) {
          const style = detectCasingStyle(segment);
          if (style !== 'lowercase' && style !== dominant) {
            const convertedSegment = convertCasing(segment, dominant);
            const newPath = computeRenamedPath(path, segment, convertedSegment);
            findings.push(
              ctx.createFinding({
                path,
                message: `Inconsistent casing: '${segment}' uses ${style}, but API predominantly uses ${dominant}`,
                suggestion: `Convert to ${dominant} for consistency`,
                context: {
                  segment,
                  currentStyle: style,
                  dominantStyle: dominant,
                },
                fix: {
                  type: 'rename-path-segment',
                  jsonPath: pathToJsonPath(path),
                  target: {
                    segment,
                    currentStyle: style,
                    dominantStyle: dominant,
                  },
                  replacement: convertedSegment,
                  specChanges: [
                    {
                      operation: 'rename-key',
                      path: '$.paths',
                      from: path,
                      to: newPath,
                    },
                  ],
                },
              })
            );
          }
        }
      }
    }

    return findings;
  }
}

export const consistentCasing = new ConsistentCasingRule();
