import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PostgresUserRepository } from '../../../infrastructure/repositories/PostgresUserRepository.js';
import pool from '../../../infrastructure/database/config.js';
import { getTenantId } from '../../../infrastructure/tenant/tenantContext.js';
import { emailService } from '../../../infrastructure/services/EmailService.js';

/**
 * User Controller
 */
export class UserController {
  constructor() {
    this.userRepository = new PostgresUserRepository();
  }

  async getAll(req, res) {
    try {
      const { role, active } = req.query;
      
      const filters = {};
      
      if (role) {
        filters.role = role;
      }
      
      if (active !== undefined) {
        filters.isActive = active === 'true';
      }
      
      const users = await this.userRepository.findAll(filters);
      
      res.json({
        success: true,
        data: users,
        total: users.length
      });
    } catch (error) {
      console.error(`[UserController.getAll] Failed to fetch users: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch users'
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await this.userRepository.findById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error(`[UserController.getById] Failed to fetch user ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch user'
      });
    }
  }

  /**
   * PUT /api/users/me — update own profile (name, phone, email, avatarUrl)
   */
  async updateMe(req, res) {
    try {
      const { name, phone, email, avatarUrl } = req.body;
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone = phone;
      if (email !== undefined) updates.email = email;
      if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: 'No fields to update' });
      }

      const user = await this.userRepository.update(req.user.id, updates);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/users/me/change-password — change own password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'currentPassword and newPassword are required' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'Новый пароль должен быть не менее 6 символов' });
      }

      // Fetch user with password hash
      const userRow = await this.userRepository.findByIdUnscoped(req.user.id);
      if (!userRow) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const valid = await bcrypt.compare(currentPassword, userRow.passwordHash || userRow.password_hash);
      if (!valid) {
        return res.status(400).json({ success: false, error: 'Ағымдағы құпия сөз қате' });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await this.userRepository.updatePassword(req.user.id, newHash);

      res.json({ success: true, message: 'Құпия сөз сәтті өзгертілді' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ─── ADMIN METHODS ─────────────────────────────────────────────────────

  /** POST /api/users/admin/create — create user (admin only) */
  async adminCreate(req, res) {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
      const { name, phone, password, role } = req.body;
      if (!name || !phone || !password) return res.status(400).json({ success: false, error: 'name, phone, password are required' });
      if (password.length < 6) return res.status(400).json({ success: false, error: 'Пароль кемінде 6 таңба' });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await this.userRepository.create({
        name,
        phone,
        passwordHash,
        role: role || 'designer',
        organizationId: req.user.organizationId,
      });
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      if (error.message?.includes('unique') || error.code === '23505') {
        return res.status(400).json({ success: false, error: 'Бұл логин бұрыннан тіркелген' });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** PUT /api/users/admin/:id — update user (admin only): name, phone, role, isActive */
  async adminUpdate(req, res) {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
      const { id } = req.params;
      const { name, phone, role, isActive } = req.body;

      // Update basic fields
      if (name || phone) {
        await this.userRepository.update(id, { name, phone });
      }
      // Update role or is_active separately (not in base update method)
      if (role !== undefined || isActive !== undefined) {
        const orgId = req.user.organizationId;
        if (role !== undefined) {
          await pool.query(
            'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3',
            [role, id, orgId]
          );
        }
        if (isActive !== undefined) {
          await pool.query(
            'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3',
            [isActive, id, orgId]
          );
        }
      }
      const user = await this.userRepository.findById(id);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** POST /api/users/admin/:id/reset-password — reset user password (admin only) */
  async adminResetPassword(req, res) {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) return res.status(400).json({ success: false, error: 'Пароль кемінде 6 таңба' });
      const hash = await bcrypt.hash(newPassword, 10);
      await this.userRepository.updatePassword(req.params.id, hash);
      res.json({ success: true, message: 'Пароль өзгертілді' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** DELETE /api/users/admin/:id — deactivate user (admin only) */
  async adminDelete(req, res) {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
      if (req.params.id === req.user.id) return res.status(400).json({ success: false, error: 'Өзіңізді өшіре алмайсыз' });
      const orgId = req.user.organizationId;
      await pool.query(
        'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 AND organization_id = $2',
        [req.params.id, orgId]
      );
      res.json({ success: true, message: 'Пайдаланушы деактивацияланды' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/users/admin/invite — send invite email to new team member
   * Creates a pending invitation token; user sets password via the accept link.
   */
  async adminInvite(req, res) {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
      const { email, role = 'designer', name } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'Жарамды email қажет' });
      }
      const validRoles = ['designer', 'manager', 'sales', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ success: false, error: 'Жарамсыз рөл' });
      }

      const orgId = req.user.organizationId;

      // Check if user with this email already exists in org
      const existing = await pool.query(
        'SELECT 1 FROM users WHERE organization_id = $1 AND email = $2',
        [orgId, email.trim().toLowerCase()]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ success: false, error: 'Бұл email тіркелген' });
      }

      // Check plan user limit
      const limitRes = await pool.query(
        `SELECT COALESCE(o.max_users_override, p.max_users) AS user_limit
         FROM organizations o
         LEFT JOIN subscription_plans p ON p.code = o.current_plan_code
         WHERE o.id = $1`,
        [orgId]
      );
      const userLimit = parseInt(limitRes.rows[0]?.user_limit, 10);
      if (Number.isFinite(userLimit) && userLimit > 0) {
        const countRes = await pool.query(
          `SELECT COUNT(*)::int AS n FROM users WHERE organization_id = $1 AND is_active = true`,
          [orgId]
        );
        const activeUsers = countRes.rows[0]?.n || 0;
        if (activeUsers >= userLimit) {
          return res.status(402).json({
            success: false,
            code: 'PLAN_USER_LIMIT_REACHED',
            error: `Тарифтегі пайдаланушы лимиті бітті (${activeUsers}/${userLimit}). Жоғары тарифке көтеріңіз.`,
            limit: userLimit,
            current: activeUsers,
          });
        }
      }

      // Delete any old pending invite for this email+org
      await pool.query(
        `DELETE FROM user_invitations WHERE organization_id = $1 AND email = $2`,
        [orgId, email.trim().toLowerCase()]
      );

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Get org info for email
      const orgRes = await pool.query(
        'SELECT name, slug FROM organizations WHERE id = $1',
        [orgId]
      );
      const org = orgRes.rows[0];

      await pool.query(
        `INSERT INTO user_invitations (organization_id, email, name, role, token, invited_by, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orgId, email.trim().toLowerCase(), name?.trim() || null, role, token, req.user.id, expiresAt]
      );

      const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'https://app.gardina.kz';
      const acceptUrl = `${appUrl}/accept-invite?token=${token}`;
      const lang = (req.headers['accept-language'] || '').toLowerCase().includes('kk') ? 'kz' : 'ru';

      await emailService.send('invite', email.trim().toLowerCase(), {
        organizationName: org?.name || 'Gardina',
        inviterName: req.user.name,
        role,
        acceptUrl,
        expiresInDays: 7,
      }, lang);

      return res.json({ success: true, message: 'Шақыру хаты жіберілді' });
    } catch (error) {
      console.error(`[UserController.adminInvite] ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/users/invite/:token — validate invite token (public)
   */
  async getInvite(req, res) {
    try {
      const { token } = req.params;
      const r = await pool.query(
        `SELECT ui.email, ui.name, ui.role, ui.expires_at, ui.accepted_at,
                o.name AS org_name, o.slug AS org_slug
         FROM user_invitations ui
         JOIN organizations o ON o.id = ui.organization_id
         WHERE ui.token = $1`,
        [token]
      );
      const inv = r.rows[0];
      if (!inv) return res.status(404).json({ success: false, error: 'Шақыру табылмады немесе мерзімі өтті' });
      if (inv.accepted_at) return res.status(400).json({ success: false, error: 'Шақыру бұрын қабылданған' });
      if (new Date(inv.expires_at) < new Date()) return res.status(400).json({ success: false, error: 'Шақырудың мерзімі өтті' });
      return res.json({ success: true, data: { email: inv.email, name: inv.name, role: inv.role, orgName: inv.org_name, orgSlug: inv.org_slug } });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/users/invite/:token/accept — accept invite, create account
   */
  async acceptInvite(req, res) {
    const client = await pool.connect();
    try {
      const { token } = req.params;
      const { password, name: nameOverride } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ success: false, error: 'Пароль кемінде 6 таңба болуы керек' });
      }

      const r = await client.query(
        `SELECT ui.*, o.id AS org_id FROM user_invitations ui
         JOIN organizations o ON o.id = ui.organization_id
         WHERE ui.token = $1 FOR UPDATE`,
        [token]
      );
      const inv = r.rows[0];
      if (!inv) return res.status(404).json({ success: false, error: 'Шақыру табылмады' });
      if (inv.accepted_at) return res.status(400).json({ success: false, error: 'Шақыру бұрын қабылданған' });
      if (new Date(inv.expires_at) < new Date()) return res.status(400).json({ success: false, error: 'Шақырудың мерзімі өтті' });

      // Check if email already registered in this org
      const dup = await client.query(
        'SELECT 1 FROM users WHERE organization_id = $1 AND email = $2',
        [inv.organization_id, inv.email]
      );
      if (dup.rows.length > 0) {
        await client.query(`UPDATE user_invitations SET accepted_at = NOW() WHERE token = $1`, [token]);
        return res.status(409).json({ success: false, error: 'Бұл email тіркелген' });
      }

      await client.query('BEGIN');

      const finalName = nameOverride?.trim() || inv.name || inv.email.split('@')[0];
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user — phone is optional for invite-based users (email is identifier)
      const userRes = await client.query(
        `INSERT INTO users (organization_id, name, email, phone, password_hash, role, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING id, name, email, phone, role`,
        [inv.organization_id, finalName, inv.email, inv.email, passwordHash, inv.role]
      );
      const user = userRes.rows[0];

      await client.query(
        `UPDATE user_invitations SET accepted_at = NOW() WHERE token = $1`,
        [token]
      );

      await client.query('COMMIT');

      // Import AuthService for token generation
      const { AuthService } = await import('../../../infrastructure/services/AuthService.js');
      const authService = new AuthService();
      const tokens = authService.generateTokenPair(user);

      return res.status(201).json({
        success: true,
        data: {
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
          ...tokens,
        },
        message: 'Шақыру қабылданды, аккаунт жасалды',
      });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      console.error(`[UserController.acceptInvite] ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    } finally {
      client.release();
    }
  }

  /**
   * GET /api/users/invitations — list pending invitations (admin)
   */
  async listInvitations(req, res) {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
      const r = await pool.query(
        `SELECT ui.id, ui.email, ui.name, ui.role, ui.expires_at, ui.accepted_at, ui.created_at,
                u.name AS invited_by_name
         FROM user_invitations ui
         LEFT JOIN users u ON u.id = ui.invited_by
         WHERE ui.organization_id = $1
         ORDER BY ui.created_at DESC`,
        [req.user.organizationId]
      );
      return res.json({ success: true, data: r.rows });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/users/invitations/:id — revoke pending invite (admin)
   */
  async revokeInvitation(req, res) {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
      await pool.query(
        `DELETE FROM user_invitations WHERE id = $1 AND organization_id = $2 AND accepted_at IS NULL`,
        [req.params.id, req.user.organizationId]
      );
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get all assignees for measurement/order flow.
   * Route name is kept for backward compatibility.
   * GET /api/users/designers
   */
  async getDesigners(req, res) {
    try {
      const tid = getTenantId();
      const result = await pool.query(
        `SELECT id, name, email, phone, role, avatar_url, is_active, created_at
         FROM users
         WHERE organization_id = $1 AND role IN ('designer', 'manager', 'admin') AND is_active = true
         ORDER BY role, name`,
        [tid]
      );
      res.json({ success: true, data: result.rows, total: result.rows.length });
    } catch (error) {
      console.error(`[UserController.getDesigners] Failed: ${error.message}`);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch designers' });
    }
  }
}
