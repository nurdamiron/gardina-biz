import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { OnboardingController } from '../controllers/OnboardingController.js';

const router = Router();
const ctrl = new OnboardingController();

router.use(authenticate);
router.get('/checklist', (req, res) => ctrl.getChecklist(req, res));
router.delete('/sample-data', authorize('admin'), (req, res) => ctrl.purgeSamples(req, res));

export default router;
