/* api/tests/recycleBinService.test.js */
jest.mock('fs/promises'); 
jest.mock('../src/models/index.js', () => ({
  sequelize: {
    transaction: jest.fn(() => ({
      commit: jest.fn(),
      rollback: jest.fn()
    }))
  },
  User: { findByPk: jest.fn() },
  File: { findByPk: jest.fn(), destroy: jest.fn(), restore: jest.fn() },
  // [FIX] Added findByPk to FileLink mock
  FileLink: { findAll: jest.fn(), destroy: jest.fn(), create: jest.fn(), findByPk: jest.fn() },
  RecycleBin: { create: jest.fn(), findByPk: jest.fn(), destroy: jest.fn() }
}));

import { recycleBinService } from '../src/services/recycleBinService.js';
import { File, FileLink, RecycleBin } from '../src/models/index.js';

describe('RecycleBinService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('moveToBin', () => {
    it('should snapshot links and soft delete file', async () => {
      const mockFile = { 
        id: 'f1', 
        originalName: 'test.jpg', 
        destroy: jest.fn() 
      };
      File.findByPk.mockResolvedValue(mockFile);

      const mockLinks = [{ id: 1, fileId: 'f1', recordId: 'u1', toJSON: () => ({ id: 1 }) }];
      FileLink.findAll.mockResolvedValue(mockLinks);

      await recycleBinService.moveToBin('files', 'f1', 'user-1');

      expect(RecycleBin.create).toHaveBeenCalledWith(expect.objectContaining({
        resourceType: 'files',
        metadata: expect.objectContaining({
          linksBackup: expect.arrayContaining([{ id: 1 }])
        })
      }), expect.any(Object));

      expect(mockFile.destroy).toHaveBeenCalled();
      expect(FileLink.destroy).toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('should restore file and recreate links', async () => {
      const mockBin = {
        resourceType: 'files',
        resourceId: 'f1',
        destroy: jest.fn(),
        metadata: {
          linksBackup: [{ id: 1, fileId: 'f1', recordType: 'users' }]
        }
      };
      RecycleBin.findByPk.mockResolvedValue(mockBin);

      const mockFile = { restore: jest.fn() };
      File.findByPk.mockResolvedValue(mockFile);

      FileLink.findByPk.mockResolvedValue(null);

      await recycleBinService.restore(1);

      expect(mockFile.restore).toHaveBeenCalled();
      expect(FileLink.create).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, fileId: 'f1' }), 
        expect.any(Object)
      );
      expect(mockBin.destroy).toHaveBeenCalled();
    });
  });
});