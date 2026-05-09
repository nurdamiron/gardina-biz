/**
 * Seed demo data for a freshly created organization. Called from inside
 * the registerSalon transaction so a failed seed rolls back the whole
 * registration — better than ending up with an org-without-demo state.
 *
 * Everything is marked `is_sample = true` so the admin can wipe demo
 * data with a single API call once they've found their feet.
 */

const DEMO_CLIENTS = [
  {
    name: 'Айгуль (демо)',
    phone: '+77000000001',
    email: 'demo-1@gardina.kz',
    address: 'Алматы, Абая 100',
    notes: 'Демо-клиент. Можно удалить из админки одной кнопкой.',
    source: 'demo',
  },
  {
    name: 'Asem Curtains (демо)',
    phone: '+77000000002',
    email: 'demo-2@gardina.kz',
    address: 'Астана, Достык 5',
    notes: 'Демо-клиент. Удалите когда заведёте первого настоящего клиента.',
    source: 'demo',
  },
];

const DEMO_PRODUCTS = [
  { name: 'Блэкаут «Royal Velvet» (демо)', type: 'blackout', brand: 'Demo', price_per_meter: 6500, color: '#1b3a2a' },
  { name: 'Тюль «Crystal» (демо)',         type: 'tulle',    brand: 'Demo', price_per_meter: 3200, color: '#f8f4ed' },
  { name: 'Лён натуральный (демо)',        type: 'curtain',  brand: 'Demo', price_per_meter: 4800, color: '#c9a68a' },
  { name: 'Карниз металл 2.5м (демо)',     type: 'cornice',  brand: 'Demo', price_per_meter: 12000, color: '#9c9c9c' },
  { name: 'Жалюзи горизонтальные (демо)',  type: 'jalousie', brand: 'Demo', price_per_meter: 5800, color: '#e8e8e8' },
];

/**
 * @param {import('pg').PoolClient} client - active transaction client
 * @param {string} organizationId
 */
export async function seedDemoData(client, organizationId) {
  // 1. Demo clients
  for (const c of DEMO_CLIENTS) {
    try {
      await client.query(
        `INSERT INTO clients (organization_id, name, phone, email, address, notes, source, is_sample)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         ON CONFLICT DO NOTHING`,
        [organizationId, c.name, c.phone, c.email, c.address, c.notes, c.source]
      );
    } catch (e) {
      // Schema may differ across deployments — ignore individual failures
      // so seed never blocks registration. Log for visibility.
      console.warn(`[seed] demo client failed: ${e.message}`);
    }
  }

  // 2. Demo products
  for (const p of DEMO_PRODUCTS) {
    try {
      await client.query(
        `INSERT INTO products (organization_id, name, type, brand, price_per_meter, color, is_sample)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT DO NOTHING`,
        [organizationId, p.name, p.type, p.brand, p.price_per_meter, p.color]
      );
    } catch (e) {
      console.warn(`[seed] demo product failed: ${e.message}`);
    }
  }
}

/**
 * Remove all sample rows for an organization. Used by the admin
 * "remove demo data" button.
 */
export async function purgeDemoData(organizationId) {
  const { default: pool } = await import('../../infrastructure/database/config.js');
  await pool.query('DELETE FROM clients WHERE organization_id = $1 AND is_sample = true', [organizationId]);
  await pool.query('DELETE FROM products WHERE organization_id = $1 AND is_sample = true', [organizationId]);
}
