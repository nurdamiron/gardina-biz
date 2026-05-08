#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import pool from './src/infrastructure/database/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log('===============================================');
  console.log('Remove Product Code Field Migration');
  console.log('===============================================\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', '004-remove-product-code.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Running migration: 004-remove-product-code.sql');
    console.log('🔧 This will remove the code field from products table.\n');

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('The following changes have been applied:');
    console.log('1. Removed unique constraint on code field');
    console.log('2. Dropped index on code field');
    console.log('3. Removed code column from products table');
    console.log('\n🎉 Product codes are now managed at variant level only!');

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