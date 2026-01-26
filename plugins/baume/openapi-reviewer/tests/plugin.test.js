/**
 * Plugin Structure Validation Tests
 *
 * Validates that commands and agents are properly structured
 * with required frontmatter and documentation.
 *
 * Run with: node --test tests/plugin.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = join(__dirname, '..', '..');

/**
 * Parse YAML frontmatter from markdown content
 * @param {string} content - Markdown file content
 * @returns {{ frontmatter: Record<string, string> | null, body: string }}
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: null, body: content };
  }

  const frontmatterText = match[1];
  const body = match[2];

  // Simple YAML parsing for key: value pairs
  /** @type {Record<string, string>} */
  const frontmatter = {};
  for (const line of frontmatterText.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body };
}

/**
 * Get all markdown files in a directory
 * @param {string} dir - Directory path
 * @returns {Promise<string[]>}
 */
async function getMarkdownFiles(dir) {
  try {
    const files = await readdir(dir);
    return files.filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }
}

describe('Plugin Commands', () => {
  it('commands directory exists', async () => {
    const commandsDir = join(PLUGIN_ROOT, 'commands');
    const files = await getMarkdownFiles(commandsDir);
    assert.ok(files.length > 0, 'Expected at least one command');
  });

  it('all commands have valid frontmatter', async () => {
    const commandsDir = join(PLUGIN_ROOT, 'commands');
    const files = await getMarkdownFiles(commandsDir);

    for (const file of files) {
      const content = await readFile(join(commandsDir, file), 'utf-8');
      const { frontmatter } = parseFrontmatter(content);

      assert.ok(
        frontmatter !== null,
        `Command ${file} missing YAML frontmatter (must start with ---)`
      );

      assert.ok(
        frontmatter.description,
        `Command ${file} missing 'description' in frontmatter`
      );

      assert.ok(
        frontmatter.description.length >= 10,
        `Command ${file} description too short (min 10 chars)`
      );
    }
  });

  it('all commands have usage documentation', async () => {
    const commandsDir = join(PLUGIN_ROOT, 'commands');
    const files = await getMarkdownFiles(commandsDir);

    for (const file of files) {
      const content = await readFile(join(commandsDir, file), 'utf-8');
      const { body } = parseFrontmatter(content);

      // Check for common documentation sections
      const hasUsage =
        body.includes('## Usage') || body.includes('## Instructions');
      assert.ok(
        hasUsage,
        `Command ${file} missing Usage or Instructions section`
      );
    }
  });

  it('baume-review command references the CLI script', async () => {
    const content = await readFile(
      join(PLUGIN_ROOT, 'commands', 'baume-review.md'),
      'utf-8'
    );

    assert.ok(
      content.includes('cli.js'),
      'baume-review should reference the CLI script'
    );
    assert.ok(
      content.includes('CLAUDE_PLUGIN_ROOT'),
      'baume-review should reference CLAUDE_PLUGIN_ROOT'
    );
  });
});

describe('Plugin Agents', () => {
  it('agents directory exists with at least one agent', async () => {
    const agentsDir = join(PLUGIN_ROOT, 'agents');
    const files = await getMarkdownFiles(agentsDir);
    assert.ok(files.length > 0, 'Expected at least one agent');
  });

  it('all agents have valid frontmatter', async () => {
    const agentsDir = join(PLUGIN_ROOT, 'agents');
    const files = await getMarkdownFiles(agentsDir);

    for (const file of files) {
      const content = await readFile(join(agentsDir, file), 'utf-8');
      const { frontmatter } = parseFrontmatter(content);

      assert.ok(
        frontmatter !== null,
        `Agent ${file} missing YAML frontmatter (must start with ---)`
      );

      assert.ok(
        frontmatter.description,
        `Agent ${file} missing 'description' in frontmatter`
      );
    }
  });

  it('baume-lookup agent has required sections', async () => {
    const content = await readFile(
      join(PLUGIN_ROOT, 'agents', 'baume-lookup.md'),
      'utf-8'
    );

    assert.ok(
      content.includes('## When to Use'),
      'baume-lookup should have "When to Use" section'
    );
    assert.ok(
      content.includes('## AIP Sources'),
      'baume-lookup should have "AIP Sources" section'
    );
    assert.ok(
      content.includes('google.aip.dev'),
      'baume-lookup should reference google.aip.dev'
    );
  });
});

describe('Plugin README', () => {
  it('README.md exists', async () => {
    const content = await readFile(join(PLUGIN_ROOT, 'README.md'), 'utf-8');
    assert.ok(content.length > 100, 'README should have meaningful content');
  });

  it('README documents available commands', async () => {
    const readme = await readFile(join(PLUGIN_ROOT, 'README.md'), 'utf-8');
    const commandsDir = join(PLUGIN_ROOT, 'commands');
    const commands = await getMarkdownFiles(commandsDir);

    for (const cmd of commands) {
      const cmdName = cmd.replace('.md', '');
      assert.ok(
        readme.includes(cmdName),
        `README should mention command: ${cmdName}`
      );
    }
  });
});

describe('Plugin Scripts', () => {
  it('CLI script exists and is executable', async () => {
    const cliPath = join(PLUGIN_ROOT, 'openapi-reviewer', 'src', 'cli.js');
    const content = await readFile(cliPath, 'utf-8');

    assert.ok(content.includes('#!/'), 'CLI should have shebang');
    assert.ok(
      content.includes('parseArgs') || content.includes('process.argv'),
      'CLI should parse arguments'
    );
  });

  it('scripts package.json has correct bin entry', async () => {
    const pkgPath = join(PLUGIN_ROOT, 'openapi-reviewer', 'package.json');
    const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));

    assert.ok(pkg.bin, 'package.json should have bin entry');
    assert.ok(pkg.bin['baume-review'], 'Should have baume-review bin');
  });

  it('all exported rules have required properties', async () => {
    // Dynamic import to test the actual module
    const { defaultRules } = await import('../src/rules/index.js');

    for (const rule of defaultRules) {
      assert.ok(rule.id, `Rule missing id`);
      assert.ok(rule.name, `Rule ${rule.id} missing name`);
      assert.ok(rule.severity, `Rule ${rule.id} missing severity`);
      assert.ok(rule.description, `Rule ${rule.id} missing description`);
      assert.ok(
        ['error', 'warning', 'suggestion'].includes(rule.severity),
        `Rule ${rule.id} has invalid severity: ${rule.severity}`
      );
    }
  });
});
