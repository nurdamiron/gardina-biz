import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runBrandsMigration() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read SQL migration file
    const migrationPath = path.join(__dirname, 'migrations', '002-brands-and-colors.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running brands and colors migration...');

    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Added:');
    console.log('  - brands table for brand management');
    console.log('  - product_colors table for color variants');
    console.log('  - brand_id column in products table');
    console.log('  - Migrated existing brand data');
    console.log('  - Created default color variants for existing products');

    // Verify migration
    const brandCount = await client.query('SELECT COUNT(*) FROM brands');
    const colorCount = await client.query('SELECT COUNT(*) FROM product_colors');

    console.log('');
    console.log('📊 Statistics:');
    console.log(`  - ${brandCount.rows[0].count} brands created`);
    console.log(`  - ${colorCount.rows[0].count} color variants created`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBrandsMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default runBrandsMigration;