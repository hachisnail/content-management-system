import { getIO } from '../socket-store.js'; // Import the helper
import ArticleService from '../services/article.service.js';

export const updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 1. Update Database (The standard flow)
    const updatedArticle = await ArticleService.update(id, updateData);

    // 2. INTERCEPT & BROADCAST
    // Get the socket instance
    const io = getIO();
    
    // Broadcast to everyone currently viewing this article (except the sender)
    // The event 'resource_updated' tells the client to re-fetch
    io.to(id).emit('resource_updated', {
      resourceId: id,
      action: 'update',
      updatedBy: req.user.email,
      // Optional: Send the new data if you want to avoid a re-fetch
      // data: updatedArticle 
    });

    res.json({ success: true, data: updatedArticle });
  } catch (error) {
    next(error);
  }
};