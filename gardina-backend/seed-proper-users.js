import bcrypt from 'bcryptjs';
import pool from './src/infrastructure/database/config.js';

async function seedProperUsers() {
  try {
    console.log('Creating proper users according to LOGIN_CREDENTIALS.md...\n');

    const hashedPassword = await bcrypt.hash('qwerty', 10);

    // Users according to LOGIN_CREDENTIALS.md
    const users = [
      {
        phone: 'admin',
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
        email: 'admin@gardina.kz'
      },
      {
        phone: 'akbota',
        password: hashedPassword,
        name: 'Akbota',
        role: 'designer',
        email: 'akbota@gardina.kz'
      },
      {
        phone: 'ultu',
        password: hashedPassword,
        name: 'Ultu',
        role: 'designer',
        email: 'ultu@gardina.kz'
      },
      {
        phone: 'manager',
        password: hashedPassword,
        name: 'Manager',
        role: 'manager',
        email: 'manager@gardina.kz'
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
          'UPDATE users SET password_hash = $1, is_active = true, name = $2, role = $3, email = $4 WHERE phone = $5',
          [user.password, user.name, user.role, user.email, user.phone]
        );
        console.log(`✅ Updated user: ${user.phone} (${user.role})`);
      }
    }

    console.log('\n✅ Proper users created/updated successfully!');
    console.log('\nYou can now login with:');
    console.log('  Admin:    phone: admin    / password: qwerty');
    console.log('  Designer: phone: akbota   / password: qwerty');
    console.log('  Designer: phone: ultu     / password: qwerty');
    console.log('  Manager:  phone: manager  / password: qwerty');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding proper users:', error);
    process.exit(1);
  }
}

seedProperUsers();
