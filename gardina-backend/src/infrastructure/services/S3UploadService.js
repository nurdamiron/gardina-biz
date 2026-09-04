import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import dotenv from 'dotenv';
import { buildUploadKey, getContentType } from './uploadKey.js';

dotenv.config();

/**
 * AWS S3 Upload Service
 * Uploads photos to an S3 bucket. See LocalUploadService for the on-disk
 * alternative (selected via UPLOAD_DRIVER — this one requires AWS_* creds).
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
    // Public base for served media. The S3 bucket is NOT publicly readable, so
    // uploaded objects are exposed through the backend proxy (/api/upload/file/*)
    // instead of a direct S3 URL (which returns 403 to anonymous <img> requests).
    this.publicApiBase = (process.env.PUBLIC_API_URL || process.env.API_PUBLIC_URL || 'https://api.gardina.kz').replace(/\/+$/, '');
  }

  /**
   * Stream an object back from S3 using the backend's own (valid) credentials.
   * Lets <img src> work against a private bucket without a public bucket policy.
   * @param {string} key - S3 object key (e.g. "uploads/products/.../uuid.png")
   * @returns {Promise<{body: ReadableStream, contentType: string, contentLength: number}>}
   */
  async getObject(key) {
    const res = await this.s3Client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key })
    );
    return {
      body: res.Body,
      contentType: res.ContentType || 'application/octet-stream',
      contentLength: res.ContentLength,
    };
  }

  /**
   * Upload file to S3.
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalName - Original filename
   * @param {string} folder - Folder in bucket (measurements, profiles, etc)
   * @param {object} metadata - Additional metadata (dealId, measurementId, clientId, photoType)
   * @returns {Promise<{url: string, key: string}>}
   */
  async uploadFile(fileBuffer, originalName, folder = 'measurements', metadata = {}) {
    const fileName = buildUploadKey(originalName, folder, metadata, this.prefix);

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
          ContentType: metadata.contentType || getContentType(fileName.split('.').pop()),
        },
      });

      await upload.done();

      // Serve through the backend proxy, not a direct S3 URL — the bucket is
      // private (direct URLs 403 for anonymous <img> requests).
      const url = `${this.publicApiBase}/api/upload/file/${fileName}`;

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
