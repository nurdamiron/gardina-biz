import { Router } from 'express';
import { DealController } from '../controllers/DealController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const dealController = new DealController();

/**
 * Deal Routes
 * Base path: /api/deals
 */

// Apply authentication to all deal routes
router.use(authenticate);

// Get funnel stats
router.get('/funnel', (req, res) => dealController.getFunnel(req, res));

// GET /api/deals - Get all deals
router.get('/', (req, res) => dealController.getAll(req, res));

// GET /api/deals/:id - Get deal by ID
router.get('/:id', (req, res) => dealController.getById(req, res));

// POST /api/deals - Create new deal
router.post('/', (req, res) => dealController.create(req, res));

// PATCH /api/deals/:id/status - Update deal status
router.patch('/:id/status', (req, res) => dealController.updateStatus(req, res));

// PATCH /api/deals/:id/payment - Record payment
router.patch('/:id/payment', (req, res) => dealController.recordPayment(req, res));

// DELETE /api/deals/:id - Delete deal
router.delete('/:id', (req, res) => dealController.delete(req, res));

export default router;
