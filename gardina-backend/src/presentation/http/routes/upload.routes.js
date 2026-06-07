import { Router } from 'express';
import { UploadController } from '../controllers/UploadController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const uploadController = new UploadController();

// Public media proxy — streams private-bucket objects so <img src> works
// without making the S3 bucket publicly readable. Must be BEFORE the auth
// gate below (a browser can't attach a bearer token to an <img> request).
// Keys are unguessable UUID paths.
router.get('/file/*', (req, res) => uploadController.serveFile(req, res));

// All routes below require authentication
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
