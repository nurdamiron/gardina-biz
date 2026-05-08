#!/usr/bin/env node

/**
 * Full System Flow Test
 * Tests complete user journey from login to deal completion
 */

const API_BASE = 'http://13.62.193.249/gardina/api';

async function testFullFlow() {
  console.log('🚀 GARDINA — FULL SYSTEM FLOW TEST');
  console.log('='.repeat(80));
  console.log('');

  let token = null;
  let userId = null;
  let clientId = null;
  let measurementId = null;
  let proposalId = null;
  let dealId = null;

  try {
    // 1. AUTHENTICATION
    console.log('1️⃣  AUTHENTICATION TEST');
    console.log('-'.repeat(80));

    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: 'testdesigner@test.com',
        password: 'password'
      })
    });

    const loginData = await loginRes.json();

    if (!loginData.success) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    token = loginData.data.accessToken;
    userId = loginData.data.user.id;

    console.log('✅ Login successful');
    console.log(`   User: ${loginData.data.user?.name || loginData.data?.name} (${loginData.data.user?.role || loginData.data?.role})`);
    console.log(`   Token: ${token ? token.substring(0, 20) + '...' : 'Token received'}`);
    console.log('');

    // 2. CREATE CLIENT
    console.log('2️⃣  CREATE CLIENT');
    console.log('-'.repeat(80));

    const clientRes = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Client Flow',
        phone: `+7700${Date.now().toString().slice(-7)}`,
        email: `testflow${Date.now()}@client.com`,
        address: 'Almaty, Test Street 123',
        source: 'instagram',
        notes: 'Full flow test client'
      })
    });

    const clientData = await clientRes.json();

    if (!clientData.success) {
      throw new Error(`Create client failed: ${JSON.stringify(clientData)}`);
    }

    clientId = clientData.data.id;

    console.log('✅ Client created');
    console.log(`   ID: ${clientId}`);
    console.log(`   Name: ${clientData.data.name}`);
    console.log(`   Phone: ${clientData.data.phone}`);
    console.log('');

    // 3. CREATE MEASUREMENT
    console.log('3️⃣  CREATE MEASUREMENT');
    console.log('-'.repeat(80));

    const measurementRes = await fetch(`${API_BASE}/measurements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        clientId: clientId,
        designerId: userId,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        address: 'Almaty, Test Street 123',
        notes: 'Test measurement for full flow'
      })
    });

    const measurementData = await measurementRes.json();

    if (!measurementData.success) {
      throw new Error(`Create measurement failed: ${JSON.stringify(measurementData)}`);
    }

    measurementId = measurementData.data.id;

    console.log('✅ Measurement created');
    console.log(`   ID: ${measurementId}`);
    console.log(`   Status: ${measurementData.data.status}`);
    console.log(`   Scheduled: ${measurementData.data.scheduled_at}`);
    console.log('');

    // 4. UPDATE MEASUREMENT STATUS (measure)
    console.log('4️⃣  COMPLETE MEASUREMENT');
    console.log('-'.repeat(80));

    const updateMeasurementRes = await fetch(`${API_BASE}/measurements/${measurementId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'measured',
        room_type: 'living_room',
        budget_min: 50000,
        budget_max: 100000
      })
    });

    const updatedMeasurement = await updateMeasurementRes.json();

    console.log('✅ Measurement completed');
    console.log(`   Status: ${updatedMeasurement.data.status}`);
    console.log('');

    // 5. CREATE PROPOSAL
    console.log('5️⃣  CREATE PROPOSAL');
    console.log('-'.repeat(80));

    const proposalRes = await fetch(`${API_BASE}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        clientId: clientId,
        measurementId: measurementId,
        designerId: userId,
        variantName: 'Premium Blackout',
        fabricMeters: 5.5,
        fabricCost: 27500,
        sewingCost: 15000,
        installationCost: 10000,
        totalCost: 52500
      })
    });

    const proposalData = await proposalRes.json();

    if (!proposalData.success) {
      throw new Error(`Create proposal failed: ${JSON.stringify(proposalData)}`);
    }

    proposalId = proposalData.data.id;

    console.log('✅ Proposal created');
    console.log(`   ID: ${proposalId}`);
    console.log(`   Total: ${proposalData.data.total_cost} KZT`);
    console.log(`   Status: ${proposalData.data.status}`);
    console.log('');

    // 6. CREATE DEAL
    console.log('6️⃣  CREATE DEAL');
    console.log('-'.repeat(80));

    const dealRes = await fetch(`${API_BASE}/deals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        clientId: clientId,
        designerId: userId,
        measurementId: measurementId,
        proposalId: proposalId,
        totalAmount: 52500,
        prepaymentPercent: 50
      })
    });

    const dealData = await dealRes.json();

    if (!dealData.success) {
      throw new Error(`Create deal failed: ${JSON.stringify(dealData)}`);
    }

    dealId = dealData.data.id;

    console.log('✅ Deal created');
    console.log(`   ID: ${dealId}`);
    console.log(`   Status: ${dealData.data.status}`);
    console.log(`   Total: ${dealData.data.total_amount} KZT`);
    console.log(`   Prepayment: ${dealData.data.prepayment} KZT`);
    console.log('');

    // 7. GET ALL DATA (verify relationships)
    console.log('7️⃣  VERIFY DATA RELATIONSHIPS');
    console.log('-'.repeat(80));

    const clientCheck = await fetch(`${API_BASE}/clients/${clientId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const clientCheckData = await clientCheck.json();

    const measurementCheck = await fetch(`${API_BASE}/measurements/${measurementId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const measurementCheckData = await measurementCheck.json();

    const proposalCheck = await fetch(`${API_BASE}/proposals/${proposalId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const proposalCheckData = await proposalCheck.json();

    const dealCheck = await fetch(`${API_BASE}/deals/${dealId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dealCheckData = await dealCheck.json();

    console.log('✅ All entities retrieved successfully');
    console.log(`   Client: ${clientCheckData.data.name}`);
    console.log(`   Measurement: ${measurementCheckData.data.id}`);
    console.log(`   Proposal: ${proposalCheckData.data.total_cost} KZT`);
    console.log(`   Deal: ${dealCheckData.data.status}`);
    console.log('');

    // 8. SUMMARY
    console.log('📊 FLOW SUMMARY');
    console.log('='.repeat(80));
    console.log('Complete data flow:');
    console.log(`  User (${userId})`);
    console.log(`    ↓ created`);
    console.log(`  Client (${clientId})`);
    console.log(`    ↓ scheduled`);
    console.log(`  Measurement (${measurementId})`);
    console.log(`    ↓ based on`);
    console.log(`  Proposal (${proposalId})`);
    console.log(`    ↓ converted to`);
    console.log(`  Deal (${dealId})`);
    console.log('');

    console.log('✅ ALL TESTS PASSED!');
    console.log('');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run test
testFullFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
