import { recycleBinService } from "../services/recycleBinService.js"; // [FIX] Destructured import is cleaner
import { trackActivity } from "../utils/audit.js";
import { formatPaginated } from "../utils/pagination.js"; // [FIX] Import pagination formatter

export const listDeleted = async (req, res, next) => {
  try {
    // [FIX] Extract page/limit from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // [FIX] Pass params to service
    const { rows, count } = await recycleBinService.getAllDeleted(page, limit);

    // [FIX] Return standard paginated response
    res.json(formatPaginated(rows, count, page, limit));
  } catch (error) {
    next(error);
  }
};

export const getDeletedItem = async (req, res, next) => {
  try {
    const item = await recycleBinService.findById(req.params.id);
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const restoreItem = async (req, res, next) => {
  try {
    const result = await recycleBinService.restore(req.params.id);
    
    trackActivity(req, 'RESTORE_ITEM', 'recycle_bin', { binId: req.params.id });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const forceDeleteItem = async (req, res, next) => {
  try {
    await recycleBinService.forceDelete(req.params.id);
    
    trackActivity(req, 'FORCE_DELETE_ITEM', 'recycle_bin', { binId: req.params.id });

    res.json({ message: "Item permanently deleted" });
  } catch (error) {
    next(error);
  }
};