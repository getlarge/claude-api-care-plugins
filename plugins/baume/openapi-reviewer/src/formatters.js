// @ts-check
/**
 * Output Formatters for Review Results
 * @module formatters
 */

/**
 * @typedef {import('./types.js').ReviewResult} ReviewResult
 * @typedef {import('./types.js').Finding} Finding
 */

/**
 * Format result as JSON
 * @param {ReviewResult} result
 * @returns {string}
 */
export function formatJSON(result) {
  return JSON.stringify(result, null, 2);
}

/**
 * Format result as Markdown report
 * @param {ReviewResult} result
 * @returns {string}
 */
export function formatMarkdown(result) {
  const lines = [];

  // Header
  lines.push(`## API Review: ${result.specPath}`);
  lines.push('');

  if (result.specTitle) {
    lines.push(`**Title:** ${result.specTitle}`);
  }
  if (result.specVersion) {
    lines.push(`**Version:** ${result.specVersion}`);
  }
  lines.push(`**Reviewed:** ${result.metadata.reviewedAt}`);
  lines.push('');

  // Group findings by severity
  const errors = result.findings.filter((f) => f.severity === 'error');
  const warnings = result.findings.filter((f) => f.severity === 'warning');
  const suggestions = result.findings.filter(
    (f) => f.severity === 'suggestion'
  );

  // Errors
  if (errors.length > 0) {
    lines.push('### 🔴 Errors (MUST fix)');
    lines.push('');
    for (const finding of errors) {
      lines.push(formatFindingMarkdown(finding));
    }
    lines.push('');
  }

  // Warnings
  if (warnings.length > 0) {
    lines.push('### 🟡 Warnings (SHOULD fix)');
    lines.push('');
    for (const finding of warnings) {
      lines.push(formatFindingMarkdown(finding));
    }
    lines.push('');
  }

  // Suggestions
  if (suggestions.length > 0) {
    lines.push('### 💡 Suggestions (MAY improve)');
    lines.push('');
    for (const finding of suggestions) {
      lines.push(formatFindingMarkdown(finding));
    }
    lines.push('');
  }

  // No issues
  if (result.findings.length === 0) {
    lines.push('### ✅ No issues found!');
    lines.push('');
  }

  // Summary
  lines.push('---');
  lines.push('');
  lines.push(
    `**Summary:** ${result.summary.errors} errors, ${result.summary.warnings} warnings, ${result.summary.suggestions} suggestions`
  );

  return lines.join('\n');
}

/**
 * Format a single finding as Markdown
 * @param {Finding} finding
 * @returns {string}
 */
function formatFindingMarkdown(finding) {
  const lines = [];
  lines.push(`- \`${finding.path}\` — ${finding.message}`);
  lines.push(`  - **Rule:** \`${finding.ruleId}\``);

  if (finding.aip) {
    lines.push(`  - **Reference:** ${finding.aip}`);
  }
  if (finding.suggestion) {
    lines.push(`  - **Suggestion:** ${finding.suggestion}`);
  }

  // Add machine-readable fix block
  if (finding.fix) {
    lines.push('');
    lines.push('  <details>');
    lines.push('  <summary>Machine-readable fix</summary>');
    lines.push('');
    lines.push('  ```yaml');
    lines.push(formatFixAsYAML(finding.fix, '  '));
    lines.push('  ```');
    lines.push('');
    lines.push('  </details>');
  }

  return lines.join('\n');
}

/**
 * Format a fix object as YAML
 * @param {import('./types.js').Fix} fix
 * @param {string} indent
 * @returns {string}
 */
function formatFixAsYAML(fix, indent = '') {
  const lines = [];
  lines.push(`${indent}type: ${fix.type}`);
  lines.push(`${indent}jsonPath: "${fix.jsonPath}"`);

  if (fix.target !== undefined && Object.keys(fix.target).length > 0) {
    lines.push(`${indent}target:`);
    for (const [key, value] of Object.entries(fix.target)) {
      lines.push(`${indent}  ${key}: ${formatYAMLValue(value)}`);
    }
  }

  if (fix.replacement !== undefined) {
    if (
      typeof fix.replacement === 'object' &&
      fix.replacement !== null &&
      !Array.isArray(fix.replacement)
    ) {
      lines.push(`${indent}replacement:`);
      // @ts-ignore
      lines.push(formatYAMLObject(fix.replacement, indent + '  '));
    } else if (Array.isArray(fix.replacement)) {
      lines.push(`${indent}replacement:`);
      for (const item of fix.replacement) {
        if (typeof item === 'object' && item !== null) {
          lines.push(`${indent}  -`);
          lines.push(formatYAMLObject(item, indent + '    '));
        } else {
          lines.push(`${indent}  - ${formatYAMLValue(item)}`);
        }
      }
    } else {
      lines.push(`${indent}replacement: ${formatYAMLValue(fix.replacement)}`);
    }
  }

  if (fix.specChanges?.length) {
    lines.push(`${indent}specChanges:`);
    for (const change of fix.specChanges) {
      lines.push(`${indent}  - operation: ${change.operation}`);
      lines.push(`${indent}    path: "${change.path}"`);
      if (change.from !== undefined)
        lines.push(`${indent}    from: "${change.from}"`);
      if (change.to !== undefined)
        lines.push(`${indent}    to: "${change.to}"`);
      if (change.value !== undefined) {
        if (
          typeof change.value === 'object' &&
          change.value !== null &&
          !Array.isArray(change.value)
        ) {
          lines.push(`${indent}    value:`);
          // @ts-ignore
          lines.push(formatYAMLObject(change.value, indent + '      '));
        } else {
          lines.push(`${indent}    value: ${formatYAMLValue(change.value)}`);
        }
      }
    }
  }

  return lines.join('\n');
}

/**
 * Format a value for YAML output
 * @param {unknown} value
 * @returns {string}
 */
function formatYAMLValue(value) {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    // Quote strings that need it
    if (
      value.includes(':') ||
      value.includes('#') ||
      value.includes("'") ||
      value.includes('"') ||
      value.includes('\n') ||
      value.startsWith(' ') ||
      value.endsWith(' ')
    ) {
      return JSON.stringify(value);
    }
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Format an object as indented YAML lines
 * @param {Record<string, unknown>} obj
 * @param {string} indent
 * @returns {string}
 */
function formatYAMLObject(obj, indent) {
  const lines = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      lines.push(`${indent}${key}:`);
      // @ts-ignore
      lines.push(formatYAMLObject(value, indent + '  '));
    } else if (Array.isArray(value)) {
      lines.push(`${indent}${key}:`);
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          lines.push(`${indent}  -`);
          lines.push(formatYAMLObject(item, indent + '    '));
        } else {
          lines.push(`${indent}  - ${formatYAMLValue(item)}`);
        }
      }
    } else {
      lines.push(`${indent}${key}: ${formatYAMLValue(value)}`);
    }
  }
  return lines.join('\n');
}

/**
 * Format result for console output (with ANSI colors)
 * @param {ReviewResult} result
 * @param {boolean} [useColors=true]
 * @returns {string}
 */
export function formatConsole(result, useColors = true) {
  const c = useColors ? colors : noColors;
  const lines = [];

  // Header
  lines.push('');
  lines.push(`${c.bold}API Review: ${result.specPath}${c.reset}`);
  lines.push('');

  // Group findings by severity
  const errors = result.findings.filter((f) => f.severity === 'error');
  const warnings = result.findings.filter((f) => f.severity === 'warning');
  const suggestions = result.findings.filter(
    (f) => f.severity === 'suggestion'
  );

  // Errors
  if (errors.length > 0) {
    lines.push(`${c.red}${c.bold}Errors (${errors.length})${c.reset}`);
    for (const finding of errors) {
      lines.push(formatFindingConsole(finding, c));
    }
    lines.push('');
  }

  // Warnings
  if (warnings.length > 0) {
    lines.push(`${c.yellow}${c.bold}Warnings (${warnings.length})${c.reset}`);
    for (const finding of warnings) {
      lines.push(formatFindingConsole(finding, c));
    }
    lines.push('');
  }

  // Suggestions
  if (suggestions.length > 0) {
    lines.push(
      `${c.blue}${c.bold}Suggestions (${suggestions.length})${c.reset}`
    );
    for (const finding of suggestions) {
      lines.push(formatFindingConsole(finding, c));
    }
    lines.push('');
  }

  // No issues
  if (result.findings.length === 0) {
    lines.push(`${c.green}${c.bold}✓ No issues found!${c.reset}`);
    lines.push('');
  }

  // Summary line
  const summaryParts = [];
  if (result.summary.errors > 0) {
    summaryParts.push(`${c.red}${result.summary.errors} errors${c.reset}`);
  }
  if (result.summary.warnings > 0) {
    summaryParts.push(
      `${c.yellow}${result.summary.warnings} warnings${c.reset}`
    );
  }
  if (result.summary.suggestions > 0) {
    summaryParts.push(
      `${c.blue}${result.summary.suggestions} suggestions${c.reset}`
    );
  }

  if (summaryParts.length > 0) {
    lines.push(`Summary: ${summaryParts.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Format a single finding for console
 * @param {Finding} finding
 * @param {typeof colors} c
 * @returns {string}
 */
function formatFindingConsole(finding, c) {
  const lines = [];
  lines.push(`  ${c.dim}${finding.ruleId}${c.reset}`);
  lines.push(`    ${c.cyan}${finding.path}${c.reset}`);
  lines.push(`    ${finding.message}`);

  if (finding.suggestion) {
    lines.push(`    ${c.dim}→ ${finding.suggestion}${c.reset}`);
  }

  return lines.join('\n');
}

/**
 * Format result for SARIF output (Static Analysis Results Interchange Format)
 * Useful for integration with CI/CD tools and IDEs
 * @param {ReviewResult} result
 * @returns {string}
 */
export function formatSARIF(result) {
  const sarif = {
    $schema:
      'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'baume-reviewer',
            version: result.metadata.reviewerVersion,
            informationUri: 'https://google.aip.dev',
            rules: result.metadata.rulesApplied.map((ruleId) => ({
              id: ruleId,
              shortDescription: { text: ruleId },
            })),
          },
        },
        results: result.findings.map((finding) => ({
          ruleId: finding.ruleId,
          level: severityToSARIF(finding.severity),
          message: { text: finding.message },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: result.specPath },
              },
              logicalLocations: [{ name: finding.path }],
            },
          ],
          properties: {
            aip: finding.aip,
            category: finding.category,
            suggestion: finding.suggestion,
          },
        })),
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}

/**
 * Convert severity to SARIF level
 * @param {import('./types.js').Severity} severity
 * @returns {string}
 */
function severityToSARIF(severity) {
  switch (severity) {
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'suggestion':
      return 'note';
    default:
      return 'none';
  }
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// No colors (for non-TTY output)
const noColors = {
  reset: '',
  bold: '',
  dim: '',
  red: '',
  green: '',
  yellow: '',
  blue: '',
  cyan: '',
};

/**
 * Format result as a condensed summary (context-efficient)
 * @param {ReviewResult} result
 * @returns {string}
 */
export function formatSummary(result) {
  const lines = [];

  // Header
  lines.push(`## API Review: ${result.specTitle || result.specPath}`);
  lines.push('');
  lines.push(`**Spec:** \`${result.specPath}\``);
  if (result.specVersion) {
    lines.push(`**Version:** ${result.specVersion}`);
  }
  lines.push(`**Reviewed:** ${result.metadata.reviewedAt}`);
  lines.push('');

  // Summary counts with emojis
  lines.push('### Summary');
  lines.push('');
  lines.push('| Severity | Count |');
  lines.push('|----------|-------|');
  lines.push(`| 🔴 Errors | ${result.summary.errors} |`);
  lines.push(`| 🟡 Warnings | ${result.summary.warnings} |`);
  lines.push(`| 💡 Suggestions | ${result.summary.suggestions} |`);
  lines.push(`| **Total** | **${result.findings.length}** |`);
  lines.push('');

  // Group findings by rule and count
  /** @type {Record<string, {count: number, severity: string, aip: string|undefined, category: string, samples: Array<{path: string, message: string}>}>} */
  const byRule = {};
  for (const f of result.findings) {
    if (!byRule[f.ruleId]) {
      byRule[f.ruleId] = {
        count: 0,
        severity: f.severity,
        aip: f.aip,
        category: f.category,
        samples: [],
      };
    }
    byRule[f.ruleId].count++;
    // Keep sample paths for error grouping
    if (byRule[f.ruleId].samples.length < 10) {
      byRule[f.ruleId].samples.push({ path: f.path, message: f.message });
    }
  }

  // Sort by count descending
  const sortedRules = Object.entries(byRule).sort(
    (a, b) => b[1].count - a[1].count
  );

  // Top rules table
  lines.push('### Findings by Rule (sorted by count)');
  lines.push('');
  lines.push('| Rule | Count | Severity | AIP |');
  lines.push('|------|-------|----------|-----|');
  for (const [ruleId, info] of sortedRules) {
    lines.push(
      `| \`${ruleId}\` | ${info.count} | ${info.severity} | ${info.aip || '-'} |`
    );
  }
  lines.push('');

  // Critical issues - group by rule for clarity
  const errorRules = sortedRules.filter(
    ([, info]) => info.severity === 'error'
  );
  if (errorRules.length > 0) {
    lines.push('### Critical Issues (Errors)');
    lines.push('');

    for (const [, info] of errorRules) {
      // Extract common pattern from message for grouping description
      const sampleMessage = info.samples[0]?.message || '';
      const ruleDescription = sampleMessage.split('.')[0]; // First sentence

      lines.push(`**${info.count} issues:** ${ruleDescription} (${info.aip})`);
      for (const sample of info.samples.slice(0, 7)) {
        lines.push(`- \`${sample.path}\``);
      }
      if (info.count > 7) {
        lines.push(`- ... and ${info.count - 7} more`);
      }
      lines.push('');
    }
  }

  // High-impact warnings (top 3 warning rules by count)
  const warningRules = sortedRules
    .filter(([, info]) => info.severity === 'warning')
    .slice(0, 3);
  if (warningRules.length > 0) {
    lines.push('### High-Impact Warnings');
    lines.push('');
    for (const [ruleId, info] of warningRules) {
      const sampleMessage = info.samples[0]?.message || '';
      lines.push(
        `- **${info.count}x** \`${ruleId}\`: ${sampleMessage.split('.')[0]} (${info.aip})`
      );
    }
    lines.push('');
  }

  // Next step recommendation
  lines.push('### Next Step');
  lines.push('');
  if (result.summary.errors > 0) {
    lines.push(
      'Run the review command with `--fix` to apply suggested fixes automatically.'
    );
  } else if (result.summary.warnings > 0) {
    lines.push(
      'Run the review command with `--fix` to apply suggested fixes automatically.'
    );
  } else if (result.summary.suggestions > 0) {
    lines.push(
      'The API follows AIP principles well. Review suggestions for further improvements.'
    );
  } else {
    lines.push('No issues found. The API follows AIP principles.');
  }

  return lines.join('\n');
}
