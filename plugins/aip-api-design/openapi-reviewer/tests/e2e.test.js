/**
 * CLI End-to-End Tests
 *
 * Tests the CLI interface for various output formats, filtering options,
 * and behavior modes.
 *
 * Run with: npm run test:e2e
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(__dirname, '..', 'src', 'cli.js');
const FIXTURE_PATH = join(__dirname, 'fixtures', 'acme-commerce.yaml');

/**
 * Run CLI and capture output
 * @param {string[]} args
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
function runCLI(args) {
  return new Promise((resolve) => {
    execFile(
      'node',
      [CLI_PATH, ...args],
      { maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        resolve({
          stdout,
          stderr,
          exitCode: error?.code ?? 0,
        });
      }
    );
  });
}

describe('CLI Output Formats', () => {
  it('JSON format returns valid JSON with findings', async () => {
    const { stdout, exitCode } = await runCLI([
      FIXTURE_PATH,
      '--format',
      'json',
    ]);

    // CLI exits non-zero when findings have errors
    assert.ok(exitCode === 0 || exitCode === 1, 'Should exit with 0 or 1');

    const result = JSON.parse(stdout);
    assert.ok(result.findings, 'Should have findings array');
    assert.ok(Array.isArray(result.findings), 'findings should be array');
    assert.ok(result.findings.length > 0, 'Should have some findings');
    assert.ok(result.summary, 'Should have summary');
  });

  it('Markdown format includes expected sections', async () => {
    const { stdout } = await runCLI([FIXTURE_PATH, '--format', 'markdown']);

    assert.ok(
      stdout.includes('## API Review:'),
      'Should have API Review header'
    );
    assert.ok(stdout.includes('**Summary:**'), 'Should have Summary line');
    assert.ok(
      stdout.includes('### 🔴 Errors') || stdout.includes('### 🟡 Warnings'),
      'Should have findings sections'
    );
  });

  it('Console format includes findings text', async () => {
    const { stdout } = await runCLI([
      FIXTURE_PATH,
      '--format',
      'console',
      '--no-color',
    ]);

    assert.ok(stdout.includes('Summary:'), 'Should have Summary line');
    assert.ok(
      stdout.includes('Errors') || stdout.includes('Warnings'),
      'Should mention findings'
    );
  });

  it('SARIF format returns valid SARIF with results', async () => {
    const { stdout } = await runCLI([FIXTURE_PATH, '--format', 'sarif']);

    const sarif = JSON.parse(stdout);
    assert.ok(sarif.$schema, 'Should have $schema');
    assert.ok(sarif.$schema.includes('sarif-schema'), 'Schema should be SARIF');
    assert.ok(sarif.runs, 'Should have runs array');
    assert.ok(sarif.runs[0].results, 'Should have results in first run');
    assert.ok(sarif.runs[0].results.length > 0, 'Should have some results');
  });

  it('Summary format returns concise overview', async () => {
    const { stdout } = await runCLI([FIXTURE_PATH, '--format', 'summary']);

    // Summary format should be more compact than full JSON output
    assert.ok(stdout.length < 10000, 'Summary should be relatively concise');
    assert.ok(stdout.includes('Errors'), 'Should mention Errors');
    assert.ok(stdout.includes('Warnings'), 'Should mention Warnings');
  });
});

describe('CLI Category Filtering', () => {
  it('filters findings to specified category only', async () => {
    const { stdout } = await runCLI([
      FIXTURE_PATH,
      '--format',
      'json',
      '-c',
      'naming',
    ]);

    const result = JSON.parse(stdout);
    const categories = [...new Set(result.findings.map((f) => f.category))];

    assert.ok(categories.length > 0, 'Should have findings');
    assert.ok(
      categories.every((c) => c === 'naming'),
      `Expected only naming category, got: ${categories.join(', ')}`
    );
  });

  it('can combine multiple categories', async () => {
    const { stdout } = await runCLI([
      FIXTURE_PATH,
      '--format',
      'json',
      '-c',
      'naming',
      '-c',
      'pagination',
    ]);

    const result = JSON.parse(stdout);
    const categories = [...new Set(result.findings.map((f) => f.category))];

    assert.ok(
      categories.every((c) => c === 'naming' || c === 'pagination'),
      `Expected only naming/pagination categories, got: ${categories.join(', ')}`
    );
  });
});

describe('CLI Rule Skipping', () => {
  it('reduces findings when skipping a rule', async () => {
    // Get count without skipping
    const { stdout: allOutput } = await runCLI([
      FIXTURE_PATH,
      '--format',
      'json',
    ]);
    const allResult = JSON.parse(allOutput);
    const countAll = allResult.findings.length;

    // Get count with skipping a rule
    const { stdout: skipOutput } = await runCLI([
      FIXTURE_PATH,
      '--format',
      'json',
      '-x',
      'aip122/plural-resources',
    ]);
    const skipResult = JSON.parse(skipOutput);
    const countSkip = skipResult.findings.length;

    assert.ok(
      countSkip < countAll,
      `Expected fewer findings when skipping (all=${countAll}, skip=${countSkip})`
    );
  });

  it('can skip multiple rules', async () => {
    const { stdout: allOutput } = await runCLI([
      FIXTURE_PATH,
      '--format',
      'json',
    ]);
    const allResult = JSON.parse(allOutput);

    const { stdout: skipOutput } = await runCLI([
      FIXTURE_PATH,
      '--format',
      'json',
      '-x',
      'aip122/plural-resources',
      '-x',
      'aip158/page-size-max',
    ]);
    const skipResult = JSON.parse(skipOutput);

    // Skipped rules should not appear in findings
    const skippedRules = skipResult.findings.filter(
      (f) =>
        f.ruleId === 'aip122/plural-resources' ||
        f.ruleId === 'aip158/page-size-max'
    );
    assert.strictEqual(
      skippedRules.length,
      0,
      'Skipped rules should not appear'
    );
    assert.ok(
      skipResult.findings.length < allResult.findings.length,
      'Should have fewer findings'
    );
  });
});

describe('CLI Strict Mode', () => {
  it('promotes warnings to errors in strict mode', async () => {
    // Normal mode
    const { stdout: normalOutput } = await runCLI([
      FIXTURE_PATH,
      '--format',
      'json',
    ]);
    const normalResult = JSON.parse(normalOutput);
    const normalWarnings = normalResult.findings.filter(
      (f) => f.severity === 'warning'
    ).length;

    // Strict mode
    const { stdout: strictOutput } = await runCLI([
      FIXTURE_PATH,
      '--format',
      'json',
      '--strict',
    ]);
    const strictResult = JSON.parse(strictOutput);
    const strictErrors = strictResult.findings.filter(
      (f) => f.severity === 'error'
    ).length;

    // In strict mode, warnings become errors, so error count should increase
    assert.ok(
      strictErrors >= normalWarnings,
      `Expected strict mode to promote warnings to errors (normal warnings=${normalWarnings}, strict errors=${strictErrors})`
    );
  });
});

describe('CLI Fix Mode', () => {
  it('dry-run shows fixes without writing', async () => {
    const { stdout } = await runCLI([
      FIXTURE_PATH,
      '--fix',
      '--dry-run',
      '--no-color',
    ]);

    // Dry run should mention it's a dry run
    assert.ok(
      stdout.includes('Dry run') ||
        stdout.includes('dry run') ||
        stdout.includes('Would apply'),
      'Should indicate dry run mode'
    );
    // Should not actually write a file
    assert.ok(
      !stdout.includes('written to'),
      'Should not write file in dry run'
    );
  });
});

describe('CLI Error Handling', () => {
  it('exits with code 2 for missing file', async () => {
    const { exitCode, stderr } = await runCLI(['nonexistent-file.yaml']);

    assert.strictEqual(exitCode, 2, 'Should exit with code 2 for missing file');
    assert.ok(
      stderr.includes('Error') || stderr.includes('not found'),
      'Should show error message'
    );
  });

  it('shows help with --help flag', async () => {
    const { stdout, exitCode } = await runCLI(['--help']);

    assert.strictEqual(exitCode, 0, 'Help should exit with 0');
    assert.ok(stdout.includes('USAGE'), 'Should show usage');
    assert.ok(stdout.includes('OPTIONS'), 'Should show options');
  });

  it('shows help and exits 2 with no arguments', async () => {
    const { stdout, exitCode } = await runCLI([]);

    assert.strictEqual(exitCode, 2, 'No args should exit with 2');
    assert.ok(stdout.includes('USAGE'), 'Should show usage');
  });
});

describe('CLI Invalid Spec Handling', () => {
  const INVALID_SPEC_PATH = join(
    __dirname,
    '..',
    'src',
    '__fixtures__',
    'invalid-spec.yaml'
  );

  it('falls back to lenient mode for invalid OpenAPI spec', async () => {
    const { exitCode, stderr, stdout } = await runCLI([
      INVALID_SPEC_PATH,
      '--format',
      'json',
    ]);

    // With lenient fallback, the CLI should succeed (exit 0) and show a warning
    assert.strictEqual(
      exitCode,
      0,
      'Should exit with code 0 after lenient fallback'
    );
    assert.ok(
      stderr.toLowerCase().includes('warning') ||
        stderr.toLowerCase().includes('lenient') ||
        stderr.toLowerCase().includes('fallback'),
      'Should show warning about lenient fallback'
    );

    // The JSON output should include lenientMode metadata
    const result = JSON.parse(stdout);
    assert.ok(
      result.metadata?.lenientMode === true,
      'Should indicate lenient mode in metadata'
    );
  });

  it('shows validation warning before falling back to lenient mode', async () => {
    const { stderr } = await runCLI([INVALID_SPEC_PATH]);

    // Should show warning about validation failure before fallback
    assert.ok(
      stderr.toLowerCase().includes('warning') ||
        stderr.toLowerCase().includes('validation') ||
        stderr.toLowerCase().includes('lenient'),
      'Should explain validation fallback'
    );
  });

  it('handles malformed JSON spec that cannot be parsed', async () => {
    const MALFORMED_JSON = join(__dirname, 'fixtures', 'malformed.json');
    const { exitCode, stderr } = await runCLI([MALFORMED_JSON]);

    // Truly malformed JSON cannot be parsed even in lenient mode
    assert.strictEqual(
      exitCode,
      2,
      'Should exit with code 2 for unparseable JSON'
    );
    assert.ok(
      stderr.includes('Error') || stderr.includes('error'),
      'Should show error message'
    );
  });
});
