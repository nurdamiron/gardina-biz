import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { buildUploadKey, getContentType } from './uploadKey.js';

dotenv.config();

/**
 * Local-disk Upload Service — same interface as S3UploadService, backed by
 * a directory on the container's filesystem instead of AWS S3. Selected via
 * UPLOAD_DRIVER=local (see UploadController). Meant for deployments that
 * don't use AWS at all; pair UPLOAD_DIR with a persistent Docker volume
 * (docker-compose.yml mounts it at /app/uploads) so uploads survive restarts.
 */
export class LocalUploadService {
  constructor() {
    this.rootDir = path.resolve(process.env.UPLOAD_DIR || '/app/uploads');
    this.prefix = process.env.LOCAL_UPLOAD_PREFIX || '';
    // Public base for served media, e.g. https://api.gardina.kz — files are
    // exposed through the same /api/upload/file/* proxy route S3 mode uses,
    // so the frontend doesn't need to know which driver is active.
    this.publicApiBase = (process.env.PUBLIC_API_URL || process.env.API_PUBLIC_URL || 'https://api.gardina.kz').replace(/\/+$/, '');

    // Fail fast at boot if the volume isn't writable, same spirit as
    // S3UploadService's constructor-time credential checks.
    fs.mkdirSync(this.rootDir, { recursive: true });
  }

  /** Resolve a storage key to an absolute path, rejecting any escape from rootDir. */
  #resolvePath(key) {
    const full = path.resolve(this.rootDir, key);
    if (full !== this.rootDir && !full.startsWith(this.rootDir + path.sep)) {
      throw new Error('Invalid key: path escapes upload directory');
    }
    return full;
  }

  /**
   * Read a file back off disk.
   * @param {string} key - storage key (e.g. "clients/<id>/2026-09-04/<uuid>.jpg")
   * @returns {Promise<{body: import('fs').ReadStream, contentType: string, contentLength: number}>}
   */
  async getObject(key) {
    const full = this.#resolvePath(key);
    const stat = await fs.promises.stat(full); // throws ENOENT if missing
    return {
      body: fs.createReadStream(full),
      contentType: getContentType(full.split('.').pop()),
      contentLength: stat.size,
    };
  }

  /**
   * Write a file to disk.
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalName - Original filename
   * @param {string} folder - Folder (measurements, profiles, etc)
   * @param {object} metadata - dealId, measurementId, clientId, photoType, contentType
   * @returns {Promise<{url: string, key: string}>}
   */
  async uploadFile(fileBuffer, originalName, folder = 'measurements', metadata = {}) {
    const key = buildUploadKey(originalName, folder, metadata, this.prefix);
    const full = this.#resolvePath(key);

    try {
      await fs.promises.mkdir(path.dirname(full), { recursive: true });
      await fs.promises.writeFile(full, fileBuffer);

      return {
        url: `${this.publicApiBase}/api/upload/file/${key}`,
        key,
        bucket: null,
      };
    } catch (error) {
      console.error(`[LocalUploadService] Upload failed for ${originalName}: ${error.message}`);
      throw new Error(`Failed to write file to local storage: ${error.message}`);
    }
  }

  /** Upload multiple files */
  async uploadMultiple(files, folder = 'measurements') {
    const uploads = files.map(file =>
      this.uploadFile(file.buffer, file.originalname, folder, {
        contentType: file.contentType,
      })
    );

    return Promise.all(uploads);
  }

  /** Delete file from disk. Idempotent — a missing file is not an error. */
  async deleteFile(key) {
    const full = this.#resolvePath(key);
    try {
      await fs.promises.unlink(full);
      return { success: true };
    } catch (error) {
      if (error.code === 'ENOENT') return { success: true };
      console.error(`[LocalUploadService] Delete failed for key ${key}: ${error.message}`);
      throw new Error('Failed to delete file from local storage');
    }
  }
}
