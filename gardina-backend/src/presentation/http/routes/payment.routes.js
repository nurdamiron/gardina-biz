import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const controller = new PaymentController();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/payments - List all payments with filters
router.get('/', controller.getAll);

// POST /api/payments - Create new payment
router.post('/', controller.create);

// DELETE /api/payments/:id - Delete payment
router.delete('/:id', controller.delete);

export default router;
