import { AuditLog, User, File } from "../models/index.js";
import { buildQuery } from "../utils/pagination.js";

export const auditService = {
  async findAll(queryParams) {
    const { page = 1, limit = 20 } = queryParams;

    // 1. Configure Query Options
    const options = buildQuery(queryParams, {
      searchFields: ["action", "resource", "ipAddress", "details"],
      allowedFilters: ["userId", "action", "resource"],
      allowedSort: ["createdAt", "action", "resource", "ipAddress", "userAgent"],
    });

    // 2. Add Relations
    options.include = [
      {
        model: User,
        as: "user",
        include: [
          {
            model: File,
            as: "avatarFiles", 
            attributes: ["id", "path", "visibility", "mimetype"], 
          },
        ],
      },
    ];

    // 3. Execute DB Query
    const { count, rows } = await AuditLog.findAndCountAll(options);

    // 4. [FIX] Format explicitly for frontend hook (useResource)
    // The frontend expects { data: [], meta: { ... } }
    return {
      data: rows,
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    };
  },

  async findById(id) {
    const log = await AuditLog.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          include: [
            {
              model: File,
              as: "avatarFiles",
              attributes: ["id", "path", "visibility", "mimetype"],
            },
          ],
        },
      ],
    });

    if (!log) {
      const error = new Error("Audit log not found");
      error.status = 404;
      throw error;
    }

    return log;
  },
};