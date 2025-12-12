// @ts-check
/**
 * NLP utilities for API naming validation
 * Thin wrapper around compromise with API-specific extensions
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
 * Pluralize a word intelligently using compromise
 * Uses "the X" context trick to help compromise identify words as nouns
 * @param {string} word - Singular word to pluralize
 * @returns {string} Plural form
 */
export function pluralize(word) {
  const lower = word.toLowerCase();

  // Check our API-specific uncountables first
  if (API_UNCOUNTABLES.has(lower)) {
    return word;
  }

  // Check if compromise knows it's uncountable
  if (nlp(word).has('#Uncountable')) {
    return word;
  }

  // Use "the X" context to help compromise identify the word as a noun
  // This resolves ambiguity for noun-verb switches like "order", "download"
  const doc = nlp('the ' + word);
  const result = doc.nouns().toPlural().text();

  // Remove "the " prefix from result
  if (result && result.startsWith('the ')) {
    return result.slice(4);
  }

  return result || word;
}

/**
 * Check if a word is primarily a verb (not a noun)
 * Words with "Noun|Verb" switch property are treated as nouns in API context
 * @param {string} word
 * @returns {boolean}
 */
export function isVerb(word) {
  const doc = nlp(word);
  const json = doc.json()[0];
  const term = json?.terms?.[0];
  const tags = term?.tags || [];

  // If word has a noun-verb switch, treat it as a noun in API context
  // These are words like "download", "upload", "search", "order"
  if (term?.switch && term.switch.includes('Noun')) {
    return false;
  }

  // If tagged as Noun, it's not primarily a verb
  if (tags.includes('Noun')) {
    return false;
  }

  return tags.includes('Verb') || tags.includes('Infinitive');
}

/**
 * Check if a word is primarily a noun
 * @param {string} word
 * @returns {boolean}
 */
export function isNoun(word) {
  const lower = word.toLowerCase();

  // API-specific uncountables are nouns
  if (API_UNCOUNTABLES.has(lower)) {
    return true;
  }

  const doc = nlp(word);
  const json = doc.json()[0];
  const term = json?.terms?.[0];

  // Words with noun-verb switch are nouns in API context
  if (term?.switch && term.switch.includes('Noun')) {
    return true;
  }

  return doc.has('#Noun') || doc.has('#Uncountable');
}

/**
 * Check if a word is uncountable (no plural form)
 * @param {string} word
 * @returns {boolean}
 */
export function isUncountable(word) {
  const lower = word.toLowerCase();

  // Check API-specific uncountables first
  if (API_UNCOUNTABLES.has(lower)) {
    return true;
  }

  return nlp(word).has('#Uncountable');
}

/**
 * Get the singular form of a word
 * Uses "the X" context trick for noun-verb ambiguous words
 * @param {string} word
 * @returns {string}
 */
export function singularize(word) {
  // Use context to help identify as noun
  const doc = nlp('the ' + word);
  const result = doc.nouns().toSingular().text();

  // Remove "the " prefix
  if (result && result.startsWith('the ')) {
    return result.slice(4);
  }

  return result || word;
}

/**
 * Analyze a word and return its likely parts of speech
 * @param {string} word
 * @returns {{ isVerb: boolean, isNoun: boolean, isUncountable: boolean, tags: string[] }}
 */
export function analyzeWord(word) {
  const doc = nlp(word);
  const json = doc.json()[0];
  const tags = json?.terms?.[0]?.tags || [];

  return {
    isVerb: isVerb(word),
    isNoun: isNoun(word),
    isUncountable: isUncountable(word),
    tags,
  };
}
