import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ROBUST PATH CONFIGURATION:
// 1. Production/Coolify: Use the env var (e.g., "/app/uploads")
// 2. Local Dev: Fallback to relative path (sibling to 'server' folder)
const baseUploadDir = process.env.UPLOAD_DIR 
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, '..', '..', '..', 'uploads');

// Ensure base directory exists
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// SECURITY: Whitelist allowed folders
const ALLOWED_FOLDERS = ['users', 'donations', 'audit_logs', 'misc'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = req.body.relatedType || 'misc';

    if (!ALLOWED_FOLDERS.includes(folder)) {
      console.warn(`[Security] Blocked attempt to upload to invalid folder: ${folder}`);
      folder = 'misc';
    }

    // Combine the Base Dir (from Env or Relative) with the specific folder
    const targetPath = path.join(baseUploadDir, folder);

    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    cb(null, targetPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type.'), false);
  }
};

export const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } 
});