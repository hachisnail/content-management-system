/* api/src/config/upload.js */
import multer from "multer";
import path from "path";
import fs from "fs";
import { ulid } from "ulid";
import { fileTypeFromBuffer } from "file-type";
import { FILESYSTEM, getAllowedMimes } from "./filesystem.js";

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 1. Determine Folder Structure based on Metadata
    // Hierarchy: recordType/category -> category -> default
    // This ensures paths like: storage/files/users/avatar/2026/02/
    
    const { recordType, category, visibility } = req.body;
    
    let pathSegments = [];

    if (recordType && category) {
      // Case A: specific resource link (e.g. "users/avatar")
      pathSegments = [recordType, category];
    } else if (category) {
      // Case B: category only (e.g. "reports")
      pathSegments = [category];
    } else {
      // Case C: Fallback to default config
      const isPublic = visibility === "public";
      const defaultCat = isPublic 
        ? FILESYSTEM.DEFAULT_PUBLIC_CATEGORY 
        : FILESYSTEM.DEFAULT_PRIVATE_CATEGORY;
      pathSegments = [defaultCat];
    }

    // Sanitize directory names to prevent traversal or invalid chars
    pathSegments = pathSegments.map(s => s.replace(/[^a-z0-9-_]/gi, "_"));

    // 2. Build Path: storage/files/{SEGMENTS}/{YEAR}/{MONTH}
    const date = new Date();
    const dynamicDir = path.join(
      FILESYSTEM.BASE_DIR, 
      "files", 
      ...pathSegments,
      String(date.getFullYear()),
      String(date.getMonth() + 1).padStart(2, "0")
    );

    ensureDir(dynamicDir);
    cb(null, dynamicDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${ulid()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (getAllowedMimes().includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(`Invalid file type. Allowed: ${getAllowedMimes().join(", ")}`),
      false,
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: FILESYSTEM.MAX_SIZE },
});

export const verifyFileSignature = async (filePath) => {
  let fd;
  try {
    const buffer = Buffer.alloc(FILESYSTEM.MAGIC_BYTES);
    fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, FILESYSTEM.MAGIC_BYTES, 0);

    const type = await fileTypeFromBuffer(buffer);
    if (!type) return false;

    const allowedExts = Object.values(FILESYSTEM.ALLOWED_TYPES).flat();
    const ext = type.ext === "jpeg" ? "jpg" : type.ext;
    return allowedExts.includes(ext);
  } catch (err) {
    console.error("File Verification Error:", err);
    return false;
  } finally {
    if (fd) fs.closeSync(fd);
  }
};