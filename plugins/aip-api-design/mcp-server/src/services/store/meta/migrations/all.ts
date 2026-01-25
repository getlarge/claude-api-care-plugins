/**
 * All Migrations
 *
 * Exports all migrations in order for the migration runner.
 * Import this file to get all migrations to apply.
 */

import type { Migration } from './index.js';
import migration001 from './001_initial_schema.js';

/**
 * All migrations in version order.
 * Add new migrations here as they are created.
 */
export const allMigrations: Migration[] = [migration001];

export default allMigrations;
