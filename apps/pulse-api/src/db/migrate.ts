/**
 * Apply sql/*.sql in lexical order against PULSE_DATABASE_URL.
 * Usage: PULSE_DATABASE_URL=… npm run db:migrate
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Pool } from 'pg';

async function main(): Promise<void> {
  const url = process.env.PULSE_DATABASE_URL;
  if (!url) {
    throw new Error('PULSE_DATABASE_URL is required for db:migrate');
  }

  const sqlDir = path.resolve(__dirname, '../../sql');
  const files = fs
    .readdirSync(sqlDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    throw new Error(`No .sql files under ${sqlDir}`);
  }

  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const file of files) {
      const already = await pool.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file],
      );
      if (already.rowCount && already.rowCount > 0) {
        console.log(`skip ${file} (already applied)`);
        continue;
      }
      const body = fs.readFileSync(path.join(sqlDir, file), 'utf8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(body);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');
        console.log(`applied ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error('db:migrate failed', err);
  process.exit(1);
});
