import pool from '../database/config.js';
import { getTenantId } from '../tenant/tenantContext.js';

/**
 * PostgreSQL User Repository (scoped by organization for tenant isolation)
 */
export class PostgresUserRepository {
  /** Auth / refresh only — user id is globally unique */
  async findByIdUnscoped(id) {
    const result = await pool.query(
      `SELECT u.*, o.slug AS organization_slug, o.name AS organization_name,
              o.current_plan_code, o.billing_cycle, o.subscription_status,
              o.trial_started_at, o.trial_ends_at, o.read_only_since
       FROM users u
       JOIN organizations o ON o.id = u.organization_id
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findById(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.avatar_url, u.is_active, u.created_at,
              u.email_verified_at,
              u.organization_id, o.name AS organization_name, o.slug AS organization_slug,
              o.current_plan_code, o.billing_cycle, o.subscription_status,
              o.trial_started_at, o.trial_ends_at, o.read_only_since
       FROM users u
       JOIN organizations o ON o.id = u.organization_id
       WHERE u.id = $1 AND u.organization_id = $2`,
      [id, tid]
    );
    return result.rows[0] || null;
  }

  async findByEmailInOrganization(email, organizationId) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND organization_id = $2',
      [email, organizationId]
    );
    return result.rows[0] || null;
  }

  async findByPhoneInOrganization(phone, organizationId) {
    const result = await pool.query(
      'SELECT * FROM users WHERE phone = $1 AND organization_id = $2',
      [phone, organizationId]
    );
    return result.rows[0] || null;
  }

  async findByLoginInOrganization(login, organizationId) {
    const result = await pool.query(
      `SELECT u.*, o.slug AS organization_slug, o.name AS organization_name
       FROM users u
       JOIN organizations o ON o.id = u.organization_id
       WHERE u.organization_id = $2 AND (u.email = $1 OR u.phone = $1)`,
      [login, organizationId]
    );
    return result.rows[0] || null;
  }

  /** Multiple tenants may share the same login string — pick org via slug */
  async findAllByLoginGlobally(login) {
    const result = await pool.query(
      `SELECT u.*, o.slug AS organization_slug, o.name AS organization_name
       FROM users u
       JOIN organizations o ON o.id = u.organization_id
       WHERE u.email = $1 OR u.phone = $1`,
      [login]
    );
    return result.rows;
  }

  async findAll(filters = {}) {
    const tid = getTenantId();
    let query = `SELECT id, name, email, phone, role, avatar_url, is_active, created_at
                 FROM users WHERE organization_id = $1`;
    const params = [tid];
    let paramIndex = 2;

    if (filters.role) {
      query += ` AND role = $${paramIndex}`;
      params.push(filters.role);
      paramIndex++;
    }

    if (filters.isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(filters.isActive);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  async create(userData) {
    if (!userData.organizationId) {
      throw new Error('organizationId is required to create a user');
    }
    const result = await pool.query(
      `INSERT INTO users (organization_id, name, email, phone, password_hash, role, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, phone, role, avatar_url, is_active, created_at, organization_id`,
      [
        userData.organizationId,
        userData.name,
        userData.email || null,
        userData.phone,
        userData.passwordHash,
        userData.role || 'designer',
        userData.avatarUrl || null,
      ]
    );

    return result.rows[0];
  }

  async update(id, userData) {
    const tid = getTenantId();
    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        avatar_url = COALESCE($4, avatar_url),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND organization_id = $6
       RETURNING id, name, email, phone, role, avatar_url, is_active, created_at`,
      [userData.name, userData.email, userData.phone, userData.avatarUrl, id, tid]
    );

    return result.rows[0] || null;
  }

  async updatePassword(id, passwordHash) {
    const tid = getTenantId();
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND organization_id = $3',
      [passwordHash, id, tid]
    );
  }

  async updatePasswordUnscoped(id, passwordHash) {
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, id]
    );
  }

  async delete(id) {
    const tid = getTenantId();
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 AND organization_id = $2 RETURNING id',
      [id, tid]
    );
    return result.rows.length > 0;
  }

  async exists(id) {
    const tid = getTenantId();
    const result = await pool.query(
      'SELECT 1 FROM users WHERE id = $1 AND organization_id = $2',
      [id, tid]
    );
    return result.rows.length > 0;
  }

  /** How many active admins an organization currently has (last-admin guard). */
  async countActiveAdmins(organizationId) {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS n
         FROM users
        WHERE organization_id = $1 AND role = 'admin' AND is_active = true`,
      [organizationId]
    );
    return result.rows[0]?.n ?? 0;
  }

  /**
   * Self-service account deletion (GDPR-style erasure): strips personal data and
   * deactivates the account so it can never log in again, while preserving the
   * organization's business records (deals/measurements) that reference this user.
   * Unscoped on purpose — the caller may already be in read-only/expired state and
   * only ever deletes their own id.
   */
  async anonymizeAndDeactivate(id, deadPasswordHash) {
    const result = await pool.query(
      `UPDATE users
          SET is_active = false,
              email = NULL,
              name = 'Удалённый аккаунт',
              phone = 'deleted:' || id::text,
              avatar_url = NULL,
              password_hash = $2,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id`,
      [id, deadPasswordHash]
    );
    return result.rows.length > 0;
  }

  async updateLastLogin(id) {
    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }
}
