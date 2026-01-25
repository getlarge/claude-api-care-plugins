// @ts-check
/**
 * NLP utilities for API naming validation
 * Thin wrapper around compromise with API-specific extensions
 *
 * Performance optimizations:
 * - LRU cache for all NLP results (most API paths reuse words)
 * - Fast-path checks before invoking NLP
 * - Common irregular plurals handled without NLP
 *
 * @module rules/helpers/nlp
 */

import nlp from 'compromise';

/**
 * API-specific uncountable nouns that compromise doesn't know about
 * @type {Set<string>}
 */
const API_UNCOUNTABLES = new Set([
  'data',
  'metadata',
  'auth',
  'config',
  'settings',
  'api',
  'graphql',
  'oauth',
  'jwt',
  'cors',
  'software', // compromise doesn't tag this as uncountable
  'hardware',
  'firmware',
  'middleware',
]);

/**
 * Common irregular plurals - handle without NLP for speed
 * @type {Map<string, string>}
 */
const IRREGULAR_PLURALS = new Map([
  ['person', 'people'],
  ['child', 'children'],
  ['man', 'men'],
  ['woman', 'women'],
  ['tooth', 'teeth'],
  ['foot', 'feet'],
  ['mouse', 'mice'],
  ['goose', 'geese'],
  ['ox', 'oxen'],
  ['leaf', 'leaves'],
  ['life', 'lives'],
  ['knife', 'knives'],
  ['wife', 'wives'],
  ['shelf', 'shelves'],
  ['self', 'selves'],
  ['calf', 'calves'],
  ['loaf', 'loaves'],
  ['wolf', 'wolves'],
  ['half', 'halves'],
  ['elf', 'elves'],
  ['thief', 'thieves'],
  ['index', 'indices'],
  ['vertex', 'vertices'],
  ['matrix', 'matrices'],
  ['appendix', 'appendices'],
  ['crisis', 'crises'],
  ['analysis', 'analyses'],
  ['basis', 'bases'],
  ['thesis', 'theses'],
  ['diagnosis', 'diagnoses'],
  ['hypothesis', 'hypotheses'],
  ['parenthesis', 'parentheses'],
  ['synopsis', 'synopses'],
  ['oasis', 'oases'],
  ['criterion', 'criteria'],
  ['phenomenon', 'phenomena'],
  ['datum', 'data'],
  ['medium', 'media'],
  ['curriculum', 'curricula'],
  ['memorandum', 'memoranda'],
  ['stadium', 'stadiums'], // modern English prefers -s
  ['bacterium', 'bacteria'],
  ['schema', 'schemas'], // in tech context
  ['antenna', 'antennas'], // in tech context
  ['formula', 'formulas'], // in tech context
]);

/**
 * Reverse lookup for irregular plurals
 * @type {Map<string, string>}
 */
const IRREGULAR_SINGULARS = new Map(
  [...IRREGULAR_PLURALS.entries()].map(([s, p]) => [p, s])
);

/**
 * LRU Cache for NLP results
 * @template T
 */
class LRUCache {
  /** @type {Map<string, T>} */
  #cache = new Map();
  /** @type {number} */
  #maxSize;

  /**
   * @param {number} maxSize
   */
  constructor(maxSize = 1000) {
    this.#maxSize = maxSize;
  }

  /**
   * @param {string} key
   * @returns {T | undefined}
   */
  get(key) {
    const value = this.#cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.#cache.delete(key);
      this.#cache.set(key, value);
    }
    return value;
  }

  /**
   * @param {string} key
   * @param {T} value
   */
  set(key, value) {
    if (this.#cache.has(key)) {
      this.#cache.delete(key);
    } else if (this.#cache.size >= this.#maxSize) {
      // Delete oldest (first) entry
      const firstKey = this.#cache.keys().next().value;
      if (firstKey) this.#cache.delete(firstKey);
    }
    this.#cache.set(key, value);
  }

  clear() {
    this.#cache.clear();
  }

  get size() {
    return this.#cache.size;
  }
}

// Caches for NLP results
/** @type {LRUCache<string>} */
const pluralizeCache = new LRUCache(2000);
/** @type {LRUCache<string>} */
const singularizeCache = new LRUCache(2000);
/** @type {LRUCache<boolean>} */
const isVerbCache = new LRUCache(2000);
/** @type {LRUCache<boolean>} */
const isNounCache = new LRUCache(2000);
/** @type {LRUCache<boolean>} */
const isUncountableCache = new LRUCache(500);

/**
 * Clear all NLP caches (useful for testing)
 */
export function clearNLPCaches() {
  pluralizeCache.clear();
  singularizeCache.clear();
  isVerbCache.clear();
  isNounCache.clear();
  isUncountableCache.clear();
}

/**
 * Pluralize a word intelligently using compromise
 * Uses "the X" context trick to help compromise identify words as nouns
 * @param {string} word - Singular word to pluralize
 * @returns {string} Plural form
 */
export function pluralize(word) {
  const lower = word.toLowerCase();

  // Check cache first
  const cached = pluralizeCache.get(lower);
  if (cached !== undefined) {
    // Preserve original casing if word was capitalized
    return word[0] === word[0].toUpperCase() && cached[0]
      ? cached[0].toUpperCase() + cached.slice(1)
      : cached;
  }

  let result;

  // Fast path: API-specific uncountables
  if (API_UNCOUNTABLES.has(lower)) {
    result = word;
  }
  // Fast path: Known irregular plurals
  else if (IRREGULAR_PLURALS.has(lower)) {
    result = IRREGULAR_PLURALS.get(lower) || word;
  }
  // Fast path: Already plural irregular
  else if (IRREGULAR_SINGULARS.has(lower)) {
    result = word; // Already plural
  }
  // Fast path: Common plural endings (already plural)
  else if (
    lower.endsWith('ies') ||
    lower.endsWith('es') ||
    (lower.endsWith('s') && !lower.endsWith('ss') && !lower.endsWith('us'))
  ) {
    result = word; // Likely already plural
  }
  // Slow path: Use NLP
  else {
    // Check if compromise knows it's uncountable
    if (nlp(word).has('#Uncountable')) {
      result = word;
    } else {
      // Use "the X" context to help compromise identify the word as a noun
      const doc = nlp('the ' + word);
      const nlpResult = doc.nouns().toPlural().text();

      // Remove "the " prefix from result
      if (nlpResult && nlpResult.startsWith('the ')) {
        result = nlpResult.slice(4);
      } else {
        result = nlpResult || word;
      }
    }
  }

  // Cache the result
  pluralizeCache.set(lower, result.toLowerCase());
  return result;
}

/**
 * @typedef {'api-path' | 'general'} NLPContext
 */

/**
 * Common API action verbs - fast path detection
 * @type {Set<string>}
 */
const COMMON_VERBS = new Set([
  'get',
  'set',
  'put',
  'post',
  'delete',
  'create',
  'update',
  'remove',
  'add',
  'fetch',
  'send',
  'receive',
  'validate',
  'verify',
  'check',
  'process',
  'handle',
  'execute',
  'run',
  'start',
  'stop',
  'cancel',
  'submit',
  'approve',
  'reject',
  'activate',
  'deactivate',
  'enable',
  'disable',
  'sync',
  'import',
  'export',
  'upload',
  'download',
  'search',
  'find',
  'list',
  'show',
  'hide',
  'open',
  'close',
  'login',
  'logout',
  'register',
  'unregister',
  'subscribe',
  'unsubscribe',
  'connect',
  'disconnect',
  'attach',
  'detach',
  'link',
  'unlink',
  'bind',
  'unbind',
  'lock',
  'unlock',
  'archive',
  'restore',
  'retry',
  'refresh',
  'reload',
  'reset',
  'clear',
  'flush',
  'purge',
  'revoke',
  'grant',
  'deny',
  'allow',
  'block',
  'ban',
  'mute',
  'unmute',
  'pin',
  'unpin',
  'flag',
  'unflag',
  'mark',
  'unmark',
  'tag',
  'untag',
  'assign',
  'unassign',
  'transfer',
  'move',
  'copy',
  'clone',
  'duplicate',
  'merge',
  'split',
  'join',
  'leave',
  'invite',
  'accept',
  'decline',
  'confirm',
  'acknowledge',
  'dismiss',
  'notify',
  'alert',
  'warn',
  'resolve',
  'escalate',
  'prioritize',
  'schedule',
  'reschedule',
  'pause',
  'resume',
  'skip',
  'reorder',
  'sort',
  'filter',
  'group',
  'ungroup',
  'expand',
  'collapse',
  'zoom',
  'rotate',
  'flip',
  'crop',
  'resize',
  'scale',
  'convert',
  'transform',
  'translate',
  'encode',
  'decode',
  'encrypt',
  'decrypt',
  'compress',
  'decompress',
  'serialize',
  'deserialize',
  'parse',
  'render',
  'compile',
  'build',
  'deploy',
  'publish',
  'unpublish',
  'release',
  'rollback',
  'migrate',
  'seed',
  'initialize',
  'finalize',
  'complete',
  'fail',
  'succeed',
  'expire',
  'renew',
  'extend',
  'shorten',
  'truncate',
  'trim',
  'pad',
  'format',
  'normalize',
  'sanitize',
  'escape',
  'unescape',
  'quote',
  'unquote',
  'wrap',
  'unwrap',
  'inject',
  'extract',
  'embed',
  'detach',
  'insert',
  'append',
  'prepend',
  'replace',
  'swap',
  'increment',
  'decrement',
  'increase',
  'decrease',
  'raise',
  'lower',
  'boost',
  'reduce',
  'limit',
  'throttle',
  'rate',
  'cap',
  'uncap',
]);

/**
 * Check if a word is primarily a verb (not a noun)
 * In API path context, disambiguates plural-verb forms (logs, orders, files)
 *
 * @param {string} word
 * @param {NLPContext} [context='api-path'] - Context for disambiguation
 * @returns {boolean}
 */
export function isVerb(word, context = 'api-path') {
  const lower = word.toLowerCase();
  const cacheKey = `${lower}:${context}`;

  // Check cache first
  const cached = isVerbCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  let result;

  // Fast path: Known common verbs
  if (COMMON_VERBS.has(lower)) {
    result = true;
  }
  // Fast path: Uncountables are nouns, not verbs
  else if (API_UNCOUNTABLES.has(lower)) {
    result = false;
  }
  // Slow path: Use NLP
  else {
    const doc = nlp(word);
    const json = doc.json()[0];
    const term = json?.terms?.[0];
    const tags = term?.tags || [];

    // If word has a noun-verb switch, treat it as a noun in API context
    if (term?.switch && term.switch.includes('Noun')) {
      result = false;
    }
    // In API context, disambiguate plural-verb forms using "the X" context
    else if (
      context === 'api-path' &&
      term?.switch &&
      term.switch.includes('Plural')
    ) {
      const contextDoc = nlp('the ' + word);
      const hasNoun = contextDoc.nouns().length > 0;
      const hasVerb = contextDoc.verbs().length > 0;
      result = !(hasNoun && !hasVerb);
    }
    // If tagged as Noun, it's not primarily a verb
    else if (tags.includes('Noun')) {
      result = false;
    } else {
      result = tags.includes('Verb') || tags.includes('Infinitive');
    }
  }

  isVerbCache.set(cacheKey, result);
  return result;
}

/**
 * Check if a word is primarily a noun
 * In API path context, disambiguates plural-verb forms (logs, orders, files)
 *
 * @param {string} word
 * @param {NLPContext} [context='api-path'] - Context for disambiguation
 * @returns {boolean}
 */
export function isNoun(word, context = 'api-path') {
  const lower = word.toLowerCase();
  const cacheKey = `${lower}:${context}`;

  // Check cache first
  const cached = isNounCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  let result;

  // Fast path: API-specific uncountables are nouns
  if (API_UNCOUNTABLES.has(lower)) {
    result = true;
  }
  // Fast path: Known verbs are not nouns (in isolation)
  else if (COMMON_VERBS.has(lower)) {
    result = false;
  }
  // Slow path: Use NLP
  else {
    const doc = nlp(word);
    const json = doc.json()[0];
    const term = json?.terms?.[0];

    // Words with noun-verb switch are nouns in API context
    if (term?.switch && term.switch.includes('Noun')) {
      result = true;
    }
    // In API context, disambiguate plural-verb forms using "the X" context
    else if (
      context === 'api-path' &&
      term?.switch &&
      term.switch.includes('Plural')
    ) {
      const contextDoc = nlp('the ' + word);
      result = contextDoc.nouns().length > 0;
    } else {
      result = doc.has('#Noun') || doc.has('#Uncountable');
    }
  }

  isNounCache.set(cacheKey, result);
  return result;
}

/**
 * Check if a word is uncountable (no plural form)
 * @param {string} word
 * @returns {boolean}
 */
export function isUncountable(word) {
  const lower = word.toLowerCase();

  // Check cache first
  const cached = isUncountableCache.get(lower);
  if (cached !== undefined) {
    return cached;
  }

  let result;

  // Fast path: API-specific uncountables
  if (API_UNCOUNTABLES.has(lower)) {
    result = true;
  }
  // Slow path: Use NLP
  else {
    result = nlp(word).has('#Uncountable');
  }

  isUncountableCache.set(lower, result);
  return result;
}

/**
 * Get the singular form of a word
 * Uses "the X" context trick for noun-verb ambiguous words
 * @param {string} word
 * @returns {string}
 */
export function singularize(word) {
  const lower = word.toLowerCase();

  // Check cache first
  const cached = singularizeCache.get(lower);
  if (cached !== undefined) {
    return word[0] === word[0].toUpperCase() && cached[0]
      ? cached[0].toUpperCase() + cached.slice(1)
      : cached;
  }

  let result;

  // Fast path: Known irregular singulars
  if (IRREGULAR_SINGULARS.has(lower)) {
    result = IRREGULAR_SINGULARS.get(lower) || word;
  }
  // Fast path: Already singular irregular
  else if (IRREGULAR_PLURALS.has(lower)) {
    result = word; // Already singular
  }
  // Fast path: Uncountables
  else if (API_UNCOUNTABLES.has(lower)) {
    result = word;
  }
  // Slow path: Use NLP
  else {
    const doc = nlp('the ' + word);
    const nlpResult = doc.nouns().toSingular().text();

    if (nlpResult && nlpResult.startsWith('the ')) {
      result = nlpResult.slice(4);
    } else {
      result = nlpResult || word;
    }
  }

  // Cache the result
  singularizeCache.set(lower, result.toLowerCase());
  return result;
}

/**
 * Analyze a word and return its likely parts of speech
 * @param {string} word
 * @param {NLPContext} [context='api-path'] - Context for disambiguation
 * @returns {{ isVerb: boolean, isNoun: boolean, isUncountable: boolean, tags: string[] }}
 */
export function analyzeWord(word, context = 'api-path') {
  const doc = nlp(word);
  const json = doc.json()[0];
  const tags = json?.terms?.[0]?.tags || [];

  return {
    isVerb: isVerb(word, context),
    isNoun: isNoun(word, context),
    isUncountable: isUncountable(word),
    tags,
  };
}
