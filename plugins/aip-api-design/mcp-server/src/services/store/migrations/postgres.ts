/**
 * PostgreSQL Migrations System
 *
 * Simple versioned migrations for PostgreSQL databases.
 * Migrations are tracked in a `_migrations` table.
 */

import type { PgPool } from '../postgres.js';

export interface PgMigration {
  version: number;
  name: string;
  up: (pool: PgPool) => Promise<void>;
}

/**
 * Run all pending migrations on the database.
 *
 * @param pool - PostgreSQL pool instance
 * @param migrations - Array of migrations to apply
 * @returns Number of migrations applied
 */
export async function runPgMigrations(
  pool: PgPool,
  migrations: PgMigration[]
): Promise<number> {
  // Create migrations tracking table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at BIGINT NOT NULL
    )
  `);

  // Get current version
  const currentVersion = await getCurrentPgVersion(pool);

  // Sort migrations by version and filter pending ones
  const pending = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  if (pending.length === 0) {
    return 0;
  }

  // Apply each migration in a transaction
  for (const migration of pending) {
    await pool.query('BEGIN');
    try {
      await migration.up(pool);

      // Record migration
      await pool.query(
        'INSERT INTO _migrations (version, name, applied_at) VALUES ($1, $2, $3)',
        [migration.version, migration.name, Date.now()]
      );

      await pool.query('COMMIT');
    } catch (error) {
      await pool.query('ROLLBACK');
      throw new Error(
        `Migration ${migration.version} (${migration.name}) failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return pending.length;
}

/**
 * Get the current migration version.
 */
export async function getCurrentPgVersion(pool: PgPool): Promise<number> {
  try {
    const result = await pool.query<{ version: number | null }>(
      'SELECT MAX(version) as version FROM _migrations'
    );
    return result.rows[0]?.version ?? 0;
  } catch {
    // Table doesn't exist yet
    return 0;
  }
}

/**
 * Get list of applied migrations.
 */
export async function getAppliedPgMigrations(
  pool: PgPool
): Promise<Array<{ version: number; name: string; appliedAt: number }>> {
  try {
    const result = await pool.query<{
      version: number;
      name: string;
      applied_at: string;
    }>('SELECT version, name, applied_at FROM _migrations ORDER BY version');
    return result.rows.map((row) => ({
      version: row.version,
      name: row.name,
      appliedAt: parseInt(String(row.applied_at), 10),
    }));
  } catch {
    return [];
  }
}
