import pool from '../../infrastructure/database/config.js';
import { pushService } from '../../infrastructure/services/PushService.js';
import { getTenantId } from '../../infrastructure/tenant/tenantContext.js';

/**
 * NotificationService - Central service for all notifications
 * Handles routing to different channels (in-app, push, SMS, email)
 */
export class NotificationService {
  /**
   * Main method to send notification
   * @param {string} eventType - e.g., 'deal.status_changed', 'payment.received'
   * @param {string[]} recipientIds - Array of user IDs
   * @param {object} data - Data for template interpolation
   * @param {object} options - Additional options
   */
  static async notify(eventType, recipientIds, data, options = {}) {
    const results = {
      inapp: { sent: 0, failed: 0 },
      push: { sent: 0, failed: 0 },
      sms: { sent: 0, failed: 0 }
    };

    // Get template for this event type
    const template = await this.getTemplate(eventType);
    if (!template) {
      console.warn(`NotificationService: No template for event type: ${eventType}`);
      return results;
    }

    // Process each recipient
    for (const userId of recipientIds) {
      try {
        // Get user preferences
        const prefs = await this.getUserPreferences(userId);

        // Check quiet hours
        const isQuietTime = this.isQuietHours(prefs);

        // Interpolate template with data
        const notification = this.interpolateTemplate(template, data);

        // Channel: In-App (always send unless explicitly disabled)
        const inAppPref = prefs[`${this.normalizeEventType(eventType)}_inapp`];
        if (inAppPref !== false) {
          try {
            await this.sendInApp(userId, eventType, notification, data);
            results.inapp.sent++;
          } catch (e) {
            console.error('In-app notification failed:', e.message);
            results.inapp.failed++;
          }
        }

        // Channel: Push (skip during quiet hours)
        const pushPref = prefs[`${this.normalizeEventType(eventType)}_push`];
        if (pushPref && !isQuietTime) {
          try {
            const pushResult = await this.sendPush(userId, notification, data);
            results.push.sent += pushResult.sent;
            results.push.failed += pushResult.failed;
          } catch (e) {
            console.error('Push notification failed:', e.message);
            results.push.failed++;
          }
        }

        // Channel: SMS (only for critical events, skip during quiet hours)
        const smsPref = prefs[`${this.normalizeEventType(eventType)}_sms`];
        if (smsPref && !isQuietTime && options.allowSms !== false) {
          try {
            await this.sendSms(userId, notification);
            results.sms.sent++;
          } catch (e) {
            console.error('SMS notification failed:', e.message);
            results.sms.failed++;
          }
        }

      } catch (error) {
        console.error(`NotificationService: Error processing recipient ${userId}:`, error);
      }
    }

    return results;
  }

  /**
   * Normalize event type to preference column name
   * e.g., 'deal.status_changed' -> 'deal_status'
   */
  static normalizeEventType(eventType) {
    const mapping = {
      'deal.created': 'deal_status',
      'deal.status_changed': 'deal_status',
      'payment.received': 'payment',
      'task.assigned': 'task_assigned',
      'measurement.scheduled': 'task_assigned',
      'measurement.reminder': 'measurement_reminder',
      'stock.low': 'stock_low',
      'proposal.sent': 'proposal_viewed',
      'proposal.viewed': 'proposal_viewed',
      'proposal.accepted': 'deal_status'
    };
    return mapping[eventType] || 'deal_status';
  }

  /**
   * Get notification template from database
   */
  static async getTemplate(eventType) {
    const result = await pool.query(
      'SELECT * FROM notification_templates WHERE event_type = $1 AND is_active = true',
      [eventType]
    );

    if (result.rows.length === 0) {
      // Return default template
      return {
        title_template: 'Хабарлама',
        body_template: '{message}',
        action_url_template: '/',
        icon: 'notifications'
      };
    }

    return result.rows[0];
  }

  /**
   * Get user notification preferences
   */
  static async getUserPreferences(userId) {
    const result = await pool.query(
      'SELECT * FROM user_notification_preferences WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Return defaults
      return {
        deal_status_inapp: true,
        deal_status_push: true,
        deal_status_sms: false,
        payment_inapp: true,
        payment_push: true,
        payment_sms: false,
        task_assigned_inapp: true,
        task_assigned_push: true,
        task_assigned_sms: false,
        measurement_reminder_inapp: true,
        measurement_reminder_push: true,
        measurement_reminder_sms: true,
        stock_low_inapp: true,
        stock_low_push: true,
        stock_low_sms: false,
        proposal_viewed_inapp: true,
        proposal_viewed_push: true,
        proposal_viewed_sms: false,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00'
      };
    }

    return result.rows[0];
  }

  /**
   * Check if current time is within quiet hours
   */
  static isQuietHours(prefs) {
    if (!prefs.quiet_hours_enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = (prefs.quiet_hours_start || '22:00').split(':').map(Number);
    const [endHour, endMin] = (prefs.quiet_hours_end || '08:00').split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  }

  /**
   * Interpolate template placeholders with data
   */
  static interpolateTemplate(template, data) {
    const interpolate = (str) => {
      if (!str) return str;
      return str.replace(/\{(\w+)\}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : match;
      });
    };

    return {
      title: interpolate(template.title_template),
      body: interpolate(template.body_template),
      actionUrl: interpolate(template.action_url_template),
      icon: template.icon || 'notifications'
    };
  }

  /**
   * Send in-app notification
   */
  static async sendInApp(userId, eventType, notification, data) {
    const tid = getTenantId();
    const result = await pool.query(
      `INSERT INTO notifications (
        organization_id, user_id, type, title, message, action_url, metadata, event_type, entity_type, entity_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        tid,
        userId,
        data.notificationType || 'info',
        notification.title,
        notification.body,
        notification.actionUrl,
        JSON.stringify(data),
        eventType,
        data.entityType || null,
        data.entityId || null,
      ]
    );

    // Log delivery
    await this.logDelivery(result.rows[0].id, userId, 'inapp', 'sent');

    return result.rows[0];
  }

  /**
   * Send push notification
   */
  static async sendPush(userId, notification, data) {
    const payload = {
      title: notification.title,
      body: notification.body,
      icon: '/pwa-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        url: notification.actionUrl,
        ...data
      },
      tag: data.entityId || 'default', // Prevents duplicate notifications
      renotify: true
    };

    const result = await pushService.sendToUser(userId, payload);

    // Log delivery
    if (result.sent > 0) {
      await this.logDelivery(null, userId, 'push', 'sent');
    }
    if (result.failed > 0) {
      await this.logDelivery(null, userId, 'push', 'failed');
    }

    return result;
  }

  /**
   * Send SMS notification (using Twilio)
   */
  static async sendSms(userId, notification) {
    // Get user phone
    const userResult = await pool.query(
      'SELECT phone FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].phone) {
      throw new Error('User phone not found');
    }

    const phone = userResult.rows[0].phone;

    // Check if Twilio is configured
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioSid || !twilioToken || !twilioPhone) {
      console.warn('NotificationService: Twilio not configured, skipping SMS');
      return;
    }

    // Send SMS via Twilio
    const twilio = await import('twilio');
    const client = twilio.default(twilioSid, twilioToken);

    await client.messages.create({
      body: `${notification.title}\n${notification.body}`,
      from: twilioPhone,
      to: phone
    });

    await this.logDelivery(null, userId, 'sms', 'sent');
  }

  /**
   * Log notification delivery
   */
  static async logDelivery(notificationId, userId, channel, status, errorMessage = null) {
    try {
      await pool.query(
        `INSERT INTO notification_logs (notification_id, user_id, channel, status, error_message, sent_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [notificationId, userId, channel, status, errorMessage]
      );
    } catch (e) {
      console.error('Failed to log notification delivery:', e.message);
    }
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Notify when deal status changes
   */
  static async notifyDealStatusChanged(dealId, oldStatus, newStatus, designerId, managerId, clientName) {
    const recipients = [designerId, managerId].filter(Boolean);

    await this.notify('deal.status_changed', recipients, {
      dealId,
      oldStatus: this.translateStatus(oldStatus),
      newStatus: this.translateStatus(newStatus),
      clientName,
      entityType: 'deal',
      entityId: dealId,
      notificationType: 'info'
    });
  }

  /**
   * Notify when payment is received
   */
  static async notifyPaymentReceived(dealId, amount, designerId, managerId, clientName) {
    const recipients = [designerId, managerId].filter(Boolean);

    await this.notify('payment.received', recipients, {
      dealId,
      amount: new Intl.NumberFormat('kk-KZ').format(amount),
      clientName,
      entityType: 'deal',
      entityId: dealId,
      notificationType: 'info'
    });
  }

  /**
   * Notify when task is assigned
   */
  static async notifyTaskAssigned(measurementId, designerId, clientName, address) {
    await this.notify('task.assigned', [designerId], {
      measurementId,
      clientName,
      address,
      entityType: 'measurement',
      entityId: measurementId,
      notificationType: 'info'
    });
  }

  /**
   * Notify measurement reminder (1 hour before)
   */
  static async notifyMeasurementReminder(measurementId, designerId, clientName, address) {
    await this.notify('measurement.reminder', [designerId], {
      measurementId,
      clientName,
      address,
      entityType: 'measurement',
      entityId: measurementId,
      notificationType: 'warning'
    });
  }

  /**
   * Notify when stock is low
   */
  static async notifyStockLow(productId, productName, quantity, adminIds) {
    await this.notify('stock.low', adminIds, {
      productId,
      productName,
      quantity,
      entityType: 'product',
      entityId: productId,
      notificationType: 'warning'
    });
  }

  /**
   * Notify when proposal is viewed
   */
  static async notifyProposalViewed(measurementId, dealId, designerId, clientName) {
    await this.notify('proposal.viewed', [designerId], {
      measurementId,
      dealId,
      clientName,
      entityType: 'measurement',
      entityId: measurementId,
      notificationType: 'info'
    });
  }

  /**
   * Translate status to Kazakh
   */
  static translateStatus(status) {
    const translations = {
      'new': 'Жаңа',
      'scheduled': 'Жоспарланды',
      'measured': 'Өлшенді',
      'proposal_accepted': 'КП қабылданды',
      'contract_signed': 'Келісім жасалды',
      'in_production': 'Өндірісте',
      'ready': 'Дайын',
      'ready_for_installation': 'Орнатуға дайын',
      'installing': 'Орнатылуда',
      'completed': 'Аяқталды',
      'cancelled': 'Бас тартылды'
    };
    return translations[status] || status;
  }
}

export default NotificationService;
