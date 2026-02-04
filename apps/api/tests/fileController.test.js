/* api/tests/fileController.test.js */
import { uploadFile, serveFile, deleteFile } from '../src/controllers/fileController.js';
import { fileService } from '../src/services/fileService.js';
import path from 'path';

// [FIX] Use factory mock to avoid parsing 'file-type' (ESM) dependency in the service
jest.mock('../src/services/fileService.js', () => ({
  fileService: {
    uploadFile: jest.fn(),
    processFileAccess: jest.fn(),
    getFiles: jest.fn(),
    getFile: jest.fn(),
    updateFile: jest.fn(),
    deleteFile: jest.fn()
  }
}));

jest.mock('../src/utils/audit.js'); 

describe('FileController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 'user-1' },
      params: {},
      body: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendFile: jest.fn()
    };
    next = jest.fn();
  });

  describe('uploadFile', () => {
    it('should pass req.file and body to service correctly', async () => {
      req.file = { originalname: 'test.jpg', size: 100 };
      req.body = { visibility: 'private' };
      
      const mockResult = { file: { id: 1, originalName: 'test.jpg' } };
      fileService.uploadFile.mockResolvedValue(mockResult);

      await uploadFile(req, res, next);

      expect(fileService.uploadFile).toHaveBeenCalledWith({
        fileData: req.file,
        metaData: req.body,
        userId: 'user-1'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should throw error if no file provided', async () => {
      req.file = undefined;
      await uploadFile(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'No file uploaded'
      }));
    });
  });

  describe('serveFile', () => {
    it('should resolve path and send file with headers', async () => {
      req.params.id = 'file-id';
      
      fileService.processFileAccess.mockResolvedValue({
        path: 'uploads/test.jpg',
        mimetype: 'image/jpeg',
        originalName: 'display.jpg'
      });

      await serveFile(req, res, next);

      expect(fileService.processFileAccess).toHaveBeenCalledWith('file-id', req.user);
      
      const expectedPath = path.resolve('uploads/test.jpg');
      expect(res.sendFile).toHaveBeenCalledWith(expectedPath, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': 'inline; filename="display.jpg"'
        }
      });
    });

    it('should pass errors to next middleware', async () => {
      fileService.processFileAccess.mockRejectedValue(new Error('Access Denied'));
      await serveFile(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});