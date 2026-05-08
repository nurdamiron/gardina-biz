import { Router } from 'express';
import { UploadController } from '../controllers/UploadController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const uploadController = new UploadController();

// All routes require authentication
router.use(authenticate);

// POST /api/upload/photo - upload single photo
router.post('/photo',
  uploadController.single('photo'),
  (req, res) => uploadController.uploadPhoto(req, res)
);

// POST /api/upload/photos - upload multiple photos
router.post('/photos',
  uploadController.multiple('photos', 10),
  (req, res) => uploadController.uploadMultiple(req, res)
);

export default router;
