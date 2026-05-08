import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

// Database configuration
export const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      user: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      ssl: process.env.DATABASE_SSL === 'true' ? {
        rejectUnauthorized: false
      } : false,
      max: 20, // максимум подключений в пуле
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

// Pool для подключения к PostgreSQL
export const pool = new Pool(dbConfig);

// Тест подключения
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  // Do not exit — pool will automatically reconnect on the next query
});

export default pool;
