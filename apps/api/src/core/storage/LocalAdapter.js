import fs from 'fs';
import path from 'path';
import { StorageAdapter } from './StorageAdapter.js';

export class LocalAdapter extends StorageAdapter {
  constructor(baseDir = 'storage/files') {
    super();
    this.baseDir = baseDir;
    // Ensure base directory exists
    if (!fs.existsSync(this.baseDir)) fs.mkdirSync(this.baseDir, { recursive: true });
  }

  async upload(fileObject, destinationFolder = 'general') {
    // If using Multer DiskStorage, the file is already at fileObject.path.
    // We might want to organize it better or just return that path.
    // Here we strictly organize: storage/files/{folder}/{filename}
    
    const targetDir = path.join(this.baseDir, destinationFolder);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const filename = `${Date.now()}_${fileObject.originalname.replace(/\s+/g, '_')}`;
    const targetPath = path.join(targetDir, filename);

    // Move from temp/upload location to final location
    await fs.promises.rename(fileObject.path, targetPath);
    
    return targetPath; 
  }

  async delete(filePath) {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  async getStream(filePath) {
    if (!fs.existsSync(filePath)) throw new Error('File not found on disk');
    return fs.createReadStream(filePath);
  }
}