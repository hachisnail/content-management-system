// api/src/config/filesystem.js
import path from 'path';

export const FILESYSTEM = {
  // Base storage directory
  BASE_DIR: 'storage/',
  
  // Upload limits
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  
  // Allowed MIME types and their extensions
  ALLOWED_TYPES: {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'application/pdf': ['pdf']
  },

  // Security: Max bytes to read for magic number verification
  MAGIC_BYTES: 4100,

  // Default Categories
  DEFAULT_PUBLIC_CATEGORY: 'images',
  DEFAULT_PRIVATE_CATEGORY: 'user-files'
};

export const getAllowedMimes = () => Object.keys(FILESYSTEM.ALLOWED_TYPES);

export const getExtensionFromMime = (mime) => {
  const exts = FILESYSTEM.ALLOWED_TYPES[mime];
  return exts ? exts[0] : null;
};