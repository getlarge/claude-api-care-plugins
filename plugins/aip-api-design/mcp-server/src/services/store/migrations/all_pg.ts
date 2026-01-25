/**
 * All PostgreSQL Migrations
 *
 * Exports all PostgreSQL migrations in order for the migration runner.
 * Import this file to get all migrations to apply.
 */

import type { PgMigration } from './postgres.js';
import migration001 from './001_initial_schema_pg.js';

/**
 * All PostgreSQL migrations in version order.
 * Add new migrations here as they are created.
 */
export const allPgMigrations: PgMigration[] = [migration001];

export default allPgMigrations;
