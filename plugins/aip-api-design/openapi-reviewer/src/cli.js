#!/usr/bin/env node
// @ts-check
/**
 * AIP OpenAPI Reviewer CLI
 *
 * Review OpenAPI specifications against Google's API Improvement Proposals (AIP).
 *
 * @example
 * # Basic review
 * node cli.js openapi.yaml
 *
 * # Strict mode (warnings become errors)
 * node cli.js openapi.yaml --strict
 *
 * # JSON output for piping to other tools
 * node cli.js openapi.yaml --format json
 *
 * # SARIF output for CI integration
 * node cli.js openapi.yaml --format sarif > results.sarif
 *
 * @module cli
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, extname, basename, dirname, join } from 'node:path';
import { parseArgs as nodeParseArgs } from 'node:util';
import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIReviewer } from './reviewer.js';
import {
  formatConsole,
  formatMarkdown,
  formatJSON,
  formatSARIF,
  formatSummary,
} from './formatters.js';
import { OpenAPIFixer } from './fixer.js';

/**
 * @typedef {import('./types.ts').ReviewerConfig} ReviewerConfig
 * @typedef {import('./types.ts').RuleCategory} RuleCategory
 */

/** @type {import('node:util').ParseArgsConfig} */
const argsConfig = {
  options: {
    help: { type: 'boolean', short: 'h', default: false },
    strict: { type: 'boolean', short: 's', default: false },
    lenient: { type: 'boolean', short: 'l', default: false },
    format: { type: 'string', short: 'f', default: 'console' },
    category: { type: 'string', short: 'c', multiple: true, default: [] },
    skip: { type: 'string', short: 'x', multiple: true, default: [] },
    'no-color': { type: 'boolean', default: false },
    fix: { type: 'boolean', short: 'F', default: false },
    output: { type: 'string', short: 'o' },
    'dry-run': { type: 'boolean', default: false },
    'from-json': { type: 'string', short: 'j' },
  },
  allowPositionals: true,
  strict: false,
};

/**
 * @typedef {Object} ParsedValues
 * @property {boolean} [help]
 * @property {boolean} [strict]
 * @property {boolean} [lenient]
 * @property {string} [format]
 * @property {string[]} [category]
 * @property {string[]} [skip]
 * @property {boolean} [no-color]
 * @property {boolean} [fix]
 * @property {string} [output]
 * @property {boolean} [dry-run]
 * @property {string} [from-json]
 */

/**
 * Parse command line arguments using Node.js built-in parseArgs
 * @param {string[]} args
 * @returns {{specPath: string, options: CLIOptions}}
 */
function parseArgs(args) {
  const { values, positionals } = nodeParseArgs({ ...argsConfig, args });
  const v = /** @type {ParsedValues} */ (values);

  return {
    specPath: positionals[0] ?? '',
    options: {
      help: v.help ?? false,
      strict: v.strict ?? false,
      lenient: v.lenient ?? false,
      format: /** @type {CLIOptions['format']} */ (v.format ?? 'console'),
      categories: v.category ?? [],
      skipRules: v.skip ?? [],
      noColor: v['no-color'] ?? false,
      fix: v.fix ?? false,
      output: v.output,
      dryRun: v['dry-run'] ?? false,
      fromJson: v['from-json'],
    },
  };
}

/**
 * @typedef {Object} CLIOptions
 * @property {'console' | 'json' | 'markdown' | 'sarif' | 'summary'} format
 * @property {boolean} strict
 * @property {boolean} lenient
 * @property {string[]} categories
 * @property {string[]} skipRules
 * @property {boolean} noColor
 * @property {boolean} help
 * @property {boolean} fix
 * @property {string} [output]
 * @property {boolean} dryRun
 * @property {string} [fromJson]
 */

/**
 * Print help message
 */
function printHelp() {
  console.log(`
AIP OpenAPI Reviewer
Review OpenAPI specifications against Google's API Improvement Proposals.

USAGE:
  aip-review <spec-file> [options]

ARGUMENTS:
  <spec-file>         Path to OpenAPI spec (YAML or JSON)

OPTIONS:
  -h, --help          Show this help message
  -s, --strict        Treat warnings as errors
  -l, --lenient       Skip strict OpenAPI validation (use when spec has minor schema issues)
  -f, --format <fmt>  Output format: console (default), json, markdown, sarif, summary
  -c, --category <c>  Only run rules in category (can repeat)
  -x, --skip <rule>   Skip specific rule by ID (can repeat)
  --no-color          Disable colored output
  -F, --fix           Apply fixes to the spec and write output
  -o, --output <path> Output path for fixed spec (default: <spec>.fixed.<ext>)
  --dry-run           Show what fixes would be applied without writing
  -j, --from-json <f> Re-format existing JSON review output (skip re-running review)

CATEGORIES:
  naming              Resource naming conventions (AIP-122, AIP-123)
  standard-methods    HTTP method usage (AIP-131 to AIP-135)
  errors              Error response handling (AIP-193)
  pagination          List pagination (AIP-158)
  filtering           Filtering and ordering (AIP-160)
  lro                 Long-running operations (AIP-151)
  idempotency         Idempotency support (AIP-155)

EXAMPLES:
  # Basic review
  aip-review api.yaml

  # Strict mode with JSON output
  aip-review api.yaml --strict --format json

  # Only check naming and pagination
  aip-review api.yaml -c naming -c pagination

  # Skip specific rules
  aip-review api.yaml -x aip122/plural-resources

  # Apply fixes and write to a new file
  aip-review api.yaml --fix --output api-fixed.yaml

  # Preview fixes without writing
  aip-review api.yaml --fix --dry-run

EXIT CODES:
  0   No errors found (or fixes applied successfully)
  1   Errors found (or warnings in strict mode)
  2   Invalid arguments or file not found
`);
}

/**
 * Load, validate, and parse spec file using swagger-parser
 * @param {string} specPath
 * @param {boolean} [lenient=false] - Skip strict validation, only dereference refs
 * @returns {Promise<import('./types.js').OpenAPISpec>}
 */
async function loadSpec(specPath, lenient = false) {
  const resolved = resolve(specPath);

  if (!existsSync(resolved)) {
    throw new Error(`File not found: ${specPath}`);
  }

  if (lenient) {
    // Lenient mode: only dereference refs, skip strict schema validation
    // Use this when specs have minor schema issues but are still processable
    const spec = /** @type {any} */ (await SwaggerParser.dereference(resolved));
    return spec;
  }

  // Use SwaggerParser.validate() for strict validation
  // This catches spec errors early before review
  // Cast to any to work around complex union types
  const spec = /** @type {any} */ (await SwaggerParser.validate(resolved));
  return spec;
}

/**
 * Serialize spec to YAML
 * @param {object} spec
 * @returns {Promise<string>}
 */
async function serializeYAML(spec) {
  try {
    const yaml = await import('yaml');
    return yaml.stringify(spec, { lineWidth: 0 });
  } catch {
    try {
      // @ts-expect-error - js-yaml doesn't have type declarations
      const jsYaml = await import('js-yaml');
      return jsYaml.default.dump(spec, { lineWidth: -1, noRefs: true });
    } catch {
      throw new Error(
        'YAML serialization requires "yaml" or "js-yaml" package. Install with: npm install yaml'
      );
    }
  }
}

/**
 * Get the default output path for fixed spec
 * @param {string} specPath
 * @returns {string}
 */
function getDefaultOutputPath(specPath) {
  const ext = extname(specPath);
  const base = basename(specPath, ext);
  const dir = dirname(specPath);
  return join(dir, `${base}.fixed${ext}`);
}

/**
 * Main CLI function
 * @param {string[]} args
 * @returns {Promise<number>} Exit code
 */
async function main(args) {
  const { specPath, options } = parseArgs(args);

  if (options.help || (!specPath && !options.fromJson)) {
    printHelp();
    return options.help ? 0 : 2;
  }

  // Handle --from-json: re-format existing review JSON
  if (options.fromJson) {
    return handleFromJson(options);
  }

  // Load spec with automatic fallback to lenient mode
  let spec;
  let usedLenient = options.lenient;
  try {
    spec = await loadSpec(specPath, options.lenient);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // If not in lenient mode, try automatic fallback
    if (!options.lenient) {
      const useColor = !options.noColor && process.stdout.isTTY;
      const yellow = useColor ? '\x1b[33m' : '';
      const reset = useColor ? '\x1b[0m' : '';

      console.error(
        `${yellow}Warning: Strict validation failed: ${message}${reset}`
      );
      console.error(
        `${yellow}Falling back to lenient mode (skipping schema validation)...${reset}\n`
      );

      try {
        spec = await loadSpec(specPath, true);
        usedLenient = true;
      } catch (lenientError) {
        const lenientMessage =
          lenientError instanceof Error
            ? lenientError.message
            : String(lenientError);
        console.error(
          `Error loading spec (even in lenient mode): ${lenientMessage}`
        );
        return 2;
      }
    } else {
      console.error(`Error loading spec: ${message}`);
      return 2;
    }
  }

  // Build reviewer config
  /** @type {ReviewerConfig} */
  const config = {
    strict: options.strict,
    categories:
      options.categories.length > 0
        ? /** @type {RuleCategory[]} */ (options.categories)
        : undefined,
    skipRules: options.skipRules.length > 0 ? options.skipRules : undefined,
  };

  // Run review
  const reviewer = new OpenAPIReviewer(config);
  const result = reviewer.review(spec, specPath);

  // Add lenient mode flag to metadata if used
  if (usedLenient) {
    result.metadata.lenientMode = true;
    result.metadata.lenientReason = options.lenient
      ? 'explicitly requested'
      : 'automatic fallback due to validation failure';
  }

  // Handle fix mode
  if (options.fix) {
    return await handleFixMode(spec, specPath, result, options);
  }

  // Format and output
  let output;
  switch (options.format) {
    case 'json':
      output = formatJSON(result);
      break;
    case 'markdown':
      output = formatMarkdown(result);
      break;
    case 'sarif':
      output = formatSARIF(result);
      break;
    case 'summary':
      output = formatSummary(result);
      break;
    case 'console':
    default:
      output = formatConsole(result, !options.noColor && process.stdout.isTTY);
      break;
  }

  console.log(output);

  // Show lenient mode note for console output
  if (usedLenient && options.format === 'console') {
    const useColor = !options.noColor && process.stdout.isTTY;
    const dim = useColor ? '\x1b[2m' : '';
    const reset = useColor ? '\x1b[0m' : '';
    console.log(
      `\n${dim}Note: Reviewed in lenient mode (strict OpenAPI validation was skipped).${reset}`
    );
  }

  // Exit code based on findings
  if (result.summary.errors > 0) {
    return 1;
  }

  return 0;
}

/**
 * Handle --from-json: re-format existing review JSON output
 * @param {CLIOptions} options
 * @returns {number}
 */
function handleFromJson(options) {
  const jsonPath = /** @type {string} */ (options.fromJson);

  // Load JSON review result
  /** @type {import('./types.ts').ReviewResult} */
  let result;
  try {
    const content = readFileSync(resolve(jsonPath), 'utf-8');
    result = JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error loading JSON: ${message}`);
    return 2;
  }

  // Format and output
  let output;
  switch (options.format) {
    case 'json':
      output = formatJSON(result);
      break;
    case 'markdown':
      output = formatMarkdown(result);
      break;
    case 'sarif':
      output = formatSARIF(result);
      break;
    case 'summary':
      output = formatSummary(result);
      break;
    case 'console':
    default:
      output = formatConsole(result, !options.noColor && process.stdout.isTTY);
      break;
  }

  console.log(output);

  // Exit code based on findings
  if (result.summary.errors > 0) {
    return 1;
  }

  return 0;
}

/**
 * Handle fix mode - apply fixes and write output
 * @param {import('./types.ts').OpenAPISpec} spec
 * @param {string} specPath
 * @param {import('./types.ts').ReviewResult} result
 * @param {CLIOptions} options
 * @returns {Promise<number>}
 */
async function handleFixMode(spec, specPath, result, options) {
  const useColor = !options.noColor && process.stdout.isTTY;
  const green = useColor ? '\x1b[32m' : '';
  const yellow = useColor ? '\x1b[33m' : '';
  const red = useColor ? '\x1b[31m' : '';
  const reset = useColor ? '\x1b[0m' : '';
  const dim = useColor ? '\x1b[2m' : '';

  // Count fixable findings
  const fixableFindings = result.findings.filter((f) => f.fix);
  const unfixableFindings = result.findings.filter((f) => !f.fix);

  if (fixableFindings.length === 0) {
    console.log(`${yellow}No fixes available.${reset}`);
    if (unfixableFindings.length > 0) {
      console.log(
        `${dim}${unfixableFindings.length} finding(s) require manual intervention.${reset}`
      );
    }
    return result.summary.errors > 0 ? 1 : 0;
  }

  console.log(
    `\n${dim}Found ${fixableFindings.length} fixable issue(s)${reset}\n`
  );

  // Apply fixes
  const fixer = new OpenAPIFixer(spec, { dryRun: options.dryRun });
  const fixResults = fixer.applyFixes(fixableFindings);
  const summary = fixer.getSummary();

  // Report results
  for (const fixResult of fixResults) {
    const status = fixResult.applied ? `${green}✓${reset}` : `${red}✗${reset}`;
    console.log(`  ${status} ${fixResult.ruleId}`);

    // Show errors for failed fixes
    if (!fixResult.applied) {
      for (const change of fixResult.changes) {
        if (!change.applied && change.error) {
          console.log(`    ${red}${change.error}${reset}`);
        }
      }
    }
  }

  console.log('');

  // Summary line
  if (options.dryRun) {
    console.log(
      `${yellow}Dry run:${reset} Would apply ${green}${summary.applied}${reset} fix(es) (${summary.changes} change(s))`
    );
    if (summary.failed > 0) {
      console.log(`  ${red}${summary.failed} fix(es) would fail${reset}`);
    }
  } else {
    console.log(
      `Applied ${green}${summary.applied}${reset} fix(es) (${summary.changes} change(s))`
    );
    if (summary.failed > 0) {
      console.log(`  ${red}${summary.failed} fix(es) failed${reset}`);
    }
  }

  // Write output
  if (!options.dryRun && summary.applied > 0) {
    const outputPath = options.output || getDefaultOutputPath(specPath);
    const ext = extname(outputPath).toLowerCase();

    try {
      let content;
      if (ext === '.json') {
        content = JSON.stringify(fixer.getSpec(), null, 2);
      } else {
        content = await serializeYAML(fixer.getSpec());
      }

      writeFileSync(outputPath, content, 'utf-8');
      console.log(`\n${green}Fixed spec written to:${reset} ${outputPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${red}Error writing output:${reset} ${message}`);
      return 2;
    }
  }

  // Report unfixable issues
  if (unfixableFindings.length > 0) {
    console.log(
      `\n${dim}${unfixableFindings.length} issue(s) require manual fixes:${reset}`
    );
    for (const finding of unfixableFindings.slice(0, 5)) {
      console.log(`  ${dim}- ${finding.path}: ${finding.message}${reset}`);
    }
    if (unfixableFindings.length > 5) {
      console.log(
        `  ${dim}... and ${unfixableFindings.length - 5} more${reset}`
      );
    }
  }

  // Return success if no errors remain
  return summary.failed > 0 ? 1 : 0;
}

// Run CLI
const exitCode = await main(process.argv.slice(2));

// Use exitCode instead of exit() to allow stdout to flush properly
process.exitCode = exitCode;
