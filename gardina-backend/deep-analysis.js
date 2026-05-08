import XLSX from 'xlsx';
import pool from './src/infrastructure/database/config.js';

async function deepAnalysis() {
  try {
    console.log('╔════════════════════════════════════════════════════════════════════════╗');
    console.log('║         ГЛУБОКИЙ АНАЛИЗ ДАННЫХ СКЛАДА И СТРУКТУРЫ БД                   ║');
    console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

    // ========================================================================
    // ЧАСТЬ 1: АНАЛИЗ СТРУКТУРЫ БАЗЫ ДАННЫХ
    // ========================================================================
    console.log('┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│  ЧАСТЬ 1: ТЕКУЩАЯ СТРУКТУРА БАЗЫ ДАННЫХ                            │');
    console.log('└─────────────────────────────────────────────────────────────────────┘\n');

    // Проверяем таблицу products
    console.log('📊 Таблица: products');
    console.log('─'.repeat(75));
    const productsSchema = await pool.query(`
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);

    productsSchema.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      console.log(`   ${col.column_name.padEnd(25)} ${col.data_type}${length} ${nullable}`);
    });

    // Проверяем таблицу brands
    console.log('\n📊 Таблица: brands');
    console.log('─'.repeat(75));
    const brandsSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'brands'
      ORDER BY ordinal_position
    `);

    if (brandsSchema.rows.length > 0) {
      brandsSchema.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
        console.log(`   ${col.column_name.padEnd(25)} ${col.data_type} ${nullable}`);
      });
    } else {
      console.log('   ⚠️  Таблица не существует');
    }

    // Проверяем таблицу product_variants
    console.log('\n📊 Таблица: product_variants');
    console.log('─'.repeat(75));
    const variantsSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'product_variants'
      ORDER BY ordinal_position
    `);

    if (variantsSchema.rows.length > 0) {
      variantsSchema.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
        console.log(`   ${col.column_name.padEnd(25)} ${col.data_type} ${nullable}`);
      });
    } else {
      console.log('   ⚠️  Таблица не существует');
    }

    // Проверяем таблицу product_colors
    console.log('\n📊 Таблица: product_colors');
    console.log('─'.repeat(75));
    const colorsSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'product_colors'
      ORDER BY ordinal_position
    `);

    if (colorsSchema.rows.length > 0) {
      colorsSchema.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
        console.log(`   ${col.column_name.padEnd(25)} ${col.data_type} ${nullable}`);
      });
    } else {
      console.log('   ⚠️  Таблица не существует');
    }

    // Текущие данные в БД
    console.log('\n📈 Текущее состояние данных:');
    console.log('─'.repeat(75));
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM products) as products_count,
        (SELECT COUNT(*) FROM product_variants) as variants_count
    `);
    console.log(`   Products: ${stats.rows[0].products_count}`);
    console.log(`   Product Variants: ${stats.rows[0].variants_count}`);

    // ========================================================================
    // ЧАСТЬ 2: ДЕТАЛЬНЫЙ АНАЛИЗ ДАННЫХ ИЗ EXCEL
    // ========================================================================
    console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│  ЧАСТЬ 2: ДЕТАЛЬНЫЙ АНАЛИЗ ДАННЫХ ИЗ EXCEL                         │');
    console.log('└─────────────────────────────────────────────────────────────────────┘\n');

    const filePath = '/Users/nurdauletakhmatov/Downloads/Склад товар.xlsx';
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets['Лист1'];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📁 Файл: Склад товар.xlsx`);
    console.log(`📊 Всего строк данных: ${data.length}`);
    console.log('─'.repeat(75));

    // Колонки в Excel
    console.log('\n📋 Колонки в Excel файле:');
    const excelColumns = Object.keys(data[0] || {});
    excelColumns.forEach((col, idx) => {
      console.log(`   ${idx + 1}. ${col}`);
    });

    // Группируем данные по товарам
    console.log('\n🔍 Анализ структуры данных:');
    console.log('─'.repeat(75));

    const productGroups = {};

    data.forEach(row => {
      const productName = row['Товар атауы'];
      const articleCode = row['Артикул Товар коды'];

      if (!productGroups[productName]) {
        productGroups[productName] = {
          name: productName,
          category: row['Категориясы'],
          variants: []
        };
      }

      productGroups[productName].variants.push({
        articleCode: articleCode,
        width: row['Өлшемі (рулон)'],
        receivedDate: row['Келген күні'],
        receivedQuantity: row['Келген саны'],
        soldQuantity: row['Шыккан саны'],
        purchasePrice: row['Сатып алу бағасы'],
        sellingPrice: row['Сату бағасы']
      });
    });

    const uniqueProducts = Object.values(productGroups).filter(p => p.name);
    console.log(`   ✓ Уникальных товаров (по названию): ${uniqueProducts.length}`);
    console.log(`   ✓ Товаров с названием: ${data.filter(r => r['Товар атауы']).length}`);
    console.log(`   ✓ Товаров без названия: ${data.filter(r => !r['Товар атауы']).length}`);

    // Анализируем категории
    const categories = [...new Set(data.map(r => r['Категориясы']).filter(Boolean))];
    console.log(`\n   📦 Уникальных категорий: ${categories.length}`);
    categories.forEach(cat => {
      const count = data.filter(r => r['Категориясы'] === cat).length;
      console.log(`      - ${cat}: ${count} записей`);
    });

    // Анализируем артикулы
    const articles = [...new Set(data.map(r => r['Артикул Товар коды']).filter(Boolean))];
    console.log(`\n   🔢 Уникальных артикулов: ${articles.length}`);
    console.log(`   🔢 Всего записей с артикулами: ${data.filter(r => r['Артикул Товар коды']).length}`);

    // Примеры товаров с несколькими вариантами (артикулами)
    console.log('\n   📊 Товары с несколькими вариантами (артикулами):');
    uniqueProducts
      .filter(p => p.variants.length > 1)
      .slice(0, 5)
      .forEach(product => {
        console.log(`\n      "${product.name}" (${product.category || 'без категории'})`);
        console.log(`         Количество вариантов: ${product.variants.length}`);
        product.variants.forEach((v, idx) => {
          console.log(`         ${idx + 1}. Артикул: ${v.articleCode}, Ширина: ${v.width}м, Кол-во: ${v.receivedQuantity}`);
        });
      });

    // Анализируем цены
    console.log('\n   💰 Анализ цен:');
    const withPurchasePrice = data.filter(r => r['Сатып алу бағасы']).length;
    const withSellingPrice = data.filter(r => r['Сату бағасы']).length;
    console.log(`      - Записей с ценой покупки: ${withPurchasePrice}`);
    console.log(`      - Записей с ценой продажи: ${withSellingPrice}`);

    // Форматы цен
    const priceFormats = {
      tenge: data.filter(r => String(r['Сатып алу бағасы'] || '').includes('тг')).length,
      dollar: data.filter(r => String(r['Сатып алу бағасы'] || '').includes('$')).length,
      number: data.filter(r => {
        const price = r['Сатып алу бағасы'];
        return price && !String(price).includes('тг') && !String(price).includes('$');
      }).length
    };
    console.log(`      - Цены в тенге: ${priceFormats.tenge}`);
    console.log(`      - Цены в долларах: ${priceFormats.dollar}`);
    console.log(`      - Цены числом: ${priceFormats.number}`);

    // ========================================================================
    // ЧАСТЬ 3: СОПОСТАВЛЕНИЕ ДАННЫХ
    // ========================================================================
    console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│  ЧАСТЬ 3: СОПОСТАВЛЕНИЕ ДАННЫХ EXCEL ↔ БД                          │');
    console.log('└─────────────────────────────────────────────────────────────────────┘\n');

    console.log('📋 Маппинг полей:\n');

    const mapping = [
      {
        excel: 'Товар атауы',
        db: 'products.name',
        note: 'Название товара (основная таблица)'
      },
      {
        excel: 'Категориясы',
        db: 'products.type',
        note: 'Требуется маппинг категорий в типы (curtain, tulle, etc.)'
      },
      {
        excel: 'Артикул Товар коды',
        db: 'product_variants.variant_code',
        note: 'Каждый артикул = отдельный вариант товара'
      },
      {
        excel: 'Өлшемі (рулон)',
        db: 'products.width ИЛИ description',
        note: 'Ширина рулона - может быть в описании или отдельное поле'
      },
      {
        excel: 'Келген саны',
        db: 'product_variants.stock_quantity',
        note: 'Количество на складе для конкретного варианта'
      },
      {
        excel: 'Сатып алу бағасы',
        db: 'products.purchase_price ИЛИ cost',
        note: 'Цена закупки (нужно конвертировать $ в тенге)'
      },
      {
        excel: 'Сату бағасы',
        db: 'products.price_per_meter',
        note: 'Цена продажи за метр'
      }
    ];

    mapping.forEach((m, idx) => {
      console.log(`   ${idx + 1}. Excel: "${m.excel}"`);
      console.log(`      ↓`);
      console.log(`      БД: ${m.db}`);
      console.log(`      📝 ${m.note}\n`);
    });

    // ========================================================================
    // ЧАСТЬ 4: ВЫЯВЛЕНИЕ ПРОБЛЕМ И ВОПРОСОВ
    // ========================================================================
    console.log('┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│  ЧАСТЬ 4: ПРОБЛЕМЫ И ВОПРОСЫ                                        │');
    console.log('└─────────────────────────────────────────────────────────────────────┘\n');

    console.log('⚠️  ВЫЯВЛЕННЫЕ ПРОБЛЕМЫ:\n');

    console.log('   1. СТРУКТУРА ДАННЫХ В EXCEL:');
    console.log('      • Один товар может иметь несколько строк (разные артикулы)');
    console.log('      • Не все строки имеют название товара (повторяющиеся артикулы)');
    console.log('      • Категории написаны на казахском, нужен маппинг на английские типы\n');

    console.log('   2. ЦЕНЫ:');
    console.log('      • Цены в разных валютах (тенге и доллары)');
    console.log('      • Нужна конвертация долларов в тенге');
    console.log('      • Разные форматы (с "тг", с "$", просто числа)\n');

    console.log('   3. КОЛИЧЕСТВО:');
    console.log('      • Формат "70,3м" (с единицами измерения)');
    console.log('      • Разделитель - запятая вместо точки');
    console.log('      • Нужна нормализация\n');

    console.log('   4. СТРУКТУРА БД:');
    console.log('      • Нужно проверить наличие поля width в products');
    console.log('      • Нужно проверить наличие поля purchase_price');
    console.log('      • Определить использование product_variants vs product_colors\n');

    // ========================================================================
    // ЧАСТЬ 5: ДЕТАЛЬНЫЙ ПРИМЕР ДАННЫХ
    // ========================================================================
    console.log('┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│  ЧАСТЬ 5: ДЕТАЛЬНЫЕ ПРИМЕРЫ ДАННЫХ                                  │');
    console.log('└─────────────────────────────────────────────────────────────────────┘\n');

    console.log('📦 Пример 1: Товар с одним вариантом\n');
    const singleVariant = uniqueProducts.find(p => p.variants.length === 1 && p.name);
    if (singleVariant) {
      console.log(`   Название: "${singleVariant.name}"`);
      console.log(`   Категория: "${singleVariant.category}"`);
      console.log(`   Артикул: ${singleVariant.variants[0].articleCode}`);
      console.log(`   Ширина рулона: ${singleVariant.variants[0].width}м`);
      console.log(`   Количество: ${singleVariant.variants[0].receivedQuantity}`);
      console.log(`   Цена покупки: ${singleVariant.variants[0].purchasePrice}`);
      console.log(`   Цена продажи: ${singleVariant.variants[0].sellingPrice}\n`);
    }

    console.log('📦 Пример 2: Товар с несколькими вариантами\n');
    const multiVariant = uniqueProducts.find(p => p.variants.length > 2 && p.name);
    if (multiVariant) {
      console.log(`   Название: "${multiVariant.name}"`);
      console.log(`   Категория: "${multiVariant.category}"`);
      console.log(`   Количество вариантов: ${multiVariant.variants.length}\n`);
      multiVariant.variants.forEach((v, idx) => {
        console.log(`   Вариант ${idx + 1}:`);
        console.log(`      Артикул: ${v.articleCode}`);
        console.log(`      Ширина: ${v.width}м`);
        console.log(`      Количество: ${v.receivedQuantity}`);
        console.log(`      Цена продажи: ${v.sellingPrice}\n`);
      });
    }

    // ========================================================================
    // ЧАСТЬ 6: РЕКОМЕНДАЦИИ
    // ========================================================================
    console.log('┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│  ЧАСТЬ 6: РЕКОМЕНДАЦИИ ПО ИМПОРТУ                                   │');
    console.log('└─────────────────────────────────────────────────────────────────────┘\n');

    console.log('✅ РЕКОМЕНДУЕМАЯ СТРАТЕГИЯ ИМПОРТА:\n');

    console.log('   1. ПОДГОТОВКА БД:');
    console.log('      • Добавить поля width, purchase_price в таблицу products');
    console.log('      • Убедиться что product_variants готова к использованию\n');

    console.log('   2. ГРУППИРОВКА ДАННЫХ:');
    console.log('      • Сгруппировать строки Excel по "Товар атауы"');
    console.log('      • Первая строка товара → products (основная таблица)');
    console.log('      • Каждый артикул → product_variants (варианты)\n');

    console.log('   3. ОБРАБОТКА ЦЕН:');
    console.log('      • Создать функцию парсинга цен (убрать "тг", "$")');
    console.log('      • Конвертировать доллары в тенге (текущий курс ~475 тг)');
    console.log('      • Нормализовать формат чисел\n');

    console.log('   4. ОБРАБОТКА КОЛИЧЕСТВА:');
    console.log('      • Убрать "м" из количества');
    console.log('      • Заменить запятую на точку');
    console.log('      • Преобразовать в число\n');

    console.log('   5. МАППИНГ КАТЕГОРИЙ:');
    console.log('      • "партера" / "Партера" → "curtain"');
    console.log('      • "тюль" / "Перя тюль" → "tulle"');
    console.log('      • "жакард" → можно добавить в description или тип "jacquard"\n');

    console.log('═'.repeat(75));
    console.log('✅ АНАЛИЗ ЗАВЕРШЕН!');
    console.log('═'.repeat(75));

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при анализе:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

deepAnalysis();
