import pool from '../../../infrastructure/database/config.js';
import { pushService } from '../../../infrastructure/services/PushService.js';

export class LeadController {
  async create(req, res) {
    try {
      const { name, phone, salon, comment } = req.body;

      if (!name?.trim() || !phone?.trim()) {
        return res.status(400).json({ success: false, error: 'Имя и телефон обязательны' });
      }

      const result = await pool.query(
        `INSERT INTO leads (name, phone, salon, comment)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name.trim(), phone.trim(), salon?.trim() || null, comment?.trim() || null]
      );

      const lead = result.rows[0];

      // Push to all admins (fire and forget)
      this._notifyAdmins(lead).catch((e) =>
        console.error('[LeadController] push error:', e.message)
      );

      res.status(201).json({ success: true, data: lead });
    } catch (error) {
      console.error('[LeadController.create]', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const { status } = req.query;
      const conditions = [];
      const params = [];

      if (status) {
        params.push(status);
        conditions.push(`status = $${params.length}`);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const result = await pool.query(
        `SELECT * FROM leads ${where} ORDER BY created_at DESC`,
        params
      );

      res.json({ success: true, data: result.rows, total: result.rowCount });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowed = ['new', 'contacted', 'converted', 'rejected'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, error: `Статус должен быть: ${allowed.join(', ')}` });
      }

      const result = await pool.query(
        `UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, id]
      );

      if (!result.rowCount) {
        return res.status(404).json({ success: false, error: 'Лид не найден' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async _notifyAdmins(lead) {
    const admins = await pool.query(
      `SELECT id FROM users WHERE role = 'admin' AND is_active = true`
    );

    if (!admins.rowCount) return;

    const payload = {
      title: '🆕 Новая заявка с сайта',
      body: `${lead.name} · ${lead.phone}${lead.salon ? ` · ${lead.salon}` : ''}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `lead-${lead.id}`,
      data: { url: '/admin/dashboard?tab=leads' },
    };

    await pushService.sendToUsers(
      admins.rows.map((u) => u.id),
      payload
    );
  }
}
