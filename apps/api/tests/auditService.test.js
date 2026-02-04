/* api/tests/auditService.test.js */
jest.mock('../src/models/index.js', () => ({
  AuditLog: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn()
  },
  User: {},
  File: {}
}));

import { auditService } from '../src/services/auditService.js';
import { AuditLog } from '../src/models/index.js';

describe('AuditService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return paginated data structure', async () => {
      AuditLog.findAndCountAll.mockResolvedValue({
        count: 50,
        rows: [{ id: 1, action: 'LOGIN' }]
      });

      const result = await auditService.findAll({ page: 2, limit: 10 });

      expect(result).toEqual({
        data: [{ id: 1, action: 'LOGIN' }],
        meta: {
          totalItems: 50,
          totalPages: 5,
          currentPage: 2,
          itemsPerPage: 10
        }
      });
    });
  });

  describe('findById', () => {
    it('should throw 404 if log not found', async () => {
      AuditLog.findByPk.mockResolvedValue(null);
      await expect(auditService.findById(999))
        .rejects.toThrow('Audit log not found');
    });
  });
});