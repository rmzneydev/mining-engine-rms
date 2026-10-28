import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const TEST_DB_NAME = 'auth_test_db';
const ADMIN_DATABASE_URL =
  process.env.TEST_ADMIN_DATABASE_URL ??
  'postgresql://mining_user:mining_dev_password@localhost:5432/postgres';
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  `postgresql://mining_user:mining_dev_password@localhost:5432/${TEST_DB_NAME}`;

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'test_secret_for_auth_service_1234567890';
process.env.JWT_EXPIRES_IN = '1h';

const adminPool = new pg.Pool({ connectionString: ADMIN_DATABASE_URL });
const existing = await adminPool.query(
  'SELECT 1 FROM pg_database WHERE datname = $1',
  [TEST_DB_NAME],
);

if (existing.rowCount === 0) {
  await adminPool.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
}

await adminPool.end();

const migrationsDir = fileURLToPath(
  new URL('../prisma/migrations', import.meta.url),
);
const migrations = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(migrationsDir, entry.name, 'migration.sql'))
  .sort();

const testPool = new pg.Pool({ connectionString: TEST_DATABASE_URL });
await testPool.query('DROP TABLE IF EXISTS "users" CASCADE');
for (const migration of migrations) {
  await testPool.query(readFileSync(migration, 'utf8'));
}
await testPool.end();
