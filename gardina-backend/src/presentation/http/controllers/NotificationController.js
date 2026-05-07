import { PostgresNotificationRepository } from '../../../infrastructure/repositories/PostgresNotificationRepository.js';
import { pushService } from '../../../infrastructure/services/PushService.js';
import pool from '../../../infrastructure/database/config.js';
import { getTenantId } from '../../../infrastructure/tenant/tenantContext.js';

export class NotificationController {
  constructor() {
    this.notificationRepository = new PostgresNotificationRepository();
  }

  // ==================== NOTIFICATIONS ====================

  getAll = async (req, res) => {
    try {
      const { limit, offset, isRead } = req.query;
      const result = await this.notificationRepository.findAll(req.user.id, {
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
        isRead: isRead === 'true' ? true : (isRead === 'false' ? false : undefined)
      });
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('NotificationController.getAll error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  create = async (req, res) => {
    try {
      const data = { ...req.body, userId: req.body.userId || req.user.id };
      const notification = await this.notificationRepository.create(data);
      res.status(201).json({ success: true, data: notification });
    } catch(error) {
      console.error('NotificationController.create error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  getUnreadCount = async (req, res) => {
    try {
      const tid = getTenantId();
      const result = await pool.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false AND organization_id = $2',
        [req.user.id, tid]
      );
      res.json({ success: true, data: { count: parseInt(result.rows[0].count) } });
    } catch (error) {
      console.error('NotificationController.getUnreadCount error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  markRead = async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await this.notificationRepository.markAsRead(id, req.user.id);
      if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });
      res.json({ success: true, data: notification });
    } catch (error) {
      console.error('NotificationController.markRead error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ==================== ADMIN ====================

  /**
   * GET /api/notifications/admin/all
   * Admin: get all notifications in the system
   */
  adminGetAll = async (req, res) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
      const { limit = 100, offset = 0, userId, type } = req.query;

      const tid = getTenantId();
      let query = `
        SELECT n.*, u.name as user_name, u.role as user_role
        FROM notifications n
        LEFT JOIN users u ON u.id = n.user_id
        WHERE n.organization_id = $1
      `;
      const params = [tid];
      let i = 2;
      if (userId) {
        query += ` AND n.user_id = $${i++}`;
        params.push(userId);
      }
      if (type) {
        query += ` AND n.type = $${i++}`;
        params.push(type);
      }
      query += ` ORDER BY n.created_at DESC LIMIT $${i++} OFFSET $${i++}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await pool.query(query, params);

      let countQuery = 'SELECT COUNT(*) FROM notifications n WHERE n.organization_id = $1';
      const countParams = [tid];
      if (userId) {
        countQuery += ' AND n.user_id = $2';
        countParams.push(userId);
      }
      const countResult = await pool.query(countQuery, countParams);

      res.json({ success: true, data: result.rows, total: parseInt(countResult.rows[0].count) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/notifications/admin/stats
   * Admin: notification system statistics
   */
  adminGetStats = async (req, res) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });

      const tid = getTenantId();

      const [total, unread, byType, pushSubs, recentActivity] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM notifications WHERE organization_id = $1', [tid]),
        pool.query(
          'SELECT COUNT(*) FROM notifications WHERE is_read = false AND organization_id = $1',
          [tid]
        ),
        pool.query(
          `SELECT type, COUNT(*) as count FROM notifications WHERE organization_id = $1 GROUP BY type ORDER BY count DESC`,
          [tid]
        ),
        pool.query(
          `SELECT COUNT(*) FROM push_subscriptions ps
           INNER JOIN users u ON u.id = ps.user_id AND u.organization_id = $1
           WHERE ps.is_active = true`,
          [tid]
        ),
        pool.query(
          `
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM notifications
          WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '7 days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `,
          [tid]
        ),
      ]);

      res.json({
        success: true,
        data: {
          total: parseInt(total.rows[0].count),
          unread: parseInt(unread.rows[0].count),
          byType: byType.rows,
          activePushSubscriptions: parseInt(pushSubs.rows[0].count),
          recentActivity: recentActivity.rows,
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/notifications/admin/broadcast
   * Admin: send notification to users (all / by role / specific user)
   */
  adminBroadcast = async (req, res) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });

      const { title, body, message, type = 'info', targetRole, targetUserId, sendPush = false, actionUrl } = req.body;
      const text = body || message;

      if (!title || !text) return res.status(400).json({ success: false, error: 'title and body are required' });

      const tid = getTenantId();

      let usersQuery = 'SELECT id FROM users WHERE is_active = true AND organization_id = $1';
      const params = [tid];
      if (targetUserId) {
        usersQuery = 'SELECT id FROM users WHERE id = $1 AND organization_id = $2';
        params.length = 0;
        params.push(targetUserId, tid);
      } else if (targetRole) {
        usersQuery =
          'SELECT id FROM users WHERE role = $1 AND is_active = true AND organization_id = $2';
        params.length = 0;
        params.push(targetRole, tid);
      }

      const users = await pool.query(usersQuery, params);
      const userIds = users.rows.map(u => u.id);

      let sent = 0;
      let pushSent = 0;

      for (const userId of userIds) {
        await pool.query(
          `INSERT INTO notifications (organization_id, user_id, type, title, message, action_url, is_read)
           VALUES ($1, $2, $3, $4, $5, $6, false)`,
          [tid, userId, type, title, text, actionUrl || null]
        );
        sent++;

        if (sendPush) {
          try {
            const result = await pushService.sendToUser(userId, { title, body: text, icon: '/pwa-192x192.png', data: { url: actionUrl || '/' } });
            pushSent += result.sent || 0;
          } catch (e) { /* push optional */ }
        }
      }

      res.json({ success: true, data: { sent, pushSent, recipients: userIds.length } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/notifications/admin/:id
   * Admin: delete a notification
   */
  adminDelete = async (req, res) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
      const tid = getTenantId();
      await pool.query('DELETE FROM notifications WHERE id = $1 AND organization_id = $2', [
        req.params.id,
        tid,
      ]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  markAllRead = async (req, res) => {
    try {
      const count = await this.notificationRepository.markAllAsRead(req.user.id);
      res.json({ success: true, count });
    } catch (error) {
      console.error('NotificationController.markAllRead error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ==================== PUSH SUBSCRIPTION ====================

  /**
   * GET /api/notifications/push/vapid-key
   * Get VAPID public key for frontend
   */
  getVapidKey = async (req, res) => {
    try {
      const publicKey = pushService.getPublicKey();

      if (!publicKey) {
        return res.status(503).json({
          success: false,
          error: 'Push notifications not configured'
        });
      }

      res.json({
        success: true,
        data: { publicKey }
      });
    } catch (error) {
      console.error('NotificationController.getVapidKey error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/notifications/push/subscribe
   * Subscribe to push notifications
   */
  subscribePush = async (req, res) => {
    try {
      const { endpoint, keys } = req.body;
      const userAgent = req.headers['user-agent'];

      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({
          success: false,
          error: 'Invalid subscription data. Required: endpoint, keys.p256dh, keys.auth'
        });
      }

      const subscription = await pushService.subscribe(
        req.user.id,
        req.user.organizationId,
        { endpoint, keys },
        userAgent
      );

      res.status(201).json({
        success: true,
        data: {
          id: subscription.id,
          message: 'Successfully subscribed to push notifications'
        }
      });
    } catch (error) {
      console.error('NotificationController.subscribePush error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/notifications/push/unsubscribe
   * Unsubscribe from push notifications
   */
  unsubscribePush = async (req, res) => {
    try {
      const { endpoint } = req.body;

      await pushService.unsubscribe(req.user.id, endpoint);

      res.json({
        success: true,
        message: 'Successfully unsubscribed from push notifications'
      });
    } catch (error) {
      console.error('NotificationController.unsubscribePush error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/notifications/push/status
   * Check push subscription status
   */
  getPushStatus = async (req, res) => {
    try {
      const hasSubscription = await pushService.hasSubscription(req.user.id);
      const subscriptionCount = await pushService.getSubscriptionCount(req.user.id);

      res.json({
        success: true,
        data: {
          isSubscribed: hasSubscription,
          deviceCount: subscriptionCount
        }
      });
    } catch (error) {
      console.error('NotificationController.getPushStatus error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/notifications/test-push
   * Send test push notification (for development)
   */
  sendTestPush = async (req, res) => {
    try {
      const result = await pushService.sendToUser(req.user.id, {
        title: 'Тест хабарлама',
        body: 'Push уведомления жұмыс істеп тұр!',
        icon: '/pwa-192x192.png',
        badge: '/badge-72x72.png',
        data: { url: '/' }
      });

      res.json({
        success: true,
        data: result,
        message: result.sent > 0
          ? `Test notification sent to ${result.sent} device(s)`
          : 'No active push subscriptions found'
      });
    } catch (error) {
      console.error('NotificationController.sendTestPush error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ==================== USER PREFERENCES ====================

  /**
   * GET /api/notifications/preferences
   * Get user notification preferences
   */
  getPreferences = async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT * FROM user_notification_preferences WHERE user_id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        // Create default preferences
        const insertResult = await pool.query(
          'INSERT INTO user_notification_preferences (user_id) VALUES ($1) RETURNING *',
          [req.user.id]
        );
        return res.json({ success: true, data: this.formatPreferences(insertResult.rows[0]) });
      }

      res.json({ success: true, data: this.formatPreferences(result.rows[0]) });
    } catch (error) {
      console.error('NotificationController.getPreferences error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PUT /api/notifications/preferences
   * Update user notification preferences
   */
  updatePreferences = async (req, res) => {
    try {
      const allowedFields = [
        'deal_status_inapp', 'deal_status_push', 'deal_status_sms',
        'payment_inapp', 'payment_push', 'payment_sms',
        'task_assigned_inapp', 'task_assigned_push', 'task_assigned_sms',
        'measurement_reminder_inapp', 'measurement_reminder_push', 'measurement_reminder_sms',
        'stock_low_inapp', 'stock_low_push', 'stock_low_sms',
        'proposal_viewed_inapp', 'proposal_viewed_push', 'proposal_viewed_sms',
        'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end'
      ];

      // Filter only allowed fields
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      // Build dynamic UPDATE query
      const setClauses = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`);
      const values = [req.user.id, ...Object.values(updates)];

      const result = await pool.query(
        `UPDATE user_notification_preferences
         SET ${setClauses.join(', ')}, updated_at = NOW()
         WHERE user_id = $1
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        // Create preferences if not exist
        const insertResult = await pool.query(
          'INSERT INTO user_notification_preferences (user_id) VALUES ($1) RETURNING *',
          [req.user.id]
        );

        // Retry update
        const retryResult = await pool.query(
          `UPDATE user_notification_preferences
           SET ${setClauses.join(', ')}, updated_at = NOW()
           WHERE user_id = $1
           RETURNING *`,
          values
        );
        return res.json({ success: true, data: this.formatPreferences(retryResult.rows[0]) });
      }

      res.json({ success: true, data: this.formatPreferences(result.rows[0]) });
    } catch (error) {
      console.error('NotificationController.updatePreferences error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Format preferences for frontend
   */
  formatPreferences(row) {
    return {
      dealStatus: {
        inapp: row.deal_status_inapp,
        push: row.deal_status_push,
        sms: row.deal_status_sms
      },
      payment: {
        inapp: row.payment_inapp,
        push: row.payment_push,
        sms: row.payment_sms
      },
      taskAssigned: {
        inapp: row.task_assigned_inapp,
        push: row.task_assigned_push,
        sms: row.task_assigned_sms
      },
      measurementReminder: {
        inapp: row.measurement_reminder_inapp,
        push: row.measurement_reminder_push,
        sms: row.measurement_reminder_sms
      },
      stockLow: {
        inapp: row.stock_low_inapp,
        push: row.stock_low_push,
        sms: row.stock_low_sms
      },
      proposalViewed: {
        inapp: row.proposal_viewed_inapp,
        push: row.proposal_viewed_push,
        sms: row.proposal_viewed_sms
      },
      quietHours: {
        enabled: row.quiet_hours_enabled,
        start: row.quiet_hours_start,
        end: row.quiet_hours_end
      }
    };
  }
}
