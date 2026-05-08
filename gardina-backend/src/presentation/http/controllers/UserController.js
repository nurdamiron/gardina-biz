import bcrypt from 'bcryptjs';
import { PostgresUserRepository } from '../../../infrastructure/repositories/PostgresUserRepository.js';
import pool from '../../../infrastructure/database/config.js';
import { getTenantId } from '../../../infrastructure/tenant/tenantContext.js';

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
