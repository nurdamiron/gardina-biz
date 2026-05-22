import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { enforceUserLimit } from '../middleware/billing.middleware.js';

const router = Router();
const userController = new UserController();

// Apply authentication to all user routes
router.use(authenticate);

// IMPORTANT: Static routes MUST come before /:id to prevent "designers" being parsed as UUID
// Get all designers — accessible to all authenticated users (needed for task assignment)
router.get('/designers', (req, res) => userController.getDesigners(req, res));

// Profile self-service (before /:id)
router.put('/me', (req, res) => userController.updateMe(req, res));
router.post('/me/change-password', (req, res) => userController.changePassword(req, res));

// List users — admin and manager only (contains private contact info for all staff)
router.get('/', authorize('admin', 'manager'), (req, res) => userController.getAll(req, res));

// Get specific user — admin and manager only
router.get('/:id', authorize('admin', 'manager'), (req, res) => userController.getById(req, res));

// ── Admin routes ────────────────────────────────────────────────────
router.post('/admin/create', authorize('admin'), enforceUserLimit, (req, res) => userController.adminCreate(req, res));
router.put('/admin/:id', authorize('admin'), (req, res) => userController.adminUpdate(req, res));
router.post('/admin/:id/reset-password', authorize('admin'), (req, res) => userController.adminResetPassword(req, res));
router.delete('/admin/:id', authorize('admin'), (req, res) => userController.adminDelete(req, res));

// ── Invite routes ────────────────────────────────────────────────────
// POST /api/users/admin/invite — send invite email (admin only, enforces plan limit)
router.post('/admin/invite', authorize('admin'), (req, res) => userController.adminInvite(req, res));
// GET /api/users/invitations — list pending invites (admin)
router.get('/invitations', authorize('admin'), (req, res) => userController.listInvitations(req, res));
// DELETE /api/users/invitations/:id — revoke invite (admin)
router.delete('/invitations/:id', authorize('admin'), (req, res) => userController.revokeInvitation(req, res));

export default router;
