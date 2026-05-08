import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();
const { Client } = pg;
const client = new Client({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});
await client.connect();
const sql = fs.readFileSync('migrations/simplify-statuses.sql', 'utf-8');
await client.query(sql);
console.log('✅ Migration completed: statuses simplified');
await client.end();
