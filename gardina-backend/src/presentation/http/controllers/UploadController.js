import multer from 'multer';
import { S3UploadService } from '../../../infrastructure/services/S3UploadService.js';

// Allow-list for image uploads. SVG is intentionally rejected — it can carry
// inline <script> and is an XSS vector when served back to a browser.
const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/**
 * Inspect the first bytes of a buffer and return one of our allowed image
 * mime types, or null if the magic bytes don't match. The browser-supplied
 * `file.mimetype` is not trusted because anyone can override it.
 *
 * Magic numbers per https://en.wikipedia.org/wiki/List_of_file_signatures
 *   JPEG  : FF D8 FF
 *   PNG   : 89 50 4E 47 0D 0A 1A 0A
 *   GIF   : "GIF87a" / "GIF89a"
 *   WebP  : "RIFF"???"WEBP"
 */
export function detectImageMime(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e &&
    buffer[3] === 0x47 && buffer[4] === 0x0d && buffer[5] === 0x0a &&
    buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  const ascii6 = buffer.subarray(0, 6).toString('ascii');
  if (ascii6 === 'GIF87a' || ascii6 === 'GIF89a') {
    return 'image/gif';
  }
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    // First-pass mime check (cheap; magic-byte check happens after upload).
    if (ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
    }
  },
});

/**
 * Upload Controller
 */
export class UploadController {
  constructor() {
    this.s3Service = new S3UploadService();
    this.upload = upload;
  }

  /**
   * Upload single photo
   */
  async uploadPhoto(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided',
        });
      }

      // Trust magic bytes, not browser-supplied mimetype
      const realMime = detectImageMime(req.file.buffer);
      if (!realMime) {
        return res.status(400).json({
          success: false,
          error: 'File contents do not match an allowed image type',
        });
      }

      const folder = req.body.folder || 'measurements';

      // Reject UUID-shaped fields containing path traversal — UUIDs are random,
      // anything else is suspicious.
      const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      const safeOr = (v) => (v === undefined || v === null || v === '' ? undefined : (isUuid(v) ? v : null));

      if (req.body.dealId && !isUuid(req.body.dealId)) {
        return res.status(400).json({ success: false, error: 'Invalid dealId' });
      }
      if (req.body.measurementId && !isUuid(req.body.measurementId)) {
        return res.status(400).json({ success: false, error: 'Invalid measurementId' });
      }
      if (req.body.clientId && !isUuid(req.body.clientId)) {
        return res.status(400).json({ success: false, error: 'Invalid clientId' });
      }
      if (req.body.photoType && !/^[a-z0-9_-]{1,32}$/i.test(req.body.photoType)) {
        return res.status(400).json({ success: false, error: 'Invalid photoType' });
      }

      const metadata = {
        dealId: safeOr(req.body.dealId),
        measurementId: safeOr(req.body.measurementId),
        clientId: safeOr(req.body.clientId),
        photoType: req.body.photoType || 'general',
        contentType: realMime,
      };

      const result = await this.s3Service.uploadFile(
        req.file.buffer,
        req.file.originalname,
        folder,
        metadata
      );

      res.json({
        success: true,
        data: {
          url: result.url,
          key: result.key,
        },
      });
    } catch (error) {
      console.error(`[UploadController.uploadPhoto] Upload failed for ${req.file?.originalname}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Upload multiple photos
   */
  async uploadMultiple(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files provided',
        });
      }

      // Validate magic bytes for every file before any S3 round-trip.
      for (const f of req.files) {
        if (!detectImageMime(f.buffer)) {
          return res.status(400).json({
            success: false,
            error: `Rejected ${f.originalname || 'file'}: contents do not match an allowed image type`,
          });
        }
      }

      const folder = req.body.folder || 'measurements';

      const filesWithMime = req.files.map(f => ({ ...f, contentType: detectImageMime(f.buffer) }));
      const results = await this.s3Service.uploadMultiple(filesWithMime, folder);

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error(`[UploadController.uploadMultiple] Multiple upload failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Serve (proxy) an uploaded media object from the private S3 bucket.
   * Public on purpose — keys are random UUIDs and <img src> cannot send auth
   * headers. Streams bytes through the backend so a private bucket still works.
   */
  async serveFile(req, res) {
    try {
      const key = req.params[0]; // everything after /file/
      if (!key || key.includes('..')) {
        return res.status(400).json({ success: false, error: 'Invalid key' });
      }

      const obj = await this.s3Service.getObject(key);

      res.setHeader('Content-Type', obj.contentType);
      if (obj.contentLength != null) res.setHeader('Content-Length', obj.contentLength);
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');

      obj.body.on('error', () => {
        if (!res.headersSent) res.status(500).end();
      });
      obj.body.pipe(res);
    } catch (error) {
      const notFound = error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404;
      if (!notFound) {
        console.error(`[UploadController.serveFile] Failed for ${req.params[0]}: ${error.message}`);
      }
      res.status(notFound ? 404 : 500).json({ success: false, error: 'File not available' });
    }
  }

  /**
   * Middleware for single file
   */
  single(fieldName = 'photo') {
    return this.upload.single(fieldName);
  }

  /**
   * Middleware for multiple files
   */
  multiple(fieldName = 'photos', maxCount = 10) {
    return this.upload.array(fieldName, maxCount);
  }
}
