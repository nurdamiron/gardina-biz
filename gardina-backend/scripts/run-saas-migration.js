/**
 * Apply multi-tenant SaaS migration (016) to an existing PostgreSQL database.
 * Usage: node scripts/run-saas-migration.js
 */
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const sqlPath = path.join(
  __dirname,
  '..',
  'src',
  'infrastructure',
  'database',
  'migrations',
  '016-saas-multi-tenant.sql'
);

async function main() {
  const client = new pg.Client({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
  });

  await client.connect();
  console.log('Connected. Running', sqlPath);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await client.query(sql);
  await client.end();
  console.log('016-saas-multi-tenant.sql applied.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
