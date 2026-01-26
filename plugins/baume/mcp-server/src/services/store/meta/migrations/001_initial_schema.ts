/**
 * Migration 001: Initial Schema
 *
 * Creates the base specs table for storing OpenAPI specs and findings.
 */

import type { Migration } from './index.js';

const migration: Migration = {
  version: 1,
  name: 'initial_schema',
  up: (db) => {
    // Create specs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS specs (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        content_type TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        session_id TEXT
      )
    `);

    // Index on expires_at for efficient cleanup queries
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_specs_expires_at ON specs(expires_at)
    `);
  },
};

export default migration;
