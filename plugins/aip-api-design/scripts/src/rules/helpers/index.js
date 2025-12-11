// @ts-check
/**
 * Re-export all helper utilities
 * @module rules/helpers
 */

// Path utilities
export {
  VERSION_PATTERNS,
  getResourceSegments,
  isVersionPrefix,
  escapeRegex,
  isCollectionEndpoint,
  detectCasingStyle,
} from './path-utils.js';

// Singleton detection
export { findSingletonResources, isSingletonPath } from './singleton.js';

// Naming utilities
export {
  CUSTOM_METHOD_VERBS,
  NOUN_EXCEPTIONS,
  isCustomMethod,
  looksLikeVerb,
  isSingular,
} from './naming.js';

// Spec traversal utilities
export {
  getAllOperations,
  hasParameter,
  resolveRef,
  getResponseSchema,
} from './spec-utils.js';
