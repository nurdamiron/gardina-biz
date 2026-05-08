import XLSX from 'xlsx';
import pool from './src/infrastructure/database/config.js';

async function deepAnalysisV2() {
  try {
    console.log('╔════════════════════════════════════════════════════════════════════════╗');
    console.log('║   ГЛУБОКИЙ АНАЛИЗ v2: АРТИКУЛЫ = КОДЫ ЦВЕТОВ                           ║');
    console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

    const filePath = '/Users/nurdauletakhmatov/Downloads/Склад товар.xlsx';
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets['Лист1'];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log('┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│  НОВОЕ ПОНИМАНИЕ СТРУКТУРЫ ДАННЫХ                                   │');
    console.log('└─────────────────────────────────────────────────────────────────────┘\n');

    console.log('💡 КЛЮЧЕВОЕ ПОНИМАНИЕ:');
    console.log('   "Артикул Товар коды" = КОД ЦВЕТА одного товара\n');
    console.log('   Например, товар "Бархат" может иметь:');
    console.log('   - Артикул 19 = один цвет');
    console.log('   - Артикул 46 = другой цвет');
    console.log('   - Артикул 45 = третий цвет\n');

    console.log('═'.repeat(75) + '\n');

    // Группируем данные правильно
    console.log('🔍 ПРАВИЛЬНАЯ ГРУППИРОВКА ДАННЫХ:\n');

    const productsByName = {};
    let currentProduct = null;

    data.forEach((row, idx) => {
      const productName = row['Товар атауы'];
      const articleCode = row['Артикул Товар коды'];
      const category = row['Категориясы'];

      // Если есть название товара - это начало нового товара
      if (productName) {
        currentProduct = productName;
        if (!productsByName[productName]) {
          productsByName[productName] = {
            name: productName,
            category: category,
            colors: []  // Теперь это ЦВЕТА, а не варианты
          };
        }
      }

      // Добавляем артикул (цвет) к текущему товару
      if (currentProduct && articleCode) {
        productsByName[currentProduct].colors.push({
          colorCode: articleCode,
          width: row['Өлшемі (рулон)'],
          receivedDate: row['Келген күні'],
          quantity: row['Келген саны'],
          purchasePrice: row['Сатып алу бағасы'],
          sellingPrice: row['Сату бағасы'],
          rowIndex: idx + 2  // +2 потому что индекс с 0 и есть заголовок
        });
      }
    });

    const products = Object.values(productsByName);

    console.log(`✓ Всего уникальных товаров: ${products.length}`);
    console.log(`✓ Всего цветовых вариантов: ${data.filter(r => r['Артикул Товар коды']).length}\n`);

    // Статистика по цветам
    console.log('📊 СТАТИСТИКА ПО ЦВЕТАМ:\n');
    const colorStats = products.map(p => ({
      name: p.name,
      colorsCount: p.colors.length,
      category: p.category
    })).sort((a, b) => b.colorsCount - a.colorsCount);

    console.log('   Товары с наибольшим количеством цветов:');
    colorStats.slice(0, 10).forEach((p, idx) => {
      console.log(`   ${idx + 1}. "${p.name}" - ${p.colorsCount} цветов (${p.category || 'без категории'})`);
    });

    console.log('\n   Товары с одним цветом:');
    const singleColor = colorStats.filter(p => p.colorsCount === 1);
    console.log(`   Всего: ${singleColor.length} товаров\n`);

    // Детальные примеры
    console.log('═'.repeat(75));
    console.log('\n📦 ДЕТАЛЬНЫЕ ПРИМЕРЫ:\n');

    // Пример 1: Товар с несколькими цветами
    const multiColor = products.find(p => p.colors.length > 2);
    if (multiColor) {
      console.log(`1️⃣  ТОВАР С НЕСКОЛЬКИМИ ЦВЕТАМИ:\n`);
      console.log(`   Название: "${multiColor.name}"`);
      console.log(`   Категория: ${multiColor.category || 'не указана'}`);
      console.log(`   Количество цветов: ${multiColor.colors.length}\n`);

      multiColor.colors.forEach((color, idx) => {
        console.log(`   Цвет ${idx + 1}:`);
        console.log(`      Код цвета (артикул): ${color.colorCode}`);
        console.log(`      Ширина рулона: ${color.width} м`);
        console.log(`      Количество на складе: ${color.quantity}`);
        console.log(`      Цена покупки: ${color.purchasePrice}`);
        console.log(`      Цена продажи: ${color.sellingPrice}`);
        console.log(`      (строка ${color.rowIndex} в Excel)\n`);
      });
    }

    // Пример 2: Товар с одним цветом
    const singleColorProduct = products.find(p => p.colors.length === 1);
    if (singleColorProduct) {
      console.log(`2️⃣  ТОВАР С ОДНИМ ЦВЕТОМ:\n`);
      console.log(`   Название: "${singleColorProduct.name}"`);
      console.log(`   Категория: ${singleColorProduct.category || 'не указана'}`);
      console.log(`   Код цвета: ${singleColorProduct.colors[0].colorCode}`);
      console.log(`   Количество: ${singleColorProduct.colors[0].quantity}`);
      console.log(`   Цена продажи: ${singleColorProduct.colors[0].sellingPrice}\n`);
    }

    // Анализ структуры БД
    console.log('═'.repeat(75));
    console.log('\n🗄️  СОПОСТАВЛЕНИЕ С БАЗОЙ ДАННЫХ:\n');

    console.log('📊 Текущая структура БД:');
    const dbStructure = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);

    const hasWidthCm = dbStructure.rows.some(r => r.column_name === 'width_cm');
    const hasCostPrice = dbStructure.rows.some(r => r.column_name === 'cost_price');

    console.log(`   ✓ Таблица products существует`);
    console.log(`   ${hasWidthCm ? '✓' : '✗'} Поле width_cm ${hasWidthCm ? 'есть' : 'отсутствует'}`);
    console.log(`   ${hasCostPrice ? '✓' : '✗'} Поле cost_price ${hasCostPrice ? 'есть' : 'отсутствует'}`);

    const variantsCheck = await pool.query(`
      SELECT COUNT(*) FROM information_schema.tables
      WHERE table_name = 'product_variants'
    `);
    const hasVariants = variantsCheck.rows[0].count > 0;
    console.log(`   ${hasVariants ? '✓' : '✗'} Таблица product_variants ${hasVariants ? 'существует' : 'отсутствует'}\n`);

    // Новый маппинг
    console.log('═'.repeat(75));
    console.log('\n📋 ПРАВИЛЬНЫЙ МАППИНГ ДАННЫХ:\n');

    console.log('ТАБЛИЦА products (основной товар):');
    console.log('├─ name           ← "Товар атауы" (Бархат, Опера, и т.д.)');
    console.log('├─ type           ← "Категориясы" (после маппинга)');
    console.log('├─ description    ← можно добавить доп. инфо');
    console.log('├─ width_cm       ← "Өлшемі (рулон)" × 100 (метры в см)');
    console.log('├─ cost_price     ← "Сатып алу бағасы" (после конвертации)');
    console.log('└─ price_per_meter← "Сату бағасы" (средняя по всем цветам)\n');

    console.log('ТАБЛИЦА product_variants (цвета товара):');
    console.log('├─ product_id     ← связь с products');
    console.log('├─ variant_code   ← "Артикул Товар коды" (19, 46, 45)');
    console.log('├─ variant_name   ← можно оставить пустым или "Цвет 1", "Цвет 2"');
    console.log('├─ stock_quantity ← "Келген саны" (после парсинга)');
    console.log('├─ is_default     ← true для первого цвета');
    console.log('└─ is_available   ← true если есть на складе\n');

    // МАППИНГ КАТЕГОРИЙ
    console.log('═'.repeat(75));
    console.log('\n🏷️  МАППИНГ КАТЕГОРИЙ:\n');

    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    const categoryMapping = {
      'партера': 'curtain',
      'Партера': 'curtain',
      'Партера жакард': 'curtain',
      'Тас жакард партера': 'curtain',
      'Тассыз жакард': 'curtain',
      'Песок жакард': 'curtain',
      'Efec cadife': 'curtain',
      'Перя тюль': 'tulle',
      'Айвари тюль': 'tulle',
      'Тюль': 'tulle',
      'тюль': 'tulle',
      '???': 'other',
      '??': 'other'
    };

    console.log('Категория в Excel → Тип в БД:\n');
    categories.forEach(cat => {
      const count = products.filter(p => p.category === cat).length;
      const mapped = categoryMapping[cat] || 'unknown';
      const icon = mapped === 'curtain' ? '🪟' : mapped === 'tulle' ? '🌫️' : '❓';
      console.log(`   ${icon} "${cat}" → "${mapped}" (${count} товаров)`);
    });

    // СТРАТЕГИЯ ИМПОРТА
    console.log('\n═'.repeat(75));
    console.log('\n✅ ФИНАЛЬНАЯ СТРАТЕГИЯ ИМПОРТА:\n');

    console.log('ШАГ 1: Подготовка данных');
    console.log('   • Сгруппировать строки по "Товар атауы"');
    console.log('   • Для каждого товара собрать все его цвета (артикулы)\n');

    console.log('ШАГ 2: Создание товара (products)');
    console.log('   • Взять название и категорию из первой строки товара');
    console.log('   • Ширина - из первого цвета (обычно одинаковая для всех)');
    console.log('   • Цена продажи - средняя или из первого цвета\n');

    console.log('ШАГ 3: Создание цветов (product_variants)');
    console.log('   • Для каждого артикула создать variant');
    console.log('   • variant_code = артикул');
    console.log('   • stock_quantity = количество на складе');
    console.log('   • Первый цвет пометить как is_default = true\n');

    console.log('ШАГ 4: Обработка данных');
    console.log('   • Парсинг количества: "70,3м" → 70.3');
    console.log('   • Парсинг цены: "4,2$" → конвертировать в тенге');
    console.log('   • Ширина: "2" → 200 см (если в метрах)\n');

    // Пример финальной структуры
    console.log('═'.repeat(75));
    console.log('\n📝 ПРИМЕР ФИНАЛЬНОЙ СТРУКТУРЫ В БД:\n');

    if (multiColor) {
      console.log(`Товар: "${multiColor.name}"`);
      console.log('─'.repeat(75));
      console.log('\nТаблица products:');
      console.log('{');
      console.log(`  id: "uuid-1",`);
      console.log(`  name: "${multiColor.name}",`);
      console.log(`  type: "${categoryMapping[multiColor.category] || 'curtain'}",`);
      console.log(`  width_cm: ${parseInt(multiColor.colors[0].width) * 100},`);
      console.log(`  price_per_meter: ${multiColor.colors[0].sellingPrice},`);
      console.log(`  cost_price: ${multiColor.colors[0].purchasePrice},`);
      console.log(`  is_available: true`);
      console.log('}\n');

      console.log('Таблица product_variants:');
      multiColor.colors.slice(0, 3).forEach((color, idx) => {
        console.log(`[${idx + 1}] {`);
        console.log(`  product_id: "uuid-1",`);
        console.log(`  variant_code: "${color.colorCode}",`);
        console.log(`  variant_name: "Цвет ${idx + 1}",`);
        console.log(`  stock_quantity: ${parseFloat(String(color.quantity).replace(',', '.').replace('м', '')) || 0},`);
        console.log(`  is_default: ${idx === 0},`);
        console.log(`  is_available: true`);
        console.log('}\n');
      });
    }

    console.log('═'.repeat(75));
    console.log('✅ АНАЛИЗ ЗАВЕРШЕН!\n');
    console.log('Теперь можно начинать импорт с правильным пониманием структуры.');
    console.log('═'.repeat(75));

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

deepAnalysisV2();
