import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const products = [
  // ТЮЛЬ (Tulle)
  {
    code: 'TL-001',
    name: 'Тор перде ақ',
    type: 'tulle',
    unit: 'm',
    brand: 'Турция',
    pricePerMeter: 3500,
    costPrice: 2000,
    widthCm: 300,
    imageUrl: null,
    isAvailable: true
  },
  {
    code: 'TL-002',
    name: 'Тор перде кремді',
    type: 'tulle',
    unit: 'm',
    brand: 'Турция',
    pricePerMeter: 3500,
    costPrice: 2000,
    widthCm: 300,
    imageUrl: null,
    isAvailable: true
  },
  {
    code: 'TL-003',
    name: 'Тор перде көк',
    type: 'tulle',
    unit: 'm',
    brand: 'Қытай',
    pricePerMeter: 2800,
    costPrice: 1500,
    widthCm: 280,
    imageUrl: null,
    isAvailable: true
  },

  // ПЕРДЕ (Curtains)
  {
    code: 'PR-001',
    name: 'Blackout Royal қара',
    type: 'curtain',
    unit: 'm',
    brand: 'Турция',
    pricePerMeter: 8500,
    costPrice: 5000,
    widthCm: 280,
    imageUrl: null,
    isAvailable: true
  },
  {
    code: 'PR-002',
    name: 'Blackout Royal көк',
    type: 'curtain',
    unit: 'm',
    brand: 'Турция',
    pricePerMeter: 8500,
    costPrice: 5000,
    widthCm: 280,
    imageUrl: null,
    isAvailable: true
  },
  {
    code: 'PR-003',
    name: 'Velvet Soft қоңыр',
    type: 'curtain',
    unit: 'm',
    brand: 'Түркия',
    pricePerMeter: 6500,
    costPrice: 3800,
    widthCm: 280,
    imageUrl: null,
    isAvailable: true
  },
  {
    code: 'PR-004',
    name: 'Canvas Linen бежді',
    type: 'curtain',
    unit: 'm',
    brand: 'Турция',
    pricePerMeter: 7200,
    costPrice: 4200,
    widthCm: 300,
    imageUrl: null,
    isAvailable: true
  },
  {
    code: 'PR-005',
    name: 'Жаккард алтын',
    type: 'curtain',
    unit: 'm',
    brand: 'Италия',
    pricePerMeter: 12000,
    costPrice: 7500,
    widthCm: 280,
    imageUrl: null,
    isAvailable: true
  },

  // КАРНИЗ (Cornices)
  {
    code: 'KR-001',
    name: 'Карниз алюминий 2м',
    type: 'cornice',
    unit: 'pcs',
    brand: 'Қазақстан',
    pricePerMeter: 8000,
    costPrice: 4500,
    widthCm: 0,
    imageUrl: null,
    isAvailable: true
  },
  {
    code: 'KR-002',
    name: 'Карниз пластик 3м',
    type: 'cornice',
    unit: 'pcs',
    brand: 'Ресей',
    pricePerMeter: 5000,
    costPrice: 2800,
    widthCm: 0,
    imageUrl: null,
    isAvailable: true
  },

  // ЛЕНТА/ТАСПА (Tape) - покупается рулонами
  {
    code: 'TAPE-001',
    name: 'Шторлық таспа стандарт',
    type: 'accessory',
    unit: 'roll',
    brand: 'Қытай',
    pricePerMeter: 450,
    costPrice: 250,
    widthCm: 0,
    imageUrl: null,
    isAvailable: true
  },
  {
    code: 'TAPE-002',
    name: 'Шторлық таспа премиум',
    type: 'accessory',
    unit: 'roll',
    brand: 'Турция',
    pricePerMeter: 650,
    costPrice: 380,
    widthCm: 0,
    imageUrl: null,
    isAvailable: true
  },

  // КРЮЧКИ (Hooks) - покупаются упаковками
  {
    code: 'HOOK-001',
    name: 'Ілгек пластик (100дн)',
    type: 'accessory',
    unit: 'pack',
    brand: 'Қытай',
    pricePerMeter: 25,
    costPrice: 15,
    widthCm: 0,
    imageUrl: null,
    isAvailable: true
  },
  {
    code: 'HOOK-002',
    name: 'Ілгек металл (50дн)',
    type: 'accessory',
    unit: 'pack',
    brand: 'Ресей',
    pricePerMeter: 40,
    costPrice: 22,
    widthCm: 0,
    imageUrl: null,
    isAvailable: true
  },

  // АКСЕССУАРЫ
  {
    code: 'ACC-001',
    name: 'Магнит ұстағыш',
    type: 'accessory',
    unit: 'pcs',
    brand: 'Қытай',
    pricePerMeter: 800,
    costPrice: 450,
    widthCm: 0,
    imageUrl: null,
    isAvailable: true
  },
  {
    code: 'ACC-002',
    name: 'Перде кілті',
    type: 'accessory',
    unit: 'pcs',
    brand: 'Қытай',
    pricePerMeter: 500,
    costPrice: 280,
    widthCm: 0,
    imageUrl: null,
    isAvailable: true
  },
];

async function seedProducts() {
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
    await client.connect();
    console.log('✅ Connected to database');

    let addedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      try {
        await client.query(
          `INSERT INTO products (code, name, type, unit, brand, price_per_meter, cost_price, width_cm, image_url, is_available)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (code) DO NOTHING`,
          [
            product.code,
            product.name,
            product.type,
            product.unit,
            product.brand,
            product.pricePerMeter,
            product.costPrice,
            product.widthCm,
            product.imageUrl,
            product.isAvailable
          ]
        );
        addedCount++;
        console.log(`✅ Added: ${product.code} - ${product.name}`);
      } catch (err) {
        skippedCount++;
        console.log(`⏭️  Skipped: ${product.code} (already exists or error)`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Added: ${addedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${products.length}\n`);

  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seedProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
