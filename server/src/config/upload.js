import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ulid } from 'ulid';
import { fileURLToPath } from 'url';
import { fileTypeFromFile } from 'file-type';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, '..', '..', '..', 'uploads');

if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// --- CENTRALIZED CONFIGURATION ---

// 1. Defined Allowed Link Types (Tables that can have files)
export const ALLOWED_LINK_TYPES = [
  'users',
  'donations',
  'audit_logs',
  'articles',
  'misc',
  'test_items', // Added for testing
];

// 2. Define Allowed Folders (usually matches link types)
const ALLOWED_FOLDERS = ALLOWED_LINK_TYPES;

// 3. Define File Size Limits
export const FILE_LIMITS = {
  IMAGES: 10 * 1024 * 1024, // 10 MB
  DOCUMENTS: 20 * 1024 * 1024, // 20 MB
  users: 5 * 1024 * 1024, // 5MB
  audit_logs: 25 * 1024 * 1024, // 25MB
  test_items: 15 * 1024 * 1024, // 15MB
  MAX_GLOBAL: 50 * 1024 * 1024, // 50 MB Ceiling
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = req.body.relatedType || 'misc';
    if (!ALLOWED_FOLDERS.includes(folder)) {
      folder = 'misc';
    }
    const targetPath = path.join(baseUploadDir, folder);
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    cb(null, targetPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${ulid()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      '.docx',
    ],
    'text/plain': ['.txt'],
    'text/csv': ['.csv'],
  };

  const mime = file.mimetype;
  if (!Object.keys(allowedMimes).includes(mime)) {
    return cb(new Error(`Unsupported file type: ${mime}`), false);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: FILE_LIMITS.MAX_GLOBAL },
});

export const verifyFileContent = async (filePath) => {
  try {
    const result = await fileTypeFromFile(filePath);

    // Handle Text Files (No binary signature)
    if (!result) {
      const ext = path.extname(filePath).toLowerCase();
      const allowedTextExts = ['.txt', '.csv'];
      return allowedTextExts.includes(ext);
    }

    // Handle Binary Files
    const allowedSignatures = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/x-cfb',
      'application/x-zip-compressed',
      'application/zip',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    return allowedSignatures.includes(result.mime);
  } catch (error) {
    console.error('[Security] File verification error:', error);
    return false;
  }
};
