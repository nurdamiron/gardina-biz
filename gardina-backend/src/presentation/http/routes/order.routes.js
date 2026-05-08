import { Router } from 'express';
import { OrderController } from '../controllers/OrderController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const orderController = new OrderController();

/**
 * Order Routes
 * Base path: /api/orders
 */

// Apply authentication to all order routes
router.use(authenticate);

// Get funnel stats
router.get('/funnel', (req, res) => orderController.getFunnel(req, res));

// GET /api/orders - Get all orders
router.get('/', (req, res) => orderController.getAll(req, res));

// GET /api/orders/:id - Get order by ID
router.get('/:id', (req, res) => orderController.getById(req, res));

// POST /api/orders - Create new order
router.post('/', (req, res) => orderController.create(req, res));

// PATCH /api/orders/:id/status - Update order status
router.patch('/:id/status', (req, res) => orderController.updateStatus(req, res));

// PATCH /api/orders/:id/payment - Record payment
router.patch('/:id/payment', (req, res) => orderController.recordPayment(req, res));

// DELETE /api/orders/:id - Delete order
router.delete('/:id', (req, res) => orderController.delete(req, res));

export default router;

