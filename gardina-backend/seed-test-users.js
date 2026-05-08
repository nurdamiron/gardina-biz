import bcrypt from 'bcryptjs';
import pool from './src/infrastructure/database/config.js';

async function seedTestUsers() {
  try {
    console.log('Creating test users...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Test users for different roles
    const users = [
      {
        phone: '+77777777777',
        password: hashedPassword,
        name: 'Test Admin',
        role: 'admin',
        email: 'admin@test.com'
      },
      {
        phone: '+77012345678',
        password: await bcrypt.hash('admin123', 10),
        name: 'Admin User',
        role: 'admin',
        email: 'admin2@test.com'
      },
      {
        phone: '+77777777778',
        password: hashedPassword,
        name: 'Test Designer',
        role: 'designer',
        email: 'designer@test.com'
      },
      {
        phone: '+77777777779',
        password: hashedPassword,
        name: 'Test Manager',
        role: 'manager',
        email: 'manager@test.com'
      }
    ];

    for (const user of users) {
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE phone = $1',
        [user.phone]
      );

      if (existingUser.rows.length === 0) {
        // Create new user
        const result = await pool.query(
          `INSERT INTO users (phone, password_hash, name, role, email, is_active)
           VALUES ($1, $2, $3, $4, $5, true)
           RETURNING id, phone, role, name`,
          [user.phone, user.password, user.name, user.role, user.email]
        );

        console.log(`✅ Created user: ${result.rows[0].name} (${result.rows[0].role}) - ${result.rows[0].phone}`);
      } else {
        // Update existing user's password
        await pool.query(
          'UPDATE users SET password_hash = $1, is_active = true WHERE phone = $2',
          [user.password, user.phone]
        );
        console.log(`✅ Updated password for: ${user.phone}`);
      }
    }

    console.log('\n✅ Test users created/updated successfully!');
    console.log('\nYou can now login with:');
    console.log('  Admin: +77777777777 / password123');
    console.log('  Admin2: +77012345678 / admin123');
    console.log('  Designer: +77777777778 / password123');
    console.log('  Manager: +77777777779 / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding test users:', error);
    process.exit(1);
  }
}

seedTestUsers();