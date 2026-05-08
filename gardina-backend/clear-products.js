import pool from './src/infrastructure/database/config.js';

/**
 * Clear all products and product variants from database
 * This will delete all data from products and product_variants tables
 */
async function clearProducts() {
  const client = await pool.connect();

  try {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║          ОЧИСТКА БАЗЫ ДАННЫХ ОТ ТОВАРОВ                       ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    await client.query('BEGIN');

    // 1. Count current data
    const variantsCount = await client.query('SELECT COUNT(*) FROM product_variants');
    const productsCount = await client.query('SELECT COUNT(*) FROM products');

    console.log('📊 ТЕКУЩЕЕ СОСТОЯНИЕ:');
    console.log(`   Товары: ${productsCount.rows[0].count}`);
    console.log(`   Варианты (цвета): ${variantsCount.rows[0].count}\n`);

    if (productsCount.rows[0].count === '0' && variantsCount.rows[0].count === '0') {
      console.log('✅ База данных уже пуста!\n');
      await client.query('ROLLBACK');
      return;
    }

    // 2. Delete all product variants first (foreign key constraint)
    console.log('🗑️  Удаление вариантов...');
    const deleteVariantsResult = await client.query('DELETE FROM product_variants');
    console.log(`   ✓ Удалено вариантов: ${deleteVariantsResult.rowCount}\n`);

    // 3. Delete all products
    console.log('🗑️  Удаление товаров...');
    const deleteProductsResult = await client.query('DELETE FROM products');
    console.log(`   ✓ Удалено товаров: ${deleteProductsResult.rowCount}\n`);

    // 4. Reset sequences (auto-increment IDs will start from 1)
    // Note: We're using UUIDs, so no need to reset sequences

    await client.query('COMMIT');

    console.log('═'.repeat(65));
    console.log('✅ ОЧИСТКА ЗАВЕРШЕНА УСПЕШНО!\n');
    console.log('📊 ИТОГОВОЕ СОСТОЯНИЕ:');
    console.log('   Товары: 0');
    console.log('   Варианты: 0\n');
    console.log('Теперь можно импортировать данные из Excel файла.');
    console.log('═'.repeat(65));

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
clearProducts().catch(error => {
  console.error('Failed to clear products:', error);
  process.exit(1);
});
