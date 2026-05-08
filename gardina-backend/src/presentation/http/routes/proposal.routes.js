import { Router } from 'express';
import { ProposalController } from '../controllers/ProposalController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const proposalController = new ProposalController();

// All routes require authentication
router.use(authenticate);

// GET /api/proposals - get all proposals (with filters)
router.get('/', (req, res) => proposalController.getAll(req, res));

// GET /api/proposals/:id - get proposal by ID
router.get('/:id', (req, res) => proposalController.getById(req, res));

// POST /api/proposals - create proposal
router.post('/', (req, res) => proposalController.create(req, res));

// PUT /api/proposals/:id - update proposal
router.put('/:id', (req, res) => proposalController.update(req, res));

// DELETE /api/proposals/:id - delete proposal
router.delete('/:id', (req, res) => proposalController.delete(req, res));

export default router;
