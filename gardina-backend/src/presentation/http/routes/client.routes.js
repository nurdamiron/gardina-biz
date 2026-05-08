import { Router } from 'express';
import { ClientController } from '../controllers/ClientController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const clientController = new ClientController();

// Apply authentication to all client routes
router.use(authenticate);

router.get('/', (req, res) => clientController.getAll(req, res));
router.get('/:id', (req, res) => clientController.getById(req, res));
router.post('/', (req, res) => clientController.create(req, res));
router.put('/:id', (req, res) => clientController.update(req, res));
router.delete('/:id', (req, res) => clientController.delete(req, res));

export default router;
