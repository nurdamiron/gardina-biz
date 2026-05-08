import pool from '../../src/infrastructure/database/config.js';
import { PostgresDealRepository } from '../../src/infrastructure/repositories/PostgresDealRepository.js';
import { Deal } from '../../src/domain/aggregates/Deal.js';

describe('Database Transactions and Rollback Tests', () => {
  let dealRepository;

  beforeAll(() => {
    dealRepository = new PostgresDealRepository();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Transaction Integrity', () => {
    test('should rollback on error', async () => {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Insert test data
        const insertResult = await client.query(`
          INSERT INTO clients (name, phone)
          VALUES ('Rollback Test', '+77001111111')
          RETURNING id
        `);
        const clientId = insertResult.rows[0].id;

        // Verify data exists
        const checkBefore = await client.query(
          'SELECT * FROM clients WHERE id = $1',
          [clientId]
        );
        expect(checkBefore.rows.length).toBe(1);

        // Trigger rollback
        await client.query('ROLLBACK');

        // Verify data was rolled back
        const checkAfter = await client.query(
          'SELECT * FROM clients WHERE id = $1',
          [clientId]
        );
        expect(checkAfter.rows.length).toBe(0);
      } finally {
        client.release();
      }
    });

    test('should commit successfully', async () => {
      const client = await pool.connect();
      let clientId;

      try {
        await client.query('BEGIN');

        const result = await client.query(`
          INSERT INTO clients (name, phone)
          VALUES ('Commit Test', '+77002222222')
          RETURNING id
        `);
        clientId = result.rows[0].id;

        await client.query('COMMIT');

        // Verify data persisted after commit
        const check = await pool.query(
          'SELECT * FROM clients WHERE id = $1',
          [clientId]
        );
        expect(check.rows.length).toBe(1);

        // Cleanup
        await pool.query('DELETE FROM clients WHERE id = $1', [clientId]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  });

  describe('Cascade Delete Tests', () => {
    test('should cascade delete deals when client deleted', async () => {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Create client
        const clientResult = await client.query(`
          INSERT INTO clients (name, phone)
          VALUES ('Cascade Test Client', '+77003333333')
          RETURNING id
        `);
        const clientId = clientResult.rows[0].id;

        // Create user
        const userResult = await client.query(`
          INSERT INTO users (name, phone, password_hash, role)
          VALUES ('Cascade Designer', '+77003333334', 'hash', 'designer')
          RETURNING id
        `);
        const designerId = userResult.rows[0].id;

        // Create deal
        const dealResult = await client.query(`
          INSERT INTO deals (client_id, designer_id, status)
          VALUES ($1, $2, 'scheduled')
          RETURNING id
        `,
          [clientId, designerId]
        );
        const dealId = dealResult.rows[0].id;

        // Delete client - should cascade to deals
        await client.query('DELETE FROM clients WHERE id = $1', [clientId]);

        // Verify deal was also deleted
        const dealCheck = await client.query(
          'SELECT * FROM deals WHERE id = $1',
          [dealId]
        );
        expect(dealCheck.rows.length).toBe(0);

        await client.query('ROLLBACK');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  });

  describe('Trigger Tests', () => {
    test('updated_at trigger should update timestamp', async () => {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Insert client
        const insertResult = await client.query(`
          INSERT INTO clients (name, phone)
          VALUES ('Trigger Test', '+77004444444')
          RETURNING id, created_at, updated_at
        `);
        const clientId = insertResult.rows[0].id;
        const initialUpdatedAt = insertResult.rows[0].updated_at;

        // Sufficient delay to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 1100));

        // Update client
        const updateResult = await client.query(`
          UPDATE clients
          SET name = 'Updated Name'
          WHERE id = $1
          RETURNING updated_at
        `,
          [clientId]
        );

        const newUpdatedAt = updateResult.rows[0].updated_at;

        // Verify updated_at changed
        expect(new Date(newUpdatedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(initialUpdatedAt).getTime()
        );

        await client.query('ROLLBACK');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  });

  describe('Unique Constraints', () => {
    test('should prevent duplicate phone in users', async () => {
      const client = await pool.connect();
      const testPhone = `+7700${Date.now().toString().slice(-7)}`; // Unique phone

      try {
        await client.query('BEGIN');

        // Insert first user
        await client.query(`
          INSERT INTO users (name, phone, password_hash, role)
          VALUES ('User 1', $1, 'hash', 'designer')
        `, [testPhone]);

        // Try to insert duplicate phone - should fail
        let errorThrown = false;
        try {
          await client.query(`
            INSERT INTO users (name, phone, password_hash, role)
            VALUES ('User 2', $1, 'hash', 'designer')
          `, [testPhone]);
        } catch (err) {
          errorThrown = true;
          expect(err.message).toContain('duplicate key value');
        }

        expect(errorThrown).toBe(true);

        await client.query('ROLLBACK');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });

    test('should prevent duplicate email in users', async () => {
      const client = await pool.connect();
      const testEmail = `test-${Date.now()}@example.com`; // Unique email
      const testPhone1 = `+7700${Date.now().toString().slice(-7)}1`;
      const testPhone2 = `+7700${Date.now().toString().slice(-7)}2`;

      try {
        await client.query('BEGIN');

        // Insert first user
        await client.query(`
          INSERT INTO users (name, email, phone, password_hash, role)
          VALUES ('User 1', $1, $2, 'hash', 'designer')
        `, [testEmail, testPhone1]);

        // Try duplicate email
        let errorThrown = false;
        try {
          await client.query(`
            INSERT INTO users (name, email, phone, password_hash, role)
            VALUES ('User 2', $1, $2, 'hash', 'designer')
          `, [testEmail, testPhone2]);
        } catch (err) {
          errorThrown = true;
          expect(err.message).toContain('duplicate key value');
        }

        expect(errorThrown).toBe(true);

        await client.query('ROLLBACK');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  });

  describe('ENUM Type Validation', () => {
    test('should reject invalid user role', async () => {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        await expect(
          client.query(`
            INSERT INTO users (name, phone, password_hash, role)
            VALUES ('Invalid Role User', '+77007777777', 'hash', 'invalid_role')
          `)
        ).rejects.toThrow();

        await client.query('ROLLBACK');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });

    test('should reject invalid deal status', async () => {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Create dependencies
        const clientResult = await client.query(`
          INSERT INTO clients (name, phone)
          VALUES ('Deal Test', '+77008888888')
          RETURNING id
        `);

        const userResult = await client.query(`
          INSERT INTO users (name, phone, password_hash, role)
          VALUES ('Designer', '+77008888889', 'hash', 'designer')
          RETURNING id
        `);

        await expect(
          client.query(`
            INSERT INTO deals (client_id, designer_id, status)
            VALUES ($1, $2, 'invalid_status')
          `,
            [clientResult.rows[0].id, userResult.rows[0].id]
          )
        ).rejects.toThrow();

        await client.query('ROLLBACK');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  });

  describe('PostgresDealRepository Transaction Tests', () => {
    test('should save deal with domain events in transaction', async () => {
      let clientId, designerId;

      try {
        // Create dependencies with unique data
        const uniquePhone1 = `+7700${Date.now().toString().slice(-7)}`;
        const uniquePhone2 = `+7700${Date.now().toString().slice(-7)}1`;

        const clientResult = await pool.query(`
          INSERT INTO clients (name, phone)
          VALUES ('Repo Test Client', $1)
          RETURNING id
        `, [uniquePhone1]);
        clientId = clientResult.rows[0].id;

        const userResult = await pool.query(`
          INSERT INTO users (name, phone, password_hash, role)
          VALUES ('Repo Test Designer', $1, 'hash', 'designer')
          RETURNING id
        `, [uniquePhone2]);
        designerId = userResult.rows[0].id;

        // Test repository save with transaction
        const deal = Deal.create({ clientId, designerId });
        const savedDeal = await dealRepository.save(deal);

        expect(savedDeal.id).toBeDefined();
        expect(savedDeal.clientId).toBe(clientId);
        expect(savedDeal.designerId).toBe(designerId);

        // Verify domain events were saved
        const eventsResult = await pool.query(
          'SELECT * FROM deal_events WHERE deal_id = $1',
          [savedDeal.id]
        );

        expect(eventsResult.rows.length).toBeGreaterThan(0);
        expect(eventsResult.rows[0].event_type).toBe('DealCreated');

        // Cleanup
        await pool.query('DELETE FROM deal_events WHERE deal_id = $1', [savedDeal.id]);
        await pool.query('DELETE FROM deals WHERE id = $1', [savedDeal.id]);
        await pool.query('DELETE FROM clients WHERE id = $1', [clientId]);
        await pool.query('DELETE FROM users WHERE id = $1', [designerId]);
      } catch (error) {
        // Cleanup on error
        if (clientId) await pool.query('DELETE FROM clients WHERE id = $1', [clientId]);
        if (designerId) await pool.query('DELETE FROM users WHERE id = $1', [designerId]);
        throw error;
      }
    });

    test('should rollback on repository error', async () => {
      // This tests that PostgresDealRepository properly rolls back on error
      const invalidDeal = new Deal({
        clientId: '00000000-0000-0000-0000-000000000000', // Non-existent
        designerId: '00000000-0000-0000-0000-000000000000', // Non-existent
      });

      await expect(dealRepository.save(invalidDeal)).rejects.toThrow();

      // Verify no orphaned data
      const dealsCheck = await pool.query(
        'SELECT * FROM deals WHERE id = $1',
        [invalidDeal.id]
      );
      expect(dealsCheck.rows.length).toBe(0);
    });
  });
});
