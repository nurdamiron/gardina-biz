import pool from './src/infrastructure/database/config.js';
import { v4 as uuidv4 } from 'uuid';

async function seedTestData() {
  try {
    console.log('Creating test data...\n');

    // Get existing users
    const usersResult = await pool.query(`
      SELECT id, role, name FROM users
      WHERE role IN ('designer', 'manager', 'admin')
      LIMIT 10
    `);

    const designers = usersResult.rows.filter(u => u.role === 'designer');
    const managers = usersResult.rows.filter(u => u.role === 'manager');

    console.log(`Found ${designers.length} designers and ${managers.length} managers\n`);

    // Get existing clients (limit to avoid too much test data)
    const clientsResult = await pool.query(`
      SELECT id, name FROM clients
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const clients = clientsResult.rows;
    console.log(`Found ${clients.length} clients\n`);

    if (designers.length === 0) {
      console.log('No designers found. Please run seed-test-users.js first.');
      process.exit(1);
    }

    // Create measurements with different statuses
    console.log('Creating measurements...');
    const measurementStatuses = ['scheduled', 'completed', 'cancelled'];
    const measurementIds = [];

    for (let i = 0; i < 20; i++) {
      const designer = designers[Math.floor(Math.random() * designers.length)];
      const client = clients[Math.floor(Math.random() * clients.length)];
      const status = measurementStatuses[Math.floor(Math.random() * measurementStatuses.length)];

      // Vary dates over last 3 months
      const daysAgo = Math.floor(Math.random() * 90);
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() - daysAgo);

      const measurementResult = await pool.query(`
        INSERT INTO measurements (
          id, designer_id, client_id, status,
          scheduled_at, address, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        uuidv4(),
        designer.id,
        client ? client.id : null,
        status,
        scheduledDate,
        `Test Address ${i + 1}`,
        `Test measurement notes ${i + 1}`,
        scheduledDate
      ]);

      measurementIds.push(measurementResult.rows[0].id);
      console.log(`  ✅ Created measurement ${i + 1} (${status}) for ${designer.name}`);
    }

    // Create deals with different statuses and amounts
    console.log('\nCreating deals...');
    const dealStatuses = ['scheduled', 'measured', 'in_production', 'ready', 'installing', 'completed', 'cancelled'];
    const paymentStatuses = ['pending', 'partial', 'paid'];

    for (let i = 0; i < 25; i++) {
      const designer = designers[Math.floor(Math.random() * designers.length)];
      const client = clients[Math.floor(Math.random() * clients.length)];
      const status = dealStatuses[Math.floor(Math.random() * dealStatuses.length)];
      const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];

      // Random amounts between 100,000 and 5,000,000
      const totalAmount = Math.floor(Math.random() * 4900000) + 100000;
      const prepayment = totalAmount * 0.5;
      const finalPayment = status === 'completed' ? totalAmount * 0.5 : 0;

      // Vary dates over last 6 months
      const daysAgo = Math.floor(Math.random() * 180);
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - daysAgo);

      const deadlineDate = new Date(createdDate);
      deadlineDate.setDate(deadlineDate.getDate() + 30);

      // Link some deals to measurements
      const measurementId = i < measurementIds.length ? measurementIds[i] : null;

      await pool.query(`
        INSERT INTO deals (
          id, client_id, designer_id, measurement_id,
          status, total_amount, prepayment, final_payment,
          payment_status, deadline, designer_commission_percent,
          designer_commission, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        uuidv4(),
        client ? client.id : null,
        designer.id,
        measurementId,
        status,
        totalAmount,
        prepayment,
        finalPayment,
        paymentStatus,
        deadlineDate,
        7,
        totalAmount * 0.07,
        createdDate,
        createdDate
      ]);

      console.log(`  ✅ Created deal ${i + 1} (${status}) - ${totalAmount.toLocaleString()} KZT`);
    }

    // Create products
    console.log('\nCreating products...');
    const productTypes = ['curtain', 'tulle', 'cornice', 'blackout', 'transparent', 'semi_blackout', 'decorative', 'jalousie', 'accessory'];
    const fabrics = ['Велюр', 'Шелк', 'Лен', 'Хлопок', 'Полиэстер', 'Блэкаут'];

    for (let i = 0; i < 15; i++) {
      const type = productTypes[Math.floor(Math.random() * productTypes.length)];
      const fabric = fabrics[Math.floor(Math.random() * fabrics.length)];
      const price = Math.floor(Math.random() * 50000) + 5000;

      await pool.query(`
        INSERT INTO products (
          id, name, type, description,
          price_per_meter, is_available, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        uuidv4(),
        `${fabric} ${type === 'curtain' ? 'перде' : type} ${i + 1}`,
        type,
        `Высококачественный ${fabric.toLowerCase()} для вашего дома`,
        price,
        true,
        new Date()
      ]);

      console.log(`  ✅ Created product: ${fabric} ${type} - ${price} KZT/m`);
    }

    // Skip updating client stages as these columns don't exist
    // The funnel analysis will be based on deal statuses instead

    console.log('\n✅ Test data created successfully!');
    console.log('\nSummary:');
    console.log('  - 20 measurements created');
    console.log('  - 25 deals created');
    console.log('  - 15 products created');

    // Show some statistics
    const statsResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM measurements) as measurements,
        (SELECT COUNT(*) FROM deals) as deals,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT SUM(total_amount) FROM deals WHERE status = 'completed') as revenue
    `);

    const stats = statsResult.rows[0];
    console.log('\nDatabase Statistics:');
    console.log(`  Total Measurements: ${stats.measurements}`);
    console.log(`  Total Deals: ${stats.deals}`);
    console.log(`  Total Products: ${stats.products}`);
    console.log(`  Total Revenue: ${parseFloat(stats.revenue || 0).toLocaleString()} KZT`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  }
}

seedTestData();