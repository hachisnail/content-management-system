/* api/tests/adminFileService.test.js */
jest.mock('../src/models/index.js', () => ({
  File: {
    count: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  FileLink: {},
  User: {},
  sequelize: {}
}));

jest.mock('../src/models/scopes.js', () => ({
  UserScopes: {
    includeUploader: jest.fn(() => ({ model: 'User' }))
  }
}));

import { adminFilesService } from '../src/services/adminFileService.js';
import { File } from '../src/models/index.js';
import { Op } from 'sequelize';

describe('AdminFileService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAllFiles', () => {
    it('should build correct query filters for visibility', async () => {
      File.count.mockResolvedValue(1);
      File.findAll.mockResolvedValue([{
        toJSON: () => ({ 
          id: '1', 
          createdAt: new Date(), 
          links: [] 
        })
      }]);

      await adminFilesService.getAllFiles({ visibility: 'private', search: 'report' });

      expect(File.count).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          visibility: 'private',
          originalName: expect.anything() 
        })
      }));
    });

    it('should handle orphaned file filtering', async () => {
      File.count.mockResolvedValue(0);
      File.findAll.mockResolvedValue([]);

      await adminFilesService.getAllFiles({ category: 'uncategorized' });

      expect(File.count).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          '$links.id$': null
        })
      }));
    });
  });

  describe('getOrphanedFiles', () => {
    it('should query for files with no links', async () => {
      File.findAll.mockResolvedValue([]);
      await adminFilesService.getOrphanedFiles();

      expect(File.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          '$links.id$': null
        })
      }));
    });
  });

  describe('updateVisibility', () => {
    it('should batch update file visibility', async () => {
      File.update.mockResolvedValue([2]); 

      await adminFilesService.updateVisibility(['id1', 'id2'], 'public');

      expect(File.update).toHaveBeenCalledWith(
        { visibility: 'public' },
        { where: { id: { [Op.in]: ['id1', 'id2'] } } }
      );
    });

    it('should throw error on invalid visibility value', async () => {
      await expect(adminFilesService.updateVisibility(['id1'], 'invalid_enum'))
        .rejects.toThrow('Invalid visibility');
    });
  });
});