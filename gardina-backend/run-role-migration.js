#!/usr/bin/env node

/**
 * Run Role System Phase 1 Migration
 * Applies migration 014-role-system-phase1.sql to production database
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const { Client } = pg;

async function runRoleMigration() {
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
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database:', process.env.DATABASE_NAME);

    // Read migration file
    const migrationPath = join(__dirname, 'migrations', '014-role-system-phase1.sql');
    console.log('\n📄 Reading migration file:', migrationPath);
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Show migration preview
    console.log('\n📋 Migration Preview:');
    console.log('  - Rename manager → sales_manager');
    console.log('  - Add commission_rate to users');
    console.log('  - Create commission_splits table');
    console.log('  - Add team tracking to measurements');
    console.log('  - Add team tracking to deals');
    console.log('  - Add lead data to clients');
    console.log('  - Extend measurement_status enum');
    console.log('  - Add installer team support');
    console.log('  - Create audit_log table');

    // Check current state
    console.log('\n🔍 Checking current database state...');

    const roleCheck = await client.query(`
      SELECT enumlabel FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'user_role'
      ORDER BY e.enumsortorder
    `);
    console.log('  Current user_role values:', roleCheck.rows.map(r => r.enumlabel).join(', '));

    const managerCount = await client.query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'manager'
    `);
    console.log(`  Users with role 'manager':`, managerCount.rows[0].count);

    // Confirm before running
    console.log('\n⚠️  WARNING: This migration will modify the database schema!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Run migration
    console.log('🚀 Running migration...\n');
    await client.query(migrationSQL);

    // Verify results
    console.log('\n✅ Migration completed! Verifying...\n');

    const newRoleCheck = await client.query(`
      SELECT enumlabel FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'user_role'
      ORDER BY e.enumsortorder
    `);
    console.log('  ✓ New user_role values:', newRoleCheck.rows.map(r => r.enumlabel).join(', '));

    const salesManagerCount = await client.query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'sales_manager'
    `);
    console.log(`  ✓ Users with role 'sales_manager':`, salesManagerCount.rows[0].count);

    const commissionSplitsTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'commission_splits'
      ) as exists
    `);
    console.log('  ✓ commission_splits table exists:', commissionSplitsTable.rows[0].exists);

    const auditLogTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'audit_log'
      ) as exists
    `);
    console.log('  ✓ audit_log table exists:', auditLogTable.rows[0].exists);

    const measurementColumns = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'measurements'
      AND column_name IN ('assigned_to', 'created_by')
    `);
    console.log('  ✓ measurements new columns:', measurementColumns.rows.map(r => r.column_name).join(', '));

    const dealColumns = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'deals'
      AND column_name IN ('sales_manager_id', 'installer_id', 'commission_locked', 'source', 'assigned_to', 'priority')
    `);
    console.log('  ✓ deals new columns:', dealColumns.rows.map(r => r.column_name).join(', '));

    console.log('\n🎉 Migration 014-role-system-phase1 completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nError details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed\n');
  }
}

// Run migration
runRoleMigration()
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
