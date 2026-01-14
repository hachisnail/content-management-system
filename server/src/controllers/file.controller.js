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



const getStyledError = (code, title, message) => {
  // Config matching src/pages/error/ErrorPage.jsx
  const themes = {
    403: {
      color: '#d97706', // amber-600
      bg: '#fffbeb',    // amber-50
      border: '#fde68a' // amber-200
    },
    404: {
      color: '#4f46e5', // indigo-600
      bg: '#eef2ff',    // indigo-50
      border: '#c7d2fe' // indigo-200
    },
    500: {
      color: '#dc2626', // red-600
      bg: '#fef2f2',    // red-50
      border: '#fecaca' // red-200
    },
    default: {
      color: '#4f46e5', // indigo-600 (Fallback)
      bg: '#f9fafb',    // gray-50
      border: '#e5e7eb' // gray-200
    }
  };

  const theme = themes[code] || themes.default;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${code} - ${title}</title>
  <style>
    /* Reset & Base */
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #fafafa; /* zinc-50 */
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 1rem;
      color: #18181b; /* zinc-900 */
    }

    /* Card Component matching ErrorPage.jsx */
    .card {
      position: relative;
      background-color: ${theme.bg};
      border: 1px solid ${theme.border};
      color: #18181b;
      padding: 2rem;
      border-radius: 1rem; /* rounded-2xl */
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      text-align: center;
      max-width: 28rem;
      width: 100%;
      overflow: hidden;
    }

    /* Background Pattern Blobs */
    .blob {
      position: absolute;
      width: 8rem;
      height: 8rem;
      border-radius: 50%;
      background-color: white;
      opacity: 0.2;
      filter: blur(24px); /* blur-2xl */
      pointer-events: none;
    }
    .blob-tr { top: -2rem; right: -2rem; }
    .blob-bl { bottom: -2rem; left: -2rem; }

    /* Icon Container */
    .icon-wrapper {
      position: relative;
      z-index: 10;
      width: 4rem;
      height: 4rem;
      margin: 0 auto 1.5rem auto;
      background-color: ${theme.bg}; /* match card bg to blend or stand out */
      border: 1px solid ${theme.border};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    
    .icon-svg {
      width: 2rem;
      height: 2rem;
      color: ${theme.color};
    }

    /* Typography */
    h1 {
      font-size: 2.25rem; /* text-4xl */
      font-weight: 800;   /* font-extrabold */
      letter-spacing: -0.025em;
      margin: 0 0 0.5rem 0;
      line-height: 1;
      position: relative;
      z-index: 10;
    }
    
    h2 {
      font-size: 1.25rem; /* text-xl */
      font-weight: 600;   /* font-semibold */
      color: #27272a;     /* zinc-800 */
      margin: 0 0 0.75rem 0;
      position: relative;
      z-index: 10;
    }

    p {
      color: #71717a; /* zinc-500 */
      font-size: 1rem;
      line-height: 1.625;
      margin: 0 0 2rem 0;
      position: relative;
      z-index: 10;
    }

    /* Buttons matching UI.jsx Primary/Secondary */
    .btn-group {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      position: relative;
      z-index: 10;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 0.5rem; /* rounded-md */
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: 1px solid transparent;
    }

    .btn-primary {
      background-color: #4f46e5; /* indigo-600 */
      color: white;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    .btn-primary:hover {
      background-color: #4338ca; /* indigo-700 */
    }

    .btn-secondary {
      background-color: white;
      color: #374151; /* zinc-700 */
      border-color: #d1d5db; /* zinc-300 */
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    .btn-secondary:hover {
      background-color: #f9fafb; /* zinc-50 */
      color: #111827; /* zinc-900 */
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="blob blob-tr"></div>
    <div class="blob blob-bl"></div>

    <div class="icon-wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="icon-svg">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    </div>

    <h1>${code}</h1>
    <h2>${title}</h2>
    <p>${message}</p>

    <div class="btn-group">
      <button onclick="window.history.back()" class="btn btn-secondary">
        Go Back
      </button>
      <a href="/dashboard" class="btn btn-primary">
        Dashboard
      </a>
    </div>
  </div>
</body>
</html>
`;
};

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