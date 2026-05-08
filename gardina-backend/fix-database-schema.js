import pool from './src/infrastructure/database/config.js';

/**
 * Fix database schema for decimal values
 */
async function fixSchema() {
  const client = await pool.connect();

  try {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║              ИСПРАВЛЕНИЕ СТРУКТУРЫ БАЗЫ ДАННЫХ                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Check current schema
    const schemaCheck = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'products'
      AND column_name IN ('width_cm', 'stock_quantity', 'price_per_meter', 'cost_price')
      ORDER BY column_name
    `);

    console.log('📋 ТЕКУЩАЯ СТРУКТУРА products:');
    schemaCheck.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type}`);
    });

    const variantsCheck = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'product_variants'
      AND column_name = 'stock_quantity'
    `);

    console.log('\n📋 ТЕКУЩАЯ СТРУКТУРА product_variants:');
    variantsCheck.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n═'.repeat(65));

    // Fix schema
    console.log('\n🔧 ИЗМЕНЕНИЕ СТРУКТУРЫ...\n');

    await client.query('BEGIN');

    // Alter products table
    await client.query(`
      ALTER TABLE products
      ALTER COLUMN width_cm TYPE NUMERIC(10,2)
    `);
    console.log('✓ products.width_cm → NUMERIC(10,2)');

    await client.query(`
      ALTER TABLE products
      ALTER COLUMN stock_quantity TYPE NUMERIC(10,2)
    `);
    console.log('✓ products.stock_quantity → NUMERIC(10,2)');

    await client.query(`
      ALTER TABLE products
      ALTER COLUMN price_per_meter TYPE NUMERIC(10,2)
    `);
    console.log('✓ products.price_per_meter → NUMERIC(10,2)');

    await client.query(`
      ALTER TABLE products
      ALTER COLUMN cost_price TYPE NUMERIC(10,2)
    `);
    console.log('✓ products.cost_price → NUMERIC(10,2)');

    // Alter product_variants table
    await client.query(`
      ALTER TABLE product_variants
      ALTER COLUMN stock_quantity TYPE NUMERIC(10,2)
    `);
    console.log('✓ product_variants.stock_quantity → NUMERIC(10,2)');

    await client.query('COMMIT');

    console.log('\n═'.repeat(65));
    console.log('\n✅ СТРУКТУРА УСПЕШНО ИЗМЕНЕНА!\n');
    console.log('Теперь поля поддерживают десятичные значения (например: 120.5 метров)\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ ОШИБКА:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
fixSchema().catch(error => {
  console.error('Failed to fix schema:', error);
  process.exit(1);
});
