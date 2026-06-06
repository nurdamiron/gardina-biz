import webpush from 'web-push';
import pool from '../database/config.js';
import { apnsService } from './APNsService.js';

/**
 * PushService - handles Web Push notifications
 */
export class PushService {
  constructor() {
    // Configure VAPID keys
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@gardina.kz';

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      this.isConfigured = true;
      console.log('PushService: VAPID keys configured');
    } else {
      this.isConfigured = false;
      console.warn('PushService: VAPID keys not configured, push notifications disabled');
    }
  }

  /**
   * Get VAPID public key for frontend
   */
  getPublicKey() {
    return process.env.VAPID_PUBLIC_KEY || null;
  }

  /**
   * Subscribe a user to push notifications.
   * organizationId is required so that subscriptions are tenant-scoped
   * and tenant-level cleanup/broadcast is safe.
   */
  async subscribe(userId, organizationId, subscription, userAgent = null) {
    const { endpoint, keys } = subscription;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      throw new Error('Invalid push subscription data');
    }
    if (!organizationId) {
      throw new Error('organizationId is required to create a push subscription');
    }

    const result = await pool.query(
      `INSERT INTO push_subscriptions (organization_id, user_id, endpoint, p256dh, auth, user_agent, last_used_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, endpoint)
       DO UPDATE SET
         organization_id = EXCLUDED.organization_id,
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         user_agent = EXCLUDED.user_agent,
         is_active = true,
         last_used_at = NOW()
       RETURNING *`,
      [organizationId, userId, endpoint, keys.p256dh, keys.auth, userAgent]
    );

    return result.rows[0];
  }

  /**
   * Register a native iOS (APNs) device token for a user. Stored in the same
   * push_subscriptions table with platform='ios'; the Web Push columns are kept
   * non-null (empty) and a synthetic `apns:<token>` endpoint reuses the existing
   * (user_id, endpoint) upsert key for idempotency.
   */
  async subscribeApns(userId, organizationId, deviceToken, userAgent = null) {
    if (!deviceToken) {
      throw new Error('deviceToken is required');
    }
    if (!organizationId) {
      throw new Error('organizationId is required to create a push subscription');
    }

    const endpoint = `apns:${deviceToken}`;
    const result = await pool.query(
      `INSERT INTO push_subscriptions (organization_id, user_id, endpoint, p256dh, auth, platform, device_token, user_agent, last_used_at)
       VALUES ($1, $2, $3, '', '', 'ios', $4, $5, NOW())
       ON CONFLICT (user_id, endpoint)
       DO UPDATE SET
         organization_id = EXCLUDED.organization_id,
         platform = 'ios',
         device_token = EXCLUDED.device_token,
         user_agent = EXCLUDED.user_agent,
         is_active = true,
         last_used_at = NOW()
       RETURNING *`,
      [organizationId, userId, endpoint, deviceToken, userAgent]
    );

    return result.rows[0];
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId, endpoint = null) {
    if (endpoint) {
      // Remove specific subscription
      await pool.query(
        'DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
        [userId, endpoint]
      );
    } else {
      // Remove all subscriptions for user
      await pool.query(
        'DELETE FROM push_subscriptions WHERE user_id = $1',
        [userId]
      );
    }
  }

  /**
   * Deactivate a subscription (when push fails with 410 Gone)
   */
  async deactivateSubscription(subscriptionId) {
    await pool.query(
      'UPDATE push_subscriptions SET is_active = false WHERE id = $1',
      [subscriptionId]
    );
  }

  /**
   * Get all active subscriptions for a user
   */
  async getSubscriptions(userId) {
    const result = await pool.query(
      'SELECT * FROM push_subscriptions WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    return result.rows;
  }

  /**
   * Send to one device — routes to APNs for iOS subscriptions, Web Push otherwise.
   */
  async sendToSubscription(subscription, payload) {
    if (subscription.platform === 'ios' || subscription.device_token) {
      return this.sendToApns(subscription, payload);
    }

    if (!this.isConfigured) {
      console.warn('PushService: Skipping push - not configured');
      return { success: false, error: 'not_configured' };
    }

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    };

    try {
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload),
        {
          TTL: 86400, // 24 hours
          urgency: payload.urgency || 'normal'
        }
      );

      // Update last used timestamp
      await pool.query(
        'UPDATE push_subscriptions SET last_used_at = NOW() WHERE id = $1',
        [subscription.id]
      );

      return { success: true };
    } catch (error) {
      console.error('PushService: Failed to send push:', error.message);

      // Handle expired subscriptions (410 Gone)
      if (error.statusCode === 410 || error.statusCode === 404) {
        await this.deactivateSubscription(subscription.id);
        return { success: false, error: 'subscription_expired' };
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Send to a native iOS device via APNs. Deactivates the subscription on
   * permanently-dead tokens so we stop retrying.
   */
  async sendToApns(subscription, payload) {
    const result = await apnsService.send(subscription.device_token, {
      title: payload.title,
      body: payload.body || payload.message,
      badge: payload.badge,
      data: payload.data,
    });

    if (result.success) {
      await pool.query(
        'UPDATE push_subscriptions SET last_used_at = NOW() WHERE id = $1',
        [subscription.id]
      );
      return { success: true };
    }

    const deadTokenReasons = ['BadDeviceToken', 'Unregistered', 'DeviceTokenNotForTopic'];
    if (result.status === 410 || deadTokenReasons.includes(result.reason)) {
      await this.deactivateSubscription(subscription.id);
      return { success: false, error: 'subscription_expired' };
    }

    return { success: false, error: result.reason || 'apns_failed' };
  }

  /**
   * Send push notification to all user's devices
   */
  async sendToUser(userId, payload) {
    const subscriptions = await this.getSubscriptions(userId);

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const results = await Promise.all(
      subscriptions.map(sub => this.sendToSubscription(sub, payload))
    );

    return {
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(userIds, payload) {
    const results = await Promise.all(
      userIds.map(userId => this.sendToUser(userId, payload))
    );

    return results.reduce(
      (acc, r) => ({
        sent: acc.sent + r.sent,
        failed: acc.failed + r.failed
      }),
      { sent: 0, failed: 0 }
    );
  }

  /**
   * Check if user has any active push subscriptions
   */
  async hasSubscription(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM push_subscriptions WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Get subscription count for user
   */
  async getSubscriptionCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM push_subscriptions WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Clean up old inactive subscriptions (run periodically)
   */
  async cleanupOldSubscriptions(daysOld = 30) {
    const days = Number.isFinite(Number(daysOld)) ? Math.max(1, Math.floor(Number(daysOld))) : 30;
    const result = await pool.query(
      `DELETE FROM push_subscriptions
       WHERE is_active = false
       OR (last_used_at < NOW() - ($1 || ' days')::interval)
       RETURNING id`,
      [String(days)]
    );
    return result.rowCount;
  }
}

// Singleton instance
export const pushService = new PushService();
