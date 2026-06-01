import { Router } from 'express';
import { LeadController } from '../controllers/LeadController.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();
const ctrl = new LeadController();

// Public — landing form submission
router.post('/', (req, res) => ctrl.create(req, res));

// Admin only
router.get('/', authenticate, authorize('admin'), (req, res) => ctrl.getAll(req, res));
router.patch('/:id/status', authenticate, authorize('admin'), (req, res) => ctrl.updateStatus(req, res));

export default router;
