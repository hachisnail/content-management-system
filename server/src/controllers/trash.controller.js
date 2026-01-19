import * as TrashService from '../services/trash.service.js';

export const getTrash = async (req, res, next) => {
  try {
    // Pass query params (page, limit, search) to service
    const { rows, count } = await TrashService.getSystemTrash(req.query);

    // --- PAGINATION META CALCULATION ---
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: rows,
      meta: {
        totalItems: count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTrashItem = async (req, res, next) => {
  try {
    const item = await TrashService.getTrashItemById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const restoreItem = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    await TrashService.restoreResource(type, id, req.user);
    res.json({ success: true, message: 'Item restored successfully.' });
  } catch (error) {
    next(error);
  }
};

export const purgeItem = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    await TrashService.purgeResource(type, id, req.user);
    res.json({ success: true, message: 'Item permanently deleted.' });
  } catch (error) {
    next(error);
  }
};
