import fs from 'fs';
import path from 'path';
import { StorageAdapter } from './StorageAdapter.js';

export class LocalAdapter extends StorageAdapter {
  constructor(baseDir = 'storage/files') {
    super();
    this.baseDir = baseDir;
    if (!fs.existsSync(this.baseDir)) fs.mkdirSync(this.baseDir, { recursive: true });
  }

  async upload(fileObject, destinationFolder = 'general') {
    const targetDir = path.join(this.baseDir, destinationFolder);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const filename = `${Date.now()}_${fileObject.originalname.replace(/\s+/g, '_')}`;
    const targetPath = path.join(targetDir, filename);

    await fs.promises.rename(fileObject.path, targetPath);
    
    return targetPath; 
  }

  async saveThumbnail(originalPath, buffer) {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const base = path.basename(originalPath, ext);
    
    const thumbPath = path.join(dir, `${base}_thumb.jpg`);
    
    await fs.promises.writeFile(thumbPath, buffer);
    return thumbPath;
  }

  async delete(filePath) {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    const thumbPath = path.join(dir, `${base}_thumb.jpg`);
    
    if (fs.existsSync(thumbPath)) {
      await fs.promises.unlink(thumbPath);
    }
  }

  async getStream(filePath, variant = null) {
    let finalPath = filePath;

    if (variant === 'thumbnail') {
      const dir = path.dirname(filePath);
      const ext = path.extname(filePath);
      const base = path.basename(filePath, ext);
      const thumbPath = path.join(dir, `${base}_thumb.jpg`);

      if (fs.existsSync(thumbPath)) {
        finalPath = thumbPath;
      }
    }

    if (!fs.existsSync(finalPath)) throw new Error('File not found on disk');
    return fs.createReadStream(finalPath);
  }
}