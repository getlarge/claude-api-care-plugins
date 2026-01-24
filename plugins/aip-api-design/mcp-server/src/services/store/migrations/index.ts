/**
 * SQLite Migrations System
 *
 * Simple versioned migrations for SQLite databases.
 * Migrations are tracked in a `_migrations` table.
 */

import type { DatabaseSync } from 'node:sqlite';

export interface Migration {
  version: number;
  name: string;
  up: (db: DatabaseSync) => void;
}

/**
 * Run all pending migrations on the database.
 *
 * @param db - SQLite database instance
 * @param migrations - Array of migrations to apply
 * @returns Number of migrations applied
 */
export function runMigrations(
  db: DatabaseSync,
  migrations: Migration[]
): number {
  // Create migrations tracking table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `);

  // Get current version
  const currentVersion = getCurrentVersion(db);

  // Sort migrations by version and filter pending ones
  const pending = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  if (pending.length === 0) {
    return 0;
  }

  // Apply each migration in a transaction
  for (const migration of pending) {
    db.exec('BEGIN TRANSACTION');
    try {
      migration.up(db);

      // Record migration
      const stmt = db.prepare(
        'INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)'
      );
      stmt.run(migration.version, migration.name, Date.now());

      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
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
export function getCurrentVersion(db: DatabaseSync): number {
  try {
    const stmt = db.prepare('SELECT MAX(version) as version FROM _migrations');
    const row = stmt.get() as { version: number | null } | undefined;
    return row?.version ?? 0;
  } catch {
    // Table doesn't exist yet
    return 0;
  }
}

/**
 * Get list of applied migrations.
 */
export function getAppliedMigrations(
  db: DatabaseSync
): Array<{ version: number; name: string; appliedAt: number }> {
  try {
    const stmt = db.prepare(
      'SELECT version, name, applied_at FROM _migrations ORDER BY version'
    );
    const rows = stmt.all() as Array<{
      version: number;
      name: string;
      applied_at: number;
    }>;
    return rows.map((row) => ({
      version: row.version,
      name: row.name,
      appliedAt: row.applied_at,
    }));
  } catch {
    return [];
  }
}
