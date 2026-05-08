#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import pool from './src/infrastructure/database/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log('=================================');
  console.log('Product Variants Migration Runner');
  console.log('=================================\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', '003-product-variants-simple.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Running migration: 003-product-variants-simple.sql');
    console.log('📦 This will create the product_variants table for managing fabric color variants.\n');

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('The following changes have been applied:');
    console.log('1. Created product_variants table');
    console.log('2. Added indexes for better query performance');
    console.log('3. Created update trigger for updated_at timestamp');
    console.log('4. Generated default variants for existing fabric products');
    console.log('\n🎉 Your system is now ready to handle fabric variants!');

    // Verify the table was created
    const tableCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_name = 'product_variants'
    `);

    if (parseInt(tableCheck.rows[0].count) > 0) {
      console.log('\n✔️  Table product_variants created successfully');

      // Check how many default variants were created
      const variantCount = await pool.query('SELECT COUNT(*) as count FROM product_variants');
      console.log(`✔️  ${variantCount.rows[0].count} default variant(s) created for existing products`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error);