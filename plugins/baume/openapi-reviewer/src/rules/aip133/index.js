// @ts-check
/**
 * AIP-133: Standard Methods - Create
 *
 * @see https://google.aip.dev/133
 * @module rules/aip133
 */

export {
  postReturnsCreated,
  PostReturnsCreatedRule,
} from './post-returns-created.js';

import { postReturnsCreated } from './post-returns-created.js';

export const rules = [postReturnsCreated];
