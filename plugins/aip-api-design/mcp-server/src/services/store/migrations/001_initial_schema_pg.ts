/**
 * Migration 001: Initial Schema (PostgreSQL)
 *
 * Creates the base specs table for storing OpenAPI specs and findings.
 */

import type { PgMigration } from './postgres.js';

const migration: PgMigration = {
  version: 1,
  name: 'initial_schema',
  up: async (pool) => {
    // Create specs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS specs (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        content_type TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        expires_at BIGINT NOT NULL,
        session_id TEXT
      )
    `);

    // Index on expires_at for efficient cleanup queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_specs_expires_at ON specs(expires_at)
    `);

    // Index on created_at for efficient pagination
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_specs_created_at ON specs(created_at DESC)
    `);
  },
};

export default migration;
