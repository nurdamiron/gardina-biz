import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pg from 'pg';

// Load production env
dotenv.config({ path: '.env.production' });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: { rejectUnauthorized: false },
});

async function resetUsers() {
  try {
    console.log('Connecting to database...');
    console.log(`Host: ${process.env.DATABASE_HOST}`);
    console.log(`Database: ${process.env.DATABASE_NAME}`);

    // Delete related data first (proposals has NOT NULL designer_id)
    console.log('\n🗑️  Clearing related data...');

    // Delete notification-related tables
    await pool.query('DELETE FROM notification_logs');
    await pool.query('DELETE FROM notifications');
    await pool.query('DELETE FROM push_subscriptions');
    await pool.query('DELETE FROM user_notification_preferences');

    // Delete proposals (has NOT NULL designer_id)
    await pool.query('DELETE FROM proposals');
    console.log('  - proposals deleted');

    // Set nullable foreign keys to NULL
    await pool.query('UPDATE deals SET designer_id = NULL WHERE designer_id IS NOT NULL');
    await pool.query('UPDATE measurements SET designer_id = NULL WHERE designer_id IS NOT NULL');
    await pool.query('UPDATE clients SET created_by = NULL WHERE created_by IS NOT NULL');
    await pool.query('UPDATE deal_events SET created_by = NULL WHERE created_by IS NOT NULL');
    await pool.query('UPDATE inventory_logs SET created_by = NULL WHERE created_by IS NOT NULL');
    await pool.query('UPDATE payments SET created_by = NULL WHERE created_by IS NOT NULL');

    console.log('✅ Related data cleared');

    console.log('\n🗑️  Deleting all existing users...');
    const deleteResult = await pool.query('DELETE FROM users');
    console.log(`Deleted ${deleteResult.rowCount} users`);

    // New users to create
    const users = [
      { phone: 'akbota', name: 'Akbota', role: 'designer', password: 'akbota123' },
      { phone: 'saltanat', name: 'Saltanat', role: 'designer', password: 'saltanat123' },
      { phone: 'zhaina', name: 'Zhaina', role: 'designer', password: 'zhaina123' },
      { phone: 'ultu', name: 'Ultu', role: 'designer', password: 'ultu123' },
      { phone: 'dosymzhan', name: 'Dosymzhan', role: 'designer', password: 'dosymzhan123' },
      { phone: 'admin', name: 'Admin', role: 'admin', password: 'admin123' },
    ];

    console.log('\n👤 Creating new users...');

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      const result = await pool.query(
        `INSERT INTO users (phone, password_hash, name, role, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id, phone, name, role`,
        [user.phone, hashedPassword, user.name, user.role]
      );

      console.log(`✅ Created: ${result.rows[0].name} (${result.rows[0].role}) - login: ${user.phone} / password: ${user.password}`);
    }

    console.log('\n✅ Done! New accounts:');
    console.log('┌─────────────┬───────────────┬──────────┐');
    console.log('│ Login       │ Password      │ Role     │');
    console.log('├─────────────┼───────────────┼──────────┤');
    for (const user of users) {
      console.log(`│ ${user.phone.padEnd(11)} │ ${user.password.padEnd(13)} │ ${user.role.padEnd(8)} │`);
    }
    console.log('└─────────────┴───────────────┴──────────┘');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetUsers();
