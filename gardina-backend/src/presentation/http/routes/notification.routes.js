import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();
const controller = new NotificationController();

// Public route - get VAPID public key
router.get('/push/vapid-key', controller.getVapidKey);

// All other routes require authentication
router.use(authenticate);

// GET /api/notifications - Get user notifications
router.get('/', controller.getAll);

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', controller.getUnreadCount);

// POST /api/notifications - Create notification (admin/system)
router.post('/', controller.create);

// PATCH /api/notifications/:id/read - Mark as read
router.patch('/:id/read', controller.markRead);

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', controller.markAllRead);

// ==================== PUSH SUBSCRIPTION ====================

// POST /api/notifications/push/subscribe - Subscribe to push (Web Push)
router.post('/push/subscribe', controller.subscribePush);

// POST /api/notifications/push/apns - Register a native iOS APNs device token
router.post('/push/apns', controller.registerApnsDevice);

// DELETE /api/notifications/push/unsubscribe - Unsubscribe from push
router.delete('/push/unsubscribe', controller.unsubscribePush);

// GET /api/notifications/push/status - Check push subscription status
router.get('/push/status', controller.getPushStatus);

// ==================== USER PREFERENCES ====================

// GET /api/notifications/preferences - Get user notification preferences
router.get('/preferences', controller.getPreferences);

// PUT /api/notifications/preferences - Update user notification preferences
router.put('/preferences', controller.updatePreferences);

// ==================== TESTING (dev only) ====================

// POST /api/notifications/test-push - Send test push notification
router.post('/test-push', controller.sendTestPush);

// ==================== ADMIN ROUTES ====================
router.get('/admin/stats', authorize('admin'), controller.adminGetStats);
router.get('/admin/all', authorize('admin'), controller.adminGetAll);
router.post('/admin/broadcast', authorize('admin'), controller.adminBroadcast);
router.delete('/admin/:id', authorize('admin'), controller.adminDelete);

export default router;
