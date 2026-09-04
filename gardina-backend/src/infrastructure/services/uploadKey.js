import { v4 as uuidv4 } from 'uuid';

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const EXT_TO_CONTENT_TYPE = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

/**
 * Build the storage key (relative path) for an uploaded file. Shared between
 * S3UploadService and LocalUploadService so both drivers lay files out
 * identically — a key produced today doesn't change meaning if the driver
 * is swapped later.
 *
 * @param {string} originalName - Original filename (untrusted, used only as an extension fallback)
 * @param {string} folder - Folder in bucket/disk (measurements, profiles, etc)
 * @param {object} metadata - dealId, measurementId, clientId, photoType, contentType
 * @param {string} [prefix] - Optional key prefix (S3_PREFIX equivalent)
 * @returns {string} storage key, e.g. "clients/<id>/2026-09-04/<uuid>.jpg"
 */
export function buildUploadKey(originalName, folder, metadata = {}, prefix = '') {
  // Pick extension from contentType (verified by magic bytes), falling back
  // to original filename if upstream did not resolve it. Never trust
  // user-supplied originalName for path construction.
  const safeExt = (
    MIME_TO_EXT[metadata.contentType] ||
    String(originalName || '').split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ||
    'bin'
  ).slice(0, 5);

  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const prefixPath = prefix ? `${prefix}/` : '';

  // Whitelist folder name (no traversal)
  const safeFolder = /^[a-z0-9_-]{1,32}$/i.test(folder) ? folder : 'misc';

  if (metadata.dealId && metadata.measurementId) {
    const photoType = metadata.photoType || 'general';
    return `${prefixPath}orders/${metadata.dealId}/${metadata.measurementId}/${photoType}/${uuidv4()}.${safeExt}`;
  }
  if (metadata.clientId) {
    return `${prefixPath}clients/${metadata.clientId}/${timestamp}/${uuidv4()}.${safeExt}`;
  }
  return `${prefixPath}${safeFolder}/${timestamp}/${uuidv4()}.${safeExt}`;
}

/** Get content type by extension, defaulting to a safe generic binary type. */
export function getContentType(extension) {
  return EXT_TO_CONTENT_TYPE[String(extension).toLowerCase()] || 'application/octet-stream';
}
