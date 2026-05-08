import { Router } from 'express';
import { InstallationController } from '../controllers/InstallationController.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();
const controller = new InstallationController();

router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
// Mutations: admin and manager only
router.post('/', authorize('admin', 'manager'), controller.create);
router.put('/:id', authorize('admin', 'manager'), controller.update);
router.delete('/:id', authorize('admin', 'manager'), controller.delete);

export default router;
