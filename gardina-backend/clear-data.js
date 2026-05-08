import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function clearAllData() {
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

    console.log('🗑️  Deleting all data...');

    // Delete in order to respect foreign key constraints
    await client.query('DELETE FROM chat_messages');
    await client.query('DELETE FROM deal_events');
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM photos');
    await client.query('DELETE FROM room_items');
    await client.query('DELETE FROM rooms');
    await client.query('DELETE FROM installations');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM proposals');
    await client.query('DELETE FROM measurement_windows');
    await client.query('DELETE FROM measurements');
    await client.query('DELETE FROM deals');
    await client.query('DELETE FROM clients');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM service_rates');
    await client.query('DELETE FROM curtains');

    // Keep admin user, delete others
    await client.query("DELETE FROM users WHERE role != 'admin'");

    console.log('✅ All data deleted successfully!');
    console.log('ℹ️  Admin user was preserved');
  } catch (error) {
    console.error('❌ Error deleting data:', error);
    throw error;
  } finally {
    await client.end();
  }
}

clearAllData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
