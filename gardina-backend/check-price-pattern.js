import XLSX from 'xlsx';

async function checkPricePattern() {
  try {
    console.log('╔════════════════════════════════════════════════════════════════════════╗');
    console.log('║   ПРОВЕРКА ГИПОТЕЗЫ: ЦЕНА ЗА ТОВАР → ЦЕНА ДЛЯ ВСЕХ ЦВЕТОВ             ║');
    console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

    const filePath = '/Users/nurdauletakhmatov/Downloads/Склад товар.xlsx';
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets['Лист1'];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Группируем данные по товарам
    const productsByName = {};
    let currentProduct = null;

    data.forEach((row, idx) => {
      const productName = row['Товар атауы'];
      const articleCode = row['Артикул Товар коды'];
      const category = row['Категориясы'];

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

      if (currentProduct && articleCode) {
        productsByName[currentProduct].colors.push({
          colorCode: articleCode,
          purchasePrice: row['Сатып алу бағасы'],
          sellingPrice: row['Сату бағасы'],
          quantity: row['Келген саны'],
          rowNumber: idx + 2
        });
      }
    });

    const products = Object.values(productsByName);

    console.log('🔍 АНАЛИЗ ПАТТЕРНА ЦЕН:\n');
    console.log(`Всего товаров: ${products.length}\n`);

    // Проверяем паттерн цен
    let productsWithPriceOnlyInFirstColor = 0;
    let productsWithPriceInAllColors = 0;
    let productsWithPriceInSomeColors = 0;
    let productsWithoutPrices = 0;

    console.log('═'.repeat(75));
    console.log('ТОВАРЫ С НЕСКОЛЬКИМИ ЦВЕТАМИ:\n');

    products
      .filter(p => p.colors.length > 1)
      .forEach(product => {
        const colorsWithPrice = product.colors.filter(c => c.purchasePrice || c.sellingPrice);
        const hasFirstColorPrice = product.colors[0].purchasePrice || product.colors[0].sellingPrice;

        let pattern = '';
        if (colorsWithPrice.length === 0) {
          pattern = '❌ НЕТ ЦЕН';
          productsWithoutPrices++;
        } else if (colorsWithPrice.length === 1 && hasFirstColorPrice) {
          pattern = '✅ ЦЕНА ТОЛЬКО В ПЕРВОМ ЦВЕТЕ';
          productsWithPriceOnlyInFirstColor++;
        } else if (colorsWithPrice.length === product.colors.length) {
          pattern = '📊 ЦЕНЫ ВО ВСЕХ ЦВЕТАХ';
          productsWithPriceInAllColors++;
        } else {
          pattern = '⚠️  ЦЕНЫ В НЕКОТОРЫХ ЦВЕТАХ';
          productsWithPriceInSomeColors++;
        }

        console.log(`\n📦 "${product.name}" (${product.colors.length} цветов)`);
        console.log(`   ${pattern}`);
        console.log(`   Цены есть в: ${colorsWithPrice.length}/${product.colors.length} цветов`);

        // Показываем первые 3 цвета с ценами
        product.colors.slice(0, 3).forEach((color, idx) => {
          const priceInfo = color.purchasePrice || color.sellingPrice
            ? `💰 Покупка: ${color.purchasePrice || '-'}, Продажа: ${color.sellingPrice || '-'}`
            : '💸 Нет цены';

          console.log(`   Цвет ${idx + 1} (код ${color.colorCode}): ${priceInfo}`);
        });

        // Если больше 3 цветов, показываем сколько еще
        if (product.colors.length > 3) {
          const remainingWithPrice = product.colors.slice(3).filter(c => c.purchasePrice || c.sellingPrice).length;
          const remainingTotal = product.colors.length - 3;
          console.log(`   ... еще ${remainingTotal} цветов (${remainingWithPrice} с ценами)`);
        }
      });

    // Статистика
    console.log('\n' + '═'.repeat(75));
    console.log('\n📊 СТАТИСТИКА ПАТТЕРНОВ ЦЕН:\n');

    const multiColorProducts = products.filter(p => p.colors.length > 1).length;

    console.log(`Товары с несколькими цветами: ${multiColorProducts}`);
    console.log(`  ✅ Цена только в первом цвете: ${productsWithPriceOnlyInFirstColor} (${Math.round(productsWithPriceOnlyInFirstColor/multiColorProducts*100)}%)`);
    console.log(`  📊 Цены во всех цветах: ${productsWithPriceInAllColors} (${Math.round(productsWithPriceInAllColors/multiColorProducts*100)}%)`);
    console.log(`  ⚠️  Цены в некоторых цветах: ${productsWithPriceInSomeColors} (${Math.round(productsWithPriceInSomeColors/multiColorProducts*100)}%)`);
    console.log(`  ❌ Нет цен вообще: ${productsWithoutPrices} (${Math.round(productsWithoutPrices/multiColorProducts*100)}%)`);

    // Вывод
    console.log('\n' + '═'.repeat(75));
    console.log('\n💡 ВЫВОД:\n');

    if (productsWithPriceOnlyInFirstColor > multiColorProducts * 0.5) {
      console.log('✅ ГИПОТЕЗА ПОДТВЕРЖДЕНА!');
      console.log('   Большинство товаров имеют цену только в первой строке (первом цвете).');
      console.log('   Это означает что цена применяется ко всем цветам товара.\n');
      console.log('📝 РЕКОМЕНДАЦИЯ:');
      console.log('   При импорте использовать цену из первого цвета для всего товара.');
      console.log('   Сохранять цену в таблице products, а не в product_variants.');
    } else {
      console.log('❓ ГИПОТЕЗА ЧАСТИЧНО ПОДТВЕРЖДЕНА');
      console.log('   Паттерн смешанный - нужно индивидуально проверять каждый товар.');
    }

    // Проверка на единообразие цен в товарах где есть цены в нескольких цветах
    console.log('\n' + '═'.repeat(75));
    console.log('\n🔎 ПРОВЕРКА: ОДИНАКОВЫЕ ЛИ ЦЕНЫ У РАЗНЫХ ЦВЕТОВ ОДНОГО ТОВАРА?\n');

    products
      .filter(p => p.colors.length > 1)
      .filter(p => p.colors.filter(c => c.purchasePrice || c.sellingPrice).length > 1)
      .slice(0, 5)
      .forEach(product => {
        console.log(`\n📦 "${product.name}"`);
        const pricesWithPurchase = product.colors
          .filter(c => c.purchasePrice)
          .map(c => c.purchasePrice);

        const pricesWithSelling = product.colors
          .filter(c => c.sellingPrice)
          .map(c => c.sellingPrice);

        const uniquePurchasePrices = [...new Set(pricesWithPurchase)];
        const uniqueSellingPrices = [...new Set(pricesWithSelling)];

        if (uniquePurchasePrices.length <= 1 && uniqueSellingPrices.length <= 1) {
          console.log('   ✅ Цены одинаковые у всех цветов');
        } else {
          console.log('   ⚠️  Цены РАЗНЫЕ у разных цветов!');
          console.log(`   Цены покупки: ${uniquePurchasePrices.join(', ')}`);
          console.log(`   Цены продажи: ${uniqueSellingPrices.join(', ')}`);
        }
      });

    console.log('\n' + '═'.repeat(75));

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkPricePattern();
