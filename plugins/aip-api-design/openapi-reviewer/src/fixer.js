// @ts-check
/**
 * OpenAPI Spec Auto-Fixer
 *
 * Applies structured fix objects from findings to OpenAPI specifications.
 * Supports JSONPath-like navigation and atomic spec changes.
 *
 * @module fixer
 */

/**
 * @typedef {import('./types.ts').Fix} Fix
 * @typedef {import('./types.ts').SpecChange} SpecChange
 * @typedef {import('./types.ts').OpenAPISpec} OpenAPISpec
 * @typedef {import('./types.ts').Finding} Finding
 */

/**
 * @typedef {Object} ChangeLogEntry
 * @property {SpecChange} change - The change that was applied/attempted
 * @property {boolean} applied - Whether the change was successfully applied
 * @property {string} [error] - Error message if the change failed
 */

/**
 * @typedef {Object} FixResult
 * @property {string} ruleId - The rule ID that generated this fix
 * @property {boolean} applied - Whether all changes were applied
 * @property {ChangeLogEntry[]} changes - Individual change results
 */

/**
 * OpenAPI specification fixer
 *
 * @example
 * ```js
 * const fixer = new OpenAPIFixer(spec);
 *
 * for (const finding of findings) {
 *   if (finding.fix) {
 *     fixer.applyFix(finding);
 *   }
 * }
 *
 * const fixedSpec = fixer.getSpec();
 * const log = fixer.getLog();
 * ```
 */
export class OpenAPIFixer {
  /** @type {OpenAPISpec} */
  #spec;

  /** @type {FixResult[]} */
  #log = [];

  /** @type {boolean} */
  #dryRun;

  /**
   * @param {OpenAPISpec} spec - The OpenAPI spec to modify
   * @param {Object} [options] - Fixer options
   * @param {boolean} [options.dryRun=false] - If true, don't modify the spec, just validate changes
   */
  constructor(spec, options = {}) {
    this.#spec = options.dryRun ? spec : structuredClone(spec);
    this.#dryRun = options.dryRun ?? false;
  }

  /**
   * Apply a fix from a finding
   * @param {Finding} finding - Finding with a fix to apply
   * @returns {FixResult} Result of applying the fix
   */
  applyFix(finding) {
    if (!finding.fix) {
      return {
        ruleId: finding.ruleId,
        applied: false,
        changes: [],
      };
    }

    const fix = finding.fix;
    /** @type {ChangeLogEntry[]} */
    const changes = [];
    let allApplied = true;

    for (const change of fix.specChanges) {
      try {
        if (!this.#dryRun) {
          this.#applyChange(change);
        }
        changes.push({ change, applied: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        changes.push({ change, applied: false, error: message });
        allApplied = false;
      }
    }

    const result = {
      ruleId: finding.ruleId,
      applied: allApplied,
      changes,
    };

    this.#log.push(result);
    return result;
  }

  /**
   * Apply multiple fixes from findings
   * @param {Finding[]} findings - Findings with fixes to apply
   * @returns {FixResult[]} Results of applying all fixes
   */
  applyFixes(findings) {
    /** @type {FixResult[]} */
    const results = [];

    for (const finding of findings) {
      if (finding.fix) {
        results.push(this.applyFix(finding));
      }
    }

    return results;
  }

  /**
   * Apply a single spec change
   * @param {SpecChange} change

   */
  #applyChange(change) {
    switch (change.operation) {
      case 'rename-key':
        if (!change.from || !change.to) {
          throw new Error('rename-key requires from and to');
        }
        this.#renameKey(change.path, change.from, change.to);
        break;

      case 'set':
        this.#setValue(change.path, change.value);
        break;

      case 'add':
        this.#addValue(change.path, change.value);
        break;

      case 'remove':
        this.#removeValue(change.path);
        break;

      case 'merge':
        this.#mergeValue(change.path, change.value);
        break;

      default:
        throw new Error(`Unknown operation: ${change.operation}`);
    }
  }

  /**
   * Rename a key in an object
   * @param {string} jsonPath - Path to the parent object
   * @param {string} from - Old key name
   * @param {string} to - New key name

   */
  #renameKey(jsonPath, from, to) {
    const resolved = this.#resolve(jsonPath);

    if (resolved === undefined || resolved === null) {
      throw new Error(`Cannot resolve parent at ${jsonPath}`);
    }

    if (typeof resolved !== 'object') {
      throw new Error(`Expected object at ${jsonPath}, got ${typeof resolved}`);
    }

    const parent = /** @type {Record<string, unknown>} */ (resolved);

    if (!(from in parent)) {
      throw new Error(`Key '${from}' not found at ${jsonPath}`);
    }

    if (to in parent) {
      throw new Error(`Key '${to}' already exists at ${jsonPath}`);
    }

    // Preserve key order by rebuilding the object
    const entries = Object.entries(parent);
    /** @type {Array<[string, unknown]>} */
    const newEntries = entries.map(([key, value]) =>
      key === from ? [to, value] : [key, value]
    );

    // Clear and rebuild
    for (const key of Object.keys(parent)) {
      delete parent[key];
    }
    for (const [key, value] of newEntries) {
      parent[key] = value;
    }
  }

  /**
   * Set a value at a path (creates intermediate objects if needed)
   * @param {string} jsonPath
   * @param {unknown} value

   */
  #setValue(jsonPath, value) {
    const { parent, key } = this.#resolveParent(jsonPath);
    parent[key] = value;
  }

  /**
   * Add a value to an array (creates array if needed)
   * @param {string} jsonPath
   * @param {unknown} value

   */
  #addValue(jsonPath, value) {
    const target = this.#resolve(jsonPath);

    if (target === undefined) {
      // Create array at path
      const { parent, key } = this.#resolveParent(jsonPath);
      parent[key] = [value];
    } else if (Array.isArray(target)) {
      target.push(value);
    } else {
      throw new Error(`Expected array at ${jsonPath}, got ${typeof target}`);
    }
  }

  /**
   * Remove a value at a path
   * @param {string} jsonPath

   */
  #removeValue(jsonPath) {
    const { parent, key } = this.#resolveParent(jsonPath);

    if (!(key in parent)) {
      // Already removed or never existed - that's fine
      return;
    }

    delete parent[key];
  }

  /**
   * Merge values into an array or object
   * @param {string} jsonPath
   * @param {unknown} value

   */
  #mergeValue(jsonPath, value) {
    const target = this.#resolve(jsonPath);

    if (target === undefined) {
      // Create at path with the value
      const { parent, key } = this.#resolveParent(jsonPath);
      if (Array.isArray(value)) {
        parent[key] = [...value];
      } else if (typeof value === 'object' && value !== null) {
        parent[key] = { ...value };
      } else {
        throw new Error(`Cannot initialize merge with ${typeof value}`);
      }
      return;
    }

    if (Array.isArray(target) && Array.isArray(value)) {
      target.push(...value);
    } else if (
      typeof target === 'object' &&
      target !== null &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(target) &&
      !Array.isArray(value)
    ) {
      Object.assign(target, value);
    } else {
      throw new Error(
        `Cannot merge ${typeof value} into ${Array.isArray(target) ? 'array' : typeof target} at ${jsonPath}`
      );
    }
  }

  /**
   * Resolve a JSONPath to get the value
   *
   * Supports:
   * - Dot notation: $.paths.get
   * - Bracket notation: $.paths['/users'].get
   * - Mixed: $.paths['/users'].get.parameters
   *
   * @param {string} jsonPath
   * @returns {unknown}

   */
  #resolve(jsonPath) {
    const path = jsonPath.replace(/^\$\.?/, '');

    if (!path) {
      return this.#spec;
    }

    let current = /** @type {unknown} */ (this.#spec);

    for (const segment of this.#parseSegments(path)) {
      if (current === undefined || current === null) {
        return undefined;
      }
      if (typeof current !== 'object') {
        return undefined;
      }
      current = /** @type {Record<string, unknown>} */ (current)[segment];
    }

    return current;
  }

  /**
   * Resolve parent object and get the final key
   * Creates intermediate objects as needed
   *
   * @param {string} jsonPath
   * @returns {{parent: Record<string, unknown>, key: string}}

   */
  #resolveParent(jsonPath) {
    const segments = this.#parseSegments(jsonPath.replace(/^\$\.?/, ''));

    if (segments.length === 0) {
      throw new Error('Cannot resolve parent of root');
    }

    const key = /** @type {string} */ (segments.pop());
    let current = /** @type {Record<string, unknown>} */ (this.#spec);

    for (const segment of segments) {
      if (!(segment in current)) {
        current[segment] = {};
      }
      const next = current[segment];
      if (typeof next !== 'object' || next === null) {
        throw new Error(`Cannot traverse through non-object at ${segment}`);
      }
      current = /** @type {Record<string, unknown>} */ (next);
    }

    return { parent: current, key };
  }

  /**
   * Parse JSONPath segments
   *
   * Handles:
   * - paths['/users'].get -> ['paths', '/users', 'get']
   * - paths.get.parameters[0] -> ['paths', 'get', 'parameters', '0']
   *
   * @param {string} path
   * @returns {string[]}

   */
  #parseSegments(path) {
    /** @type {string[]} */
    const segments = [];
    let current = '';
    let inBracket = false;
    let quote = '';

    for (let i = 0; i < path.length; i++) {
      const char = path[i];

      if (inBracket) {
        if (quote) {
          // Inside quoted string
          if (char === quote) {
            quote = '';
          } else {
            current += char;
          }
        } else if (char === '"' || char === "'") {
          quote = char;
        } else if (char === ']') {
          if (current) segments.push(current);
          current = '';
          inBracket = false;
        } else {
          current += char;
        }
      } else {
        if (char === '[') {
          if (current) segments.push(current);
          current = '';
          inBracket = true;
        } else if (char === '.') {
          if (current) segments.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }

    if (current) segments.push(current);

    return segments;
  }

  /**
   * Get the modified spec
   * @returns {OpenAPISpec}
   */
  getSpec() {
    return this.#spec;
  }

  /**
   * Get the complete change log
   * @returns {FixResult[]}
   */
  getLog() {
    return this.#log;
  }

  /**
   * Get summary statistics
   * @returns {{total: number, applied: number, failed: number, changes: number}}
   */
  getSummary() {
    const applied = this.#log.filter((r) => r.applied).length;
    const failed = this.#log.filter((r) => !r.applied).length;
    const changes = this.#log.reduce(
      (sum, r) => sum + r.changes.filter((c) => c.applied).length,
      0
    );

    return {
      total: this.#log.length,
      applied,
      failed,
      changes,
    };
  }

  /**
   * Check if the fixer has any pending errors
   * @returns {boolean}
   */
  hasErrors() {
    return this.#log.some((r) => !r.applied);
  }

  /**
   * Get all errors from the log
   * @returns {Array<{ruleId: string, error: string}>}
   */
  getErrors() {
    /** @type {Array<{ruleId: string, error: string}>} */
    const errors = [];

    for (const result of this.#log) {
      for (const change of result.changes) {
        if (!change.applied && change.error) {
          errors.push({
            ruleId: result.ruleId,
            error: change.error,
          });
        }
      }
    }

    return errors;
  }
}

/**
 * Create a fixer and apply all fixes from findings
 *
 * @param {OpenAPISpec} spec - The spec to fix
 * @param {Finding[]} findings - Findings with fixes
 * @param {Object} [options] - Options
 * @param {boolean} [options.dryRun=false] - Just validate, don't modify
 * @returns {{spec: OpenAPISpec, results: FixResult[], summary: {total: number, applied: number, failed: number, changes: number}}}
 */
export function applyAllFixes(spec, findings, options = {}) {
  const fixer = new OpenAPIFixer(spec, options);
  const results = fixer.applyFixes(findings);

  return {
    spec: fixer.getSpec(),
    results,
    summary: fixer.getSummary(),
  };
}
