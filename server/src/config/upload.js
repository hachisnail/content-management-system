import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ulid } from 'ulid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, '..', '..', '..', 'uploads');

if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

const ALLOWED_FOLDERS = ['users', 'donations', 'audit_logs', 'misc'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = req.body.relatedType || 'misc';

    if (!ALLOWED_FOLDERS.includes(folder)) {
      console.warn(
        `[Security] Blocked attempt to upload to invalid folder: ${folder}`,
      );
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
    'application/pdf': ['.pdf'],
  };

  const mime = file.mimetype;
  const ext = path.extname(file.originalname).toLowerCase();

  if (!Object.keys(allowedMimes).includes(mime)) {
    return cb(new Error('Unsupported file type'), false);
  }

  if (!allowedMimes[mime].includes(ext)) {
    return cb(new Error('File extension does not match file type'), false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const verifyFileContent = async (filePath) => {
  const stream = fs.createReadStream(filePath, { start: 0, end: 7 });

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {
      const hex = chunk.toString('hex').toUpperCase();

      const signatures = {
        FFD8FF: 'image/jpeg',
        '89504E47': 'image/png',
        25504446: 'application/pdf',
      };

      for (const [sig, type] of Object.entries(signatures)) {
        if (hex.startsWith(sig)) {
          stream.destroy();
          return resolve(true);
        }
      }

      stream.destroy();
      resolve(false);
    });

    stream.on('error', reject);
  });
};
