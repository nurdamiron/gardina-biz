import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { BillingController } from '../controllers/BillingController.js';

const router = Router();
const billingController = new BillingController();

router.use(authenticate);

router.get('/status', (req, res) => billingController.status(req, res));
router.post('/select-plan', (req, res) => billingController.selectPlan(req, res));
router.post('/start-pro-trial', (req, res) => billingController.startProTrial(req, res));

export default router;

