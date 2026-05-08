import pool from '../config.js';

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Adding columns to measurement_windows...');
    await client.query(`
      ALTER TABLE measurement_windows 
      ADD COLUMN IF NOT EXISTS fabric_code TEXT,
      ADD COLUMN IF NOT EXISTS fabric_brand TEXT,
      ADD COLUMN IF NOT EXISTS design_photos JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS price_breakdown JSONB DEFAULT '{}';
    `);

    console.log('Adding delivery_cost to measurements...');
    await client.query(`
      ALTER TABLE measurements 
      ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(10, 2) DEFAULT 0;
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    client.release();
    process.exit();
  }
};

migrate();
