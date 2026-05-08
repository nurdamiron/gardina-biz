import { Router } from 'express';
import { MeasurementController } from '../controllers/MeasurementController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const measurementController = new MeasurementController();

// All routes require authentication
router.use(authenticate);

// GET /api/measurements
router.get('/', (req, res) => measurementController.getAll(req, res));

// GET /api/measurements/:id
router.get('/:id', (req, res) => measurementController.getById(req, res));

// POST /api/measurements
router.post('/', (req, res) => measurementController.create(req, res));

// PUT /api/measurements/:id - Update measurement with windows
router.put('/:id', (req, res) => measurementController.update(req, res));

// POST /api/measurements/:id/windows - Create window
router.post('/:id/windows', (req, res) => measurementController.addWindow(req, res));

// GET /api/measurements/:id/windows/:windowId - Get specific window
router.get('/:id/windows/:windowId', (req, res) => measurementController.getWindow(req, res));

// PUT /api/measurements/:id/windows/:windowId - Update window
router.put('/:id/windows/:windowId', (req, res) => measurementController.updateWindow(req, res));

// DELETE /api/measurements/:id/windows/:windowId - Delete window
router.delete('/:id/windows/:windowId', (req, res) => measurementController.removeWindow(req, res));

// POST /api/measurements/:id/photos
router.post('/:id/photos', (req, res) => measurementController.addPhoto(req, res));

// PATCH /api/measurements/:id/complete
router.patch('/:id/complete', (req, res) => measurementController.complete(req, res));

// POST /api/measurements/:id/payments
router.post('/:id/payments', (req, res) => measurementController.addPayment(req, res));

export default router;
