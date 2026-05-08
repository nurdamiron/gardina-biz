/**
 * Test fixtures for role-based testing
 * Contains sample users, clients, measurements, deals for each role
 */

import bcrypt from 'bcryptjs';

/**
 * Test users for each role
 */
export const testUsers = {
  admin: {
    name: 'Admin Test',
    phone: '+77000000001',
    email: 'admin@test.com',
    password: 'password',
    role: 'admin',
  },

  salesManager1: {
    name: 'Aidar Sales',
    phone: '+77000000010',
    email: 'sales1@test.com',
    password: 'password',
    role: 'sales_manager',
    commission_rate: 40,
  },

  salesManager2: {
    name: 'Marat Sales',
    phone: '+77000000011',
    email: 'sales2@test.com',
    password: 'password',
    role: 'sales_manager',
    commission_rate: 40,
  },

  measurer1: {
    name: 'Dinara Measurer',
    phone: '+77000000020',
    email: 'measurer1@test.com',
    password: 'password',
    role: 'measurer',
    commission_rate: 30,
  },

  measurer2: {
    name: 'Saule Measurer',
    phone: '+77000000021',
    email: 'measurer2@test.com',
    password: 'password',
    role: 'measurer',
    commission_rate: 30,
  },

  designer1: {
    name: 'Nurlan Designer',
    phone: '+77000000030',
    email: 'designer1@test.com',
    password: 'password',
    role: 'designer',
    commission_rate: 60,
  },

  designer2: {
    name: 'Aliya Designer',
    phone: '+77000000031',
    email: 'designer2@test.com',
    password: 'password',
    role: 'designer',
    commission_rate: 60,
  },

  manager1: {
    name: 'Askar Manager',
    phone: '+77000000040',
    email: 'manager1@test.com',
    password: 'password',
    role: 'manager',
  },

  production1: {
    name: 'Dias Production',
    phone: '+77000000050',
    email: 'production1@test.com',
    password: 'password',
    role: 'production',
  },

  installer1: {
    name: 'Bekzat Installer',
    phone: '+77000000060',
    email: 'installer1@test.com',
    password: 'password',
    role: 'installer',
    commission_rate: 15,
  },
};

/**
 * Test clients for scenarios
 */
export const testClients = {
  simple: {
    name: 'Simple Client',
    phone: '+77771234567',
    email: 'simple@client.com',
    address: 'Almaty, Dostyk 123, apt 45',
    source: 'instagram',
    budget: 50000,
  },

  vip: {
    name: 'VIP Client Rich',
    phone: '+77772345678',
    email: 'vip@client.com',
    address: 'Almaty, Medeu 456, penthouse',
    source: 'referral',
    budget: 500000,
    notes: 'Very demanding, high expectations',
  },

  budget: {
    name: 'Budget Client',
    phone: '+77773456789',
    email: 'budget@client.com',
    address: 'Almaty, Rozybakieva 789',
    source: 'website',
    budget: 30000,
  },

  multiRoom: {
    name: 'Multi Room Client',
    phone: '+77774567890',
    email: 'multi@client.com',
    address: 'Almaty, Abay 321, apt 88',
    source: 'instagram',
    budget: 200000,
    notes: '5-room apartment, needs curtains for all rooms',
  },
};

/**
 * Test leads for sales managers
 */
export const testLeads = {
  hot: {
    source: 'instagram_dm',
    contact_name: 'Hot Lead Asel',
    contact_phone: '+77775678901',
    contact_email: 'hot@lead.com',
    notes: 'Ready to buy, budget 100k, wants measurement ASAP',
    status: 'new',
    priority: 'high',
    budget: 100000,
  },

  warm: {
    source: 'whatsapp',
    contact_name: 'Warm Lead Baurzhan',
    contact_phone: '+77776789012',
    notes: 'Interested, needs more info, will decide next week',
    status: 'new',
    priority: 'medium',
    budget: 60000,
  },

  cold: {
    source: 'website_form',
    contact_name: 'Cold Lead Dana',
    contact_phone: '+77777890123',
    contact_email: 'cold@lead.com',
    notes: 'Just browsing, no immediate plans',
    status: 'new',
    priority: 'low',
    budget: null,
  },

  rejected: {
    source: 'phone_call',
    contact_name: 'Rejected Lead',
    contact_phone: '+77778901234',
    notes: 'Budget too low, looking for cheap options',
    status: 'rejected',
    rejection_reason: 'Budget mismatch',
  },
};

/**
 * Test measurements data
 */
export const testMeasurements = {
  simple: {
    scheduled_date: new Date(Date.now() + 86400000), // Tomorrow
    scheduled_time: '14:00',
    address: 'Almaty, Dostyk 123, apt 45',
    status: 'scheduled',
    notes: 'Client available after 2pm',
  },

  complex: {
    scheduled_date: new Date(Date.now() + 86400000),
    scheduled_time: '10:00',
    address: 'Almaty, Medeu 456, penthouse',
    status: 'scheduled',
    notes: 'Bay windows, high ceilings (4.5m), need ladder',
    complexity: 'high',
  },

  completed: {
    scheduled_date: new Date(Date.now() - 86400000), // Yesterday
    scheduled_time: '11:00',
    address: 'Almaty, Abay 321',
    status: 'completed',
    result: {
      window_width: 150,
      window_height: 200,
      wall_to_wall: 180,
      ceiling_height: 270,
      room_type: 'living_room',
      notes: 'Standard installation, no obstacles',
    },
  },

  multiRoom: {
    scheduled_date: new Date(Date.now() + 172800000), // Day after tomorrow
    scheduled_time: '09:00',
    address: 'Almaty, Rozybakieva 789',
    status: 'scheduled',
    notes: '5 rooms, will take 2-3 hours',
    rooms: [
      { name: 'living_room', windows: 2 },
      { name: 'bedroom_1', windows: 1 },
      { name: 'bedroom_2', windows: 1 },
      { name: 'kitchen', windows: 1 },
      { name: 'kids_room', windows: 1 },
    ],
  },
};

/**
 * Test proposals data
 */
export const testProposals = {
  simple: {
    items: [
      {
        type: 'roman_blind',
        fabric: 'blackout_premium',
        fabric_code: 'BL-001',
        width: 150,
        height: 200,
        quantity: 1,
        unit_price: 45000,
        total: 45000,
      },
    ],
    subtotal: 45000,
    discount: 5000,
    discount_reason: 'First-time client',
    total: 40000,
    valid_until: new Date(Date.now() + 7 * 86400000), // 7 days
    notes: 'Installation included',
  },

  complex: {
    items: [
      {
        type: 'roman_blind',
        fabric: 'blackout_premium',
        fabric_code: 'BL-001',
        width: 180,
        height: 250,
        quantity: 2,
        unit_price: 60000,
        total: 120000,
      },
      {
        type: 'curtains',
        fabric: 'linen_luxury',
        fabric_code: 'LN-005',
        width: 200,
        height: 270,
        quantity: 1,
        unit_price: 85000,
        total: 85000,
      },
      {
        type: 'roller_blind',
        fabric: 'light_filtering',
        fabric_code: 'LF-012',
        width: 120,
        height: 180,
        quantity: 3,
        unit_price: 30000,
        total: 90000,
      },
    ],
    subtotal: 295000,
    discount: 15000,
    discount_reason: 'VIP client, large order',
    total: 280000,
    valid_until: new Date(Date.now() + 14 * 86400000), // 14 days
    notes: 'Premium fabrics, complex installation',
  },

  multiRoom: {
    items: [
      {
        room: 'living_room',
        type: 'roman_blind',
        fabric: 'blackout_premium',
        width: 180,
        height: 220,
        quantity: 2,
        unit_price: 50000,
        total: 100000,
      },
      {
        room: 'bedroom_1',
        type: 'curtains',
        fabric: 'linen_natural',
        width: 150,
        height: 250,
        quantity: 1,
        unit_price: 60000,
        total: 60000,
      },
      {
        room: 'bedroom_2',
        type: 'roller_blind',
        fabric: 'blackout_basic',
        width: 140,
        height: 200,
        quantity: 1,
        unit_price: 35000,
        total: 35000,
      },
      {
        room: 'kitchen',
        type: 'roman_blind',
        fabric: 'water_resistant',
        width: 120,
        height: 180,
        quantity: 1,
        unit_price: 30000,
        total: 30000,
      },
      {
        room: 'kids_room',
        type: 'blackout_curtains',
        fabric: 'kids_pattern',
        width: 160,
        height: 240,
        quantity: 1,
        unit_price: 55000,
        total: 55000,
      },
    ],
    subtotal: 280000,
    discount: 30000,
    discount_reason: 'Large order, 5 rooms',
    total: 250000,
    valid_until: new Date(Date.now() + 10 * 86400000),
    notes: 'Staged installation over 2 days',
  },
};

/**
 * Test deals with commission scenarios
 */
export const testDeals = {
  soloDesigner: {
    total: 100000,
    status: 'completed',
    payment_status: 'paid',
    commission_structure: {
      designer: 60000, // 60%
      company: 40000, // 40%
    },
  },

  teamWork: {
    total: 100000,
    status: 'completed',
    payment_status: 'paid',
    commission_structure: {
      sales_manager: 40000, // 40%
      measurer: 30000, // 30%
      designer: 20000, // 20%
      company: 10000, // 10%
    },
  },

  vipDeal: {
    total: 500000,
    status: 'completed',
    payment_status: 'paid',
    commission_structure: {
      sales_manager: 200000, // 40%
      measurer: 150000, // 30%
      designer: 100000, // 20%
      company: 50000, // 10%
    },
  },

  multiMeasurer: {
    total: 500000,
    status: 'completed',
    payment_status: 'paid',
    commission_structure: {
      sales_manager: 200000, // 40%
      measurer_1: 64000, // 30% * (3/7 rooms)
      measurer_2: 86000, // 30% * (4/7 rooms)
      designer: 100000, // 20%
      company: 50000, // 10%
    },
  },
};

/**
 * Test scenarios combining multiple entities
 */
export const testScenarios = {
  // Scenario SM-01: Sales Manager complete flow
  salesManagerFlow: {
    user: 'salesManager1',
    lead: 'hot',
    client: 'simple',
    measurement: 'simple',
    assignedMeasurer: 'measurer1',
  },

  // Scenario M-01: Measurer complete flow
  measurerFlow: {
    user: 'measurer1',
    measurement: 'simple',
    client: 'simple',
    photos: [
      { type: 'window', filename: 'window_front.jpg' },
      { type: 'room', filename: 'room_wide.jpg' },
      { type: 'measurement', filename: 'tape_measure.jpg' },
    ],
  },

  // Scenario D-01: Designer solo flow
  designerSoloFlow: {
    user: 'designer1',
    lead: 'warm',
    client: 'budget',
    measurement: 'simple',
    proposal: 'simple',
    deal: 'soloDesigner',
  },

  // Scenario CR-01: Full team collaboration
  fullTeamFlow: {
    salesManager: 'salesManager1',
    measurer: 'measurer1',
    designer: 'designer1',
    manager: 'manager1',
    production: 'production1',
    installer: 'installer1',
    lead: 'hot',
    client: 'vip',
    measurement: 'complex',
    proposal: 'complex',
    deal: 'vipDeal',
  },

  // Scenario CR-02: Conflict - overlapping work
  conflictScenario: {
    salesManager1: 'salesManager1',
    salesManager2: 'salesManager2',
    lead: 'warm',
    client: 'simple',
    timestampDiff: 900000, // 15 minutes
  },

  // Scenario CC-04: Multiple measurers
  multiMeasurerScenario: {
    salesManager: 'salesManager1',
    measurer1: 'measurer1',
    measurer2: 'measurer2',
    designer: 'designer1',
    client: 'multiRoom',
    measurement: 'multiRoom',
    proposal: 'multiRoom',
    deal: 'multiMeasurer',
  },
};

/**
 * Permission test cases
 */
export const permissionTests = {
  salesManager: {
    allowed: [
      { method: 'GET', path: '/api/leads' },
      { method: 'POST', path: '/api/leads' },
      { method: 'PUT', path: '/api/leads/:id' },
      { method: 'GET', path: '/api/clients' },
      { method: 'POST', path: '/api/clients' },
      { method: 'POST', path: '/api/measurements' },
      { method: 'GET', path: '/api/measurements' },
    ],
    forbidden: [
      { method: 'PUT', path: '/api/measurements/:id/complete' },
      { method: 'POST', path: '/api/measurements/:id/photos' },
      { method: 'POST', path: '/api/proposals' },
      { method: 'PUT', path: '/api/deals/:id/status' },
      { method: 'GET', path: '/api/production' },
      { method: 'DELETE', path: '/api/clients/:id' },
    ],
  },

  measurer: {
    allowed: [
      { method: 'GET', path: '/api/measurements' },
      { method: 'PUT', path: '/api/measurements/:id/status' },
      { method: 'PUT', path: '/api/measurements/:id/complete' },
      { method: 'POST', path: '/api/measurements/:id/photos' },
      { method: 'GET', path: '/api/clients/:id' },
    ],
    forbidden: [
      { method: 'GET', path: '/api/leads' },
      { method: 'POST', path: '/api/clients' },
      { method: 'POST', path: '/api/proposals' },
      { method: 'GET', path: '/api/production' },
      { method: 'DELETE', path: '/api/measurements/:id' },
    ],
  },

  designer: {
    allowed: [
      { method: 'GET', path: '/api/leads' },
      { method: 'POST', path: '/api/leads' },
      { method: 'GET', path: '/api/clients' },
      { method: 'POST', path: '/api/clients' },
      { method: 'GET', path: '/api/measurements' },
      { method: 'POST', path: '/api/measurements' },
      { method: 'PUT', path: '/api/measurements/:id/complete' },
      { method: 'POST', path: '/api/proposals' },
      { method: 'GET', path: '/api/deals' },
      { method: 'POST', path: '/api/deals' },
    ],
    forbidden: [
      { method: 'DELETE', path: '/api/users/:id' },
      { method: 'PUT', path: '/api/settings' },
    ],
  },

  manager: {
    allowed: [
      { method: 'GET', path: '/api/leads' },
      { method: 'PUT', path: '/api/leads/:id/assign' },
      { method: 'GET', path: '/api/measurements' },
      { method: 'PUT', path: '/api/measurements/:id/assign' },
      { method: 'GET', path: '/api/analytics/team' },
      { method: 'GET', path: '/api/deals' },
      { method: 'PUT', path: '/api/deals/:id/commission' },
    ],
    forbidden: [
      { method: 'DELETE', path: '/api/users/:id' },
      { method: 'PUT', path: '/api/settings' },
      { method: 'DELETE', path: '/api/deals/:id' },
    ],
  },

  admin: {
    allowed: [
      { method: 'GET', path: '/api/users' },
      { method: 'POST', path: '/api/users' },
      { method: 'PUT', path: '/api/users/:id' },
      { method: 'DELETE', path: '/api/users/:id' },
      { method: 'PUT', path: '/api/settings' },
      { method: 'GET', path: '/api/reports/financial' },
      { method: 'POST', path: '/api/proposals/restore/:id' },
    ],
    forbidden: [], // Admin can do everything
  },
};

/**
 * Edge case test data
 */
export const edgeCases = {
  // EC-02: Data inconsistencies
  invalidMeasurement: {
    // Missing client_id
    scheduled_date: new Date(Date.now() + 86400000),
    scheduled_time: '14:00',
  },

  // EC-03: Race condition
  simultaneousAssignment: {
    leadId: null, // Will be set during test
    user1: 'salesManager1',
    user2: 'salesManager2',
    timestampDiff: 50, // milliseconds
  },

  // EC-04: Orphaned records
  clientWithMeasurements: {
    client: 'simple',
    activeMeasurements: 2,
    shouldPreventDelete: true,
  },

  // EC-05: Commission edge cases
  zeroDeal: {
    total: 50000,
    discount: 50000,
    final_total: 0,
    expectedCommission: 0,
  },

  cancelledAfterPaid: {
    total: 100000,
    commission_status: 'paid',
    deal_status: 'cancelled',
    expectedAction: 'clawback',
  },

  // EC-07: File upload failures
  largeFile: {
    filename: 'huge_photo.jpg',
    size: 15000000, // 15MB
    maxSize: 10485760, // 10MB
    shouldFail: true,
  },

  unsupportedFileType: {
    filename: 'document.pdf',
    type: 'application/pdf',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    shouldFail: true,
  },
};

/**
 * Helper to get hashed password
 */
export async function getHashedPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Helper to create all test users
 */
export async function createTestUsers(pool) {
  const users = [];

  for (const [key, userData] of Object.entries(testUsers)) {
    const passwordHash = await getHashedPassword(userData.password);

    const result = await pool.query(
      `INSERT INTO users (name, phone, email, password_hash, role, commission_rate, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        userData.name,
        userData.phone,
        userData.email,
        passwordHash,
        userData.role,
        userData.commission_rate || null,
      ]
    );

    users.push({ key, data: result.rows[0] });
  }

  return users;
}

/**
 * Helper to create test client
 */
export async function createTestClient(pool, clientKey, createdBy) {
  const clientData = testClients[clientKey];

  const result = await pool.query(
    `INSERT INTO clients (name, phone, email, address, source, budget, notes, created_by, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     RETURNING *`,
    [
      clientData.name,
      clientData.phone,
      clientData.email || null,
      clientData.address,
      clientData.source,
      clientData.budget || null,
      clientData.notes || null,
      createdBy,
    ]
  );

  return result.rows[0];
}

/**
 * Helper to create test lead
 */
export async function createTestLead(pool, leadKey, assignedTo = null) {
  const leadData = testLeads[leadKey];

  const result = await pool.query(
    `INSERT INTO leads (source, contact_name, contact_phone, contact_email, notes, status, priority, budget, assigned_to, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     RETURNING *`,
    [
      leadData.source,
      leadData.contact_name,
      leadData.contact_phone,
      leadData.contact_email || null,
      leadData.notes || null,
      leadData.status,
      leadData.priority || 'medium',
      leadData.budget || null,
      assignedTo,
    ]
  );

  return result.rows[0];
}

export default {
  testUsers,
  testClients,
  testLeads,
  testMeasurements,
  testProposals,
  testDeals,
  testScenarios,
  permissionTests,
  edgeCases,
  getHashedPassword,
  createTestUsers,
  createTestClient,
  createTestLead,
};
