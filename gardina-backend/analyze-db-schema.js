#!/usr/bin/env node

/**
 * Comprehensive Database Schema Analysis
 * Analyzes all tables, relationships, indexes, and constraints
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function analyzeDatabase() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database:', process.env.DATABASE_NAME);
    console.log('');

    // 1. All Tables
    console.log('📊 DATABASE TABLES');
    console.log('='.repeat(80));
    const tablesResult = await client.query(`
      SELECT
        schemaname,
        tablename,
        tableowner
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    const tables = tablesResult.rows.map(r => r.tablename);
    console.log('Total tables:', tables.length);
    tables.forEach((table, i) => {
      console.log(`  ${i + 1}. ${table}`);
    });
    console.log('');

    // 2. All ENUMs
    console.log('📋 ENUM TYPES');
    console.log('='.repeat(80));
    const enumsResult = await client.query(`
      SELECT
        t.typname as enum_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typtype = 'e'
      GROUP BY t.typname
      ORDER BY t.typname
    `);

    enumsResult.rows.forEach(row => {
      console.log(`\n${row.enum_name}:`);
      const values = Array.isArray(row.values) ? row.values : [row.values];
      values.forEach(val => console.log(`  - ${val}`));
    });
    console.log('');

    // 3. Detailed Table Analysis
    console.log('🔍 DETAILED TABLE ANALYSIS');
    console.log('='.repeat(80));

    for (const table of tables) {
      console.log(`\n📌 Table: ${table}`);
      console.log('-'.repeat(80));

      // Columns
      const columnsResult = await client.query(`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          column_default,
          is_nullable,
          udt_name
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      console.log('\nColumns:');
      columnsResult.rows.forEach(col => {
        let type = col.data_type;
        if (col.character_maximum_length) {
          type += `(${col.character_maximum_length})`;
        }
        if (col.udt_name !== col.data_type) {
          type = col.udt_name;
        }
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  - ${col.column_name}: ${type} ${nullable}${def}`);
      });

      // Foreign Keys
      const fkResult = await client.query(`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = $1
      `, [table]);

      if (fkResult.rows.length > 0) {
        console.log('\nForeign Keys:');
        fkResult.rows.forEach(fk => {
          console.log(`  - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }

      // Indexes
      const indexResult = await client.query(`
        SELECT
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename = $1
          AND schemaname = 'public'
        ORDER BY indexname
      `, [table]);

      if (indexResult.rows.length > 0) {
        console.log('\nIndexes:');
        indexResult.rows.forEach(idx => {
          console.log(`  - ${idx.indexname}`);
        });
      }

      // Row count
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`\nRow count: ${countResult.rows[0].count}`);
    }

    // 4. Table Relationships Map
    console.log('\n\n🔗 TABLE RELATIONSHIPS MAP');
    console.log('='.repeat(80));

    const relationshipsResult = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `);

    const relationshipMap = {};
    relationshipsResult.rows.forEach(rel => {
      if (!relationshipMap[rel.table_name]) {
        relationshipMap[rel.table_name] = [];
      }
      relationshipMap[rel.table_name].push({
        column: rel.column_name,
        references: `${rel.foreign_table_name}.${rel.foreign_column_name}`
      });
    });

    Object.keys(relationshipMap).sort().forEach(table => {
      console.log(`\n${table}:`);
      relationshipMap[table].forEach(rel => {
        console.log(`  ${rel.column} → ${rel.references}`);
      });
    });

    // 5. Data Flow Analysis
    console.log('\n\n📈 DATA FLOW ANALYSIS');
    console.log('='.repeat(80));

    // Check critical flows
    const flows = {
      'User Authentication': await client.query('SELECT COUNT(*) FROM users'),
      'Active Clients': await client.query('SELECT COUNT(*) FROM clients'),
      'Active Deals': await client.query("SELECT COUNT(*) FROM deals WHERE status NOT IN ('completed', 'cancelled')"),
      'Pending Measurements': await client.query("SELECT COUNT(*) FROM measurements WHERE status IN ('scheduled', 'in_progress')"),
      'Active Proposals': await client.query("SELECT COUNT(*) FROM proposals WHERE status = 'sent'"),
      'Orders in Production': await client.query("SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'cutting', 'sewing', 'quality_check')"),
      'Pending Installations': await client.query("SELECT COUNT(*) FROM installations WHERE status IN ('scheduled', 'in_progress')"),
    };

    console.log('\nCurrent System State:');
    for (const [name, result] of Object.entries(flows)) {
      console.log(`  - ${name}: ${result.rows[0].count}`);
    }

    // 6. Missing Data / Orphans
    console.log('\n\n⚠️  DATA INTEGRITY CHECKS');
    console.log('='.repeat(80));

    // Check for deals without clients
    const orphanDeals = await client.query(`
      SELECT COUNT(*) FROM deals
      WHERE client_id NOT IN (SELECT id FROM clients)
    `);
    console.log(`\nDeals without valid client_id: ${orphanDeals.rows[0].count}`);

    // Check for measurements without clients
    const orphanMeasurements = await client.query(`
      SELECT COUNT(*) FROM measurements
      WHERE client_id NOT IN (SELECT id FROM clients)
    `);
    console.log(`Measurements without valid client_id: ${orphanMeasurements.rows[0].count}`);

    // Check for proposals without clients
    const orphanProposals = await client.query(`
      SELECT COUNT(*) FROM proposals
      WHERE client_id NOT IN (SELECT id FROM clients)
    `);
    console.log(`Proposals without valid client_id: ${orphanProposals.rows[0].count}`);

    // Check for users without proper roles
    const invalidRoles = await client.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY count DESC
    `);
    console.log('\nUser roles distribution:');
    invalidRoles.rows.forEach(row => {
      console.log(`  - ${row.role}: ${row.count}`);
    });

    console.log('\n\n✅ Database analysis complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Run analysis
analyzeDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
