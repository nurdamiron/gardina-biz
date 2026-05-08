import XLSX from 'xlsx';
import pool from './src/infrastructure/database/config.js';

/**
 * Import products from Excel file to database
 * Structure:
 * - One product can have multiple color variants
 * - Price is stored at product level (applies to all colors)
 * - Stock quantity is stored at variant level (per color)
 */
async function importProducts() {
  const client = await pool.connect();

  try {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║            ИМПОРТ ТОВАРОВ ИЗ EXCEL В БАЗУ ДАННЫХ              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // 1. Read Excel file
    const filePath = '/Users/nurdauletakhmatov/Downloads/Склад товар.xlsx';
    console.log(`📂 Чтение файла: ${filePath}\n`);

    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets['Лист1'];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✓ Прочитано строк: ${data.length}\n`);

    // 2. Group data by product name
    const productsByName = {};
    let currentProduct = null;

    data.forEach((row, idx) => {
      const productName = row['Товар атауы'];
      const articleCode = row['Артикул Товар коды'];
      const category = row['Категориясы'];

      // New product starts when we see a product name
      if (productName) {
        currentProduct = productName;
        if (!productsByName[productName]) {
          productsByName[productName] = {
            name: productName,
            category: category,
            colors: []
          };
        }
      }

      // Add color variant if we have an article code
      if (currentProduct && articleCode) {
        productsByName[currentProduct].colors.push({
          colorCode: articleCode,
          purchasePrice: row['Сатып алу бағасы'],
          sellingPrice: row['Сату бағасы'],
          quantity: row['Келген саны'],
          widthCm: row['Өлшемі (рулон)'],
          receivedDate: row['Келген күні'],
          rowNumber: idx + 2
        });
      }
    });

    const products = Object.values(productsByName);
    console.log(`📊 Обработано товаров: ${products.length}\n`);

    // 3. Map category to type
    const mapCategoryToType = (category) => {
      if (!category) return 'curtain';
      const cat = category.toLowerCase();
      if (cat.includes('партера') || cat.includes('перде')) return 'curtain';
      if (cat.includes('тюль')) return 'tulle';
      if (cat.includes('карниз')) return 'cornice';
      if (cat.includes('жалюзи')) return 'jalousie';
      if (cat.includes('таспа') || cat.includes('лента')) return 'accessory';
      return 'curtain'; // default
    };

    // 4. Start transaction
    await client.query('BEGIN');

    let importedProducts = 0;
    let importedVariants = 0;
    const errors = [];

    console.log('═'.repeat(65));
    console.log('ИМПОРТ ДАННЫХ:\n');

    // 5. Import each product with its variants
    for (const product of products) {
      try {
        // Get price from first color (applies to all colors)
        const firstColor = product.colors[0];
        if (!firstColor) {
          console.log(`⚠️  Пропущен "${product.name}" - нет цветов`);
          continue;
        }

        const purchasePrice = parseFloat(firstColor.purchasePrice) || 0;
        const sellingPrice = parseFloat(firstColor.sellingPrice) || 0;
        const widthCm = parseFloat(firstColor.widthCm) || 280; // Default 2.8m

        if (!sellingPrice || sellingPrice === 0) {
          console.log(`⚠️  Пропущен "${product.name}" - нет цены продажи`);
          continue;
        }

        // Map category
        const productType = mapCategoryToType(product.category);

        // Insert product
        const productResult = await client.query(
          `INSERT INTO products (
            name, type, price_per_meter, cost_price, width_cm,
            brand, supplier, stock_quantity, is_available, unit
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id`,
          [
            product.name,
            productType,
            sellingPrice,
            purchasePrice,
            widthCm,
            product.category || null, // Store original category as brand
            null, // supplier
            0, // stock_quantity at product level (will be in variants)
            true, // is_available
            'm' // unit - meters
          ]
        );

        const productId = productResult.rows[0].id;
        importedProducts++;

        // Insert all color variants
        let variantCount = 0;
        for (let i = 0; i < product.colors.length; i++) {
          const color = product.colors[i];
          const quantity = parseFloat(color.quantity) || 0;

          await client.query(
            `INSERT INTO product_variants (
              product_id, variant_code, variant_name, stock_quantity,
              is_available, is_default, hex_color, image_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              productId,
              color.colorCode,
              null, // variant_name - можем добавить позже
              quantity,
              true, // is_available
              i === 0, // first variant is default
              null, // hex_color
              null  // image_url
            ]
          );

          variantCount++;
          importedVariants++;
        }

        console.log(`✓ "${product.name}" - ${variantCount} цвет(ов)`);

      } catch (error) {
        errors.push({
          product: product.name,
          error: error.message
        });
        console.log(`✗ "${product.name}" - ОШИБКА: ${error.message}`);
      }
    }

    await client.query('COMMIT');

    // 6. Summary
    console.log('\n' + '═'.repeat(65));
    console.log('\n✅ ИМПОРТ ЗАВЕРШЕН!\n');
    console.log('📊 СТАТИСТИКА:');
    console.log(`   Товары импортированы: ${importedProducts}/${products.length}`);
    console.log(`   Варианты (цвета) импортированы: ${importedVariants}`);

    if (errors.length > 0) {
      console.log(`\n⚠️  ОШИБКИ (${errors.length}):`);
      errors.forEach(err => {
        console.log(`   - ${err.product}: ${err.error}`);
      });
    }

    console.log('\n' + '═'.repeat(65));

    // 7. Verify import
    const verifyProducts = await client.query('SELECT COUNT(*) FROM products');
    const verifyVariants = await client.query('SELECT COUNT(*) FROM product_variants');

    console.log('\n✓ ПРОВЕРКА БАЗЫ ДАННЫХ:');
    console.log(`   Товары в БД: ${verifyProducts.rows[0].count}`);
    console.log(`   Варианты в БД: ${verifyVariants.rows[0].count}\n`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
importProducts().catch(error => {
  console.error('Failed to import products:', error);
  process.exit(1);
});
