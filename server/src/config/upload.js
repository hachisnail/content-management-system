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
  const allowedMimes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/pdf': ['.pdf']
  };

  const mime = file.mimetype;
  const ext = path.extname(file.originalname).toLowerCase();

  // Check 1: Mime Type Allowed?
  if (!Object.keys(allowedMimes).includes(mime)) {
    return cb(new Error('Unsupported file type'), false);
  }

  // Check 2: Extension Matches Mime? (Anti-spoofing basic)
  if (!allowedMimes[mime].includes(ext)) {
    return cb(new Error('File extension does not match file type'), false);
  }

  cb(null, true);
};

export const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } 
});

// 2. NEW UTILITY: VERIFY MAGIC NUMBERS (Call this in your Controller!)
export const verifyFileContent = async (filePath) => {
  const stream = fs.createReadStream(filePath, { start: 0, end: 7 });
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {
      const hex = chunk.toString('hex').toUpperCase();
      
      // Magic Numbers
      const signatures = {
        'FFD8FF': 'image/jpeg',
        '89504E47': 'image/png', // .PNG
        '25504446': 'application/pdf' // %PDF
      };

      for (const [sig, type] of Object.entries(signatures)) {
        if (hex.startsWith(sig)) {
          stream.destroy();
          return resolve(true); // Valid
        }
      }
      
      stream.destroy();
      resolve(false); // Invalid content
    });

    stream.on('error', reject);
  });
};
