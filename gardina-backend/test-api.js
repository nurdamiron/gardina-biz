import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Test credentials
const TEST_USER = {
  phone: 'admin',
  password: 'qwerty'
};

let authToken = '';

/**
 * Test API endpoints
 */
async function testAPI() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                   ТЕСТИРОВАНИЕ API                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Login
    console.log('1️⃣  ЛОГИН...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    authToken = loginRes.data.data.accessToken;
    console.log(`   ✓ Токен получен: ${authToken.substring(0, 20)}...\n`);

    const headers = { Authorization: `Bearer ${authToken}` };

    // 2. Get all products
    console.log('2️⃣  ПОЛУЧЕНИЕ ВСЕХ ТОВАРОВ (первые 5)...');
    const productsRes = await axios.get(`${API_URL}/catalog/products/search?code=`, { headers });
    const products = productsRes.data.data;
    console.log(`   ✓ Найдено товаров: ${products.length}`);

    products.slice(0, 5).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} - ${p.pricePerMeter} ₸/м (${p.type})`);
    });
    console.log();

    // 3. Get product by ID with variants
    if (products.length > 0) {
      const firstProduct = products[0];
      console.log(`3️⃣  ПОЛУЧЕНИЕ ТОВАРА С ВАРИАНТАМИ: "${firstProduct.name}"...`);

      const productRes = await axios.get(`${API_URL}/catalog/products/${firstProduct.id}`, { headers });
      const product = productRes.data.data;

      console.log(`   ✓ Товар: ${product.name}`);
      console.log(`   ✓ Цена: ${product.pricePerMeter} ₸/м`);
      console.log(`   ✓ Ширина: ${product.widthCm} см`);
      console.log(`   ✓ Вариантов: ${product.variants ? product.variants.length : 0}`);

      if (product.variants && product.variants.length > 0) {
        console.log(`   \n   🎨 ВАРИАНТЫ (первые 5):`);
        product.variants.slice(0, 5).forEach((v, i) => {
          console.log(`      ${i + 1}. Код: ${v.variantCode} - ${v.stockQuantity} м ${v.isDefault ? '⭐' : ''}`);
        });
      } else {
        console.log('   ⚠️  Нет вариантов');
      }
      console.log();

      // 4. Search by variant code
      if (product.variants && product.variants.length > 0) {
        const testCode = product.variants[0].variantCode;
        console.log(`4️⃣  ПОИСК ПО КОДУ ВАРИАНТА: "${testCode}"...`);

        const searchRes = await axios.get(`${API_URL}/catalog/products/search-by-code?code=${testCode}`, { headers });
        const searchResults = searchRes.data.data;

        console.log(`   ✓ Найдено товаров с кодом "${testCode}": ${searchResults.length}`);
        searchResults.forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.name} - Код: ${r.matchedVariant.variantCode} (${r.matchedVariant.stockQuantity} м)`);
        });
        console.log();
      }

      // 5. Get variants directly
      console.log(`5️⃣  ПОЛУЧЕНИЕ ВСЕХ ВАРИАНТОВ ТОВАРА: "${firstProduct.name}"...`);
      const variantsRes = await axios.get(`${API_URL}/catalog/products/${firstProduct.id}/variants`, { headers });
      const variants = variantsRes.data.data;

      console.log(`   ✓ Всего вариантов: ${variants.length}`);
      console.log(`   📊 Общее количество на складе: ${variants.reduce((sum, v) => sum + parseFloat(v.stock_quantity || 0), 0).toFixed(1)} м`);
      console.log();
    }

    // 6. Statistics
    console.log('═'.repeat(65));
    console.log('\n📊 СТАТИСТИКА:\n');

    // Get products with most variants
    console.log('🏆 ТОП-5 ТОВАРОВ ПО КОЛИЧЕСТВУ ЦВЕТОВ:\n');

    const allProductsDetailed = [];
    for (let i = 0; i < Math.min(10, products.length); i++) {
      const p = products[i];
      const detailRes = await axios.get(`${API_URL}/catalog/products/${p.id}`, { headers });
      const detail = detailRes.data.data;
      allProductsDetailed.push({
        name: detail.name,
        variantsCount: detail.variants ? detail.variants.length : 0,
        totalStock: detail.variants ? detail.variants.reduce((sum, v) => sum + parseFloat(v.stockQuantity || 0), 0) : 0
      });
    }

    allProductsDetailed
      .sort((a, b) => b.variantsCount - a.variantsCount)
      .slice(0, 5)
      .forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name}`);
        console.log(`      Цветов: ${p.variantsCount}`);
        console.log(`      На складе: ${p.totalStock.toFixed(1)} м\n`);
      });

    console.log('═'.repeat(65));
    console.log('\n✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!\n');

  } catch (error) {
    console.error('\n❌ ОШИБКА:', error.message);
    if (error.response) {
      console.error('   Статус:', error.response.status);
      console.error('   Данные:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests
testAPI();
