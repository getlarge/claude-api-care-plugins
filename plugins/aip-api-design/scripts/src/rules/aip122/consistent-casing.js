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
import { getResourceSegments, detectCasingStyle } from '../helpers/index.js';

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
