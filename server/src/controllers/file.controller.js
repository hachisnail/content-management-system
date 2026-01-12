import * as FileService from '../services/file.service.js';
import { db } from '../models/index.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Match the config logic
const UPLOADS_ROOT = process.env.UPLOAD_DIR 
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, '..', '..', '..', 'uploads');



  const getStyledError = (code, title, message) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${code} - ${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f9fafb;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
    }
    .card {
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid #e5e7eb;
      text-align: center;
      max-width: 24rem;
      width: 90%;
    }
    .icon {
      width: 3.5rem;
      height: 3.5rem;
      background-color: #fee2e2;
      color: #dc2626;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem auto;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #111827;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.025em;
    }
    p {
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.5;
      margin: 0 0 2rem 0;
    }
    .btn {
      display: inline-flex;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
      background-color: #4f46e5;
      border-radius: 0.5rem;
      text-decoration: none;
      transition: background-color 0.2s;
      border: none;
      cursor: pointer;
    }
    .btn:hover { background-color: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="28" height="28">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <button onclick="window.history.back()" class="btn">Go Back</button>
  </div>
</body>
</html>
`;

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) throw new Error('No file uploaded');

    const fileRecord = await FileService.processUpload(req.file, {
      relatedType: req.body.relatedType,
      relatedId: req.body.relatedId,
      isPublic: req.body.isPublic,
      allowedRoles: req.body.allowedRoles,
      user: req.user
    });

    res.status(201).json({ success: true, data: fileRecord });
  } catch (error) {
    next(error);
  }
};

export const viewFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const file = await db.File.findByPk(id);
    
    // 404: Not Found
    if (!file) {
      return res.status(404).send(getStyledError(404, 'File Not Found', 'The resource you are looking for does not exist or has been removed.'));
    }

    if (!file.isPublic) {
      // 401: Unauthorized
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).send(getStyledError(401, 'Authentication Required', 'You must be signed in to view this secure document.'));
      }

      const restrictedRoles = file.allowedRoles || [];
      if (restrictedRoles.length > 0) {
        const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        const isSuperAdmin = userRoles.includes('super_admin');
        const hasPermission = userRoles.some(r => restrictedRoles.includes(r));

        // 403: Forbidden
        if (!isSuperAdmin && !hasPermission) {
          return res.status(403).send(getStyledError(403, 'Access Denied', 'You do not have the required permissions to view this file.'));
        }
      }
    }

    const folderName = file.relatedType || 'misc'; 
    const absolutePath = path.join(UPLOADS_ROOT, folderName, file.fileName);
    
    try {
      await fs.access(absolutePath);
    } catch {
      // 410: Gone (File record exists, but binary is missing)
      return res.status(410).send(getStyledError(410, 'File Unavailable', 'The file record exists, but the physical file is missing from the server storage.'));
    }

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    const safeFilename = encodeURIComponent(file.originalName);
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${safeFilename}`);
    
    res.sendFile(absolutePath);

  } catch (error) {
    next(error);
  }
};