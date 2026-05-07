import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

/**
 * AWS S3 Upload Service
 * Uploads photos to S3 bucket with Local Storage Fallback
 */
export class S3UploadService {
  constructor() {
    // Validate AWS credentials
    if (!process.env.AWS_REGION) {
      throw new Error('AWS_REGION is not configured in environment variables');
    }
    if (!process.env.AWS_ACCESS_KEY_ID) {
      throw new Error('AWS_ACCESS_KEY_ID is not configured in environment variables');
    }
    if (!process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS_SECRET_ACCESS_KEY is not configured in environment variables');
    }
    if (!process.env.AWS_S3_BUCKET) {
      throw new Error('AWS_S3_BUCKET is not configured in environment variables');
    }

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.bucket = process.env.AWS_S3_BUCKET;
    this.prefix = process.env.AWS_S3_PREFIX || '';
  }

  /**
   * Upload file to S3 (or Local Storage on failure)
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalName - Original filename
   * @param {string} folder - Folder in bucket (measurements, profiles, etc)
   * @param {object} metadata - Additional metadata (dealId, measurementId, clientId, photoType)
   * @returns {Promise<{url: string, key: string}>}
   */
  async uploadFile(fileBuffer, originalName, folder = 'measurements', metadata = {}) {
    // Pick extension from contentType (verified by magic bytes), falling back
    // to original filename if upstream did not resolve it. We never trust
    // user-supplied originalName for path construction.
    const mimeToExt = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const safeExt = (
      mimeToExt[metadata.contentType] ||
      String(originalName || '').split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ||
      'bin'
    ).slice(0, 5);

    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let fileName;

    // Create structured path with prefix
    const prefixPath = this.prefix ? `${this.prefix}/` : '';

    // Whitelist folder name (no traversal)
    const safeFolder = /^[a-z0-9_-]{1,32}$/i.test(folder) ? folder : 'misc';

    if (metadata.dealId && metadata.measurementId) {
      const photoType = metadata.photoType || 'general';
      fileName = `${prefixPath}orders/${metadata.dealId}/${metadata.measurementId}/${photoType}/${uuidv4()}.${safeExt}`;
    } else if (metadata.clientId) {
      fileName = `${prefixPath}clients/${metadata.clientId}/${timestamp}/${uuidv4()}.${safeExt}`;
    } else {
      fileName = `${prefixPath}${safeFolder}/${timestamp}/${uuidv4()}.${safeExt}`;
    }

    // Try S3 Upload
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: fileName,
          Body: fileBuffer,
          // Trust magic-byte-detected content type if caller passed it,
          // otherwise fall back to extension lookup. application/octet-stream
          // is the safe default for unknown content.
          ContentType: metadata.contentType || this.getContentType(safeExt),
        },
      });

      await upload.done();

      const url = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

      return {
        url,
        key: fileName,
        bucket: this.bucket,
      };
    } catch (error) {
      console.error(`[S3UploadService] Upload failed for ${originalName}: ${error.message}`, {
        code: error.Code,
        requestId: error.RequestId,
        httpStatusCode: error.$metadata?.httpStatusCode
      });
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(files, folder = 'measurements') {
    const uploads = files.map(file =>
      this.uploadFile(file.buffer, file.originalname, folder, {
        contentType: file.contentType,
      })
    );

    return Promise.all(uploads);
  }

  /**
   * Get content type by extension
   */
  getContentType(extension) {
    const types = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
    };

    return types[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key) {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );

      return { success: true };
    } catch (error) {
      console.error(`[S3UploadService] Delete failed for key ${key}: ${error.message}`);
      throw new Error('Failed to delete file from S3');
    }
  }
}
