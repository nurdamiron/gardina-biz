import { Router } from 'express';
import AuditLogController from '../controllers/AuditLogController.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Audit logs contain full change history — admin and manager only
router.get('/', authorize('admin', 'manager'), (req, res) => AuditLogController.getLogsForEntity(req, res));

export default router;
