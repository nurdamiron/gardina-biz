import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function addDesigners() {
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

    // Hash password
    const passwordHash = await bcrypt.hash('qwerty', 10);

    // Add Akbota
    const akbotaResult = await client.query(
      `INSERT INTO users (name, phone, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (phone) DO UPDATE
       SET password_hash = $4
       RETURNING id, name, phone`,
      ['Akbota', 'akbota', 'akbota@gardina.kz', passwordHash, 'designer', true]
    );
    console.log('✅ Designer added:', akbotaResult.rows[0]);

    // Add Ultu
    const ultuResult = await client.query(
      `INSERT INTO users (name, phone, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (phone) DO UPDATE
       SET password_hash = $4
       RETURNING id, name, phone`,
      ['Ultu', 'ultu', 'ultu@gardina.kz', passwordHash, 'designer', true]
    );
    console.log('✅ Designer added:', ultuResult.rows[0]);

    console.log('\n📋 Login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━');
    console.log('Designer 1:');
    console.log('  Phone/Login: akbota');
    console.log('  Password: qwerty');
    console.log('');
    console.log('Designer 2:');
    console.log('  Phone/Login: ultu');
    console.log('  Password: qwerty');
    console.log('━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error adding designers:', error);
    throw error;
  } finally {
    await client.end();
  }
}

addDesigners()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
