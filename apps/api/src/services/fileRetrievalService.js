import { File } from "../models/index.js";
import { storage } from "../core/storage/index.js";
import { AppError } from "../core/errors/AppError.js";

export class FileRetrievalService {
  constructor() {
    this.storage = storage; 
  }

  /**
   * Get file stream for downloading/serving
   */
  async getStream(user, fileId, variant = null) {
    console.log(
      `[Retrieval] Fetching ID: ${fileId} (${variant || "original"})`,
    );

    const file = await File.findByPk(fileId, {
      include: ["links"],
      paranoid: false,
    });

    if (!file) throw new AppError("File not found", 404);

    this._checkAccess(user, file);

    try {
      const stream = await this.storage.getStream(file.path, variant);

      const isFallback = stream.path && stream.path === file.path;

      const serveAsThumbnail = variant === "thumbnail" && !isFallback;

      const finalMeta = serveAsThumbnail
          ? {
              ...file.toJSON(),
              mimetype: "image/jpeg",
              originalName: `thumb_${file.originalName}.jpg`,
            }
          : file;

      return { stream, meta: finalMeta };
    } catch (err) {
      console.error(`[Retrieval] Read Failed: ${file.path}`, err);
      if (variant === "thumbnail") {
        return this.getStream(user, fileId, null);
      }
      throw new AppError("File content missing on disk", 404);
    }
  }

  /**
   * Get single file metadata
   */
  async getFileMetadata(user, fileId) {
    const file = await File.findByPk(fileId, {
      include: ["links"],
      paranoid: false,
    });

    if (!file) throw new AppError("File not found", 404);

    this._checkAccess(user, file);
    return file;
  }

  /**
   * List all files uploaded by user
   */
  async getUserFiles(user, query) {
    return await File.findAll({
      where: { uploadedBy: user.id },
      order: [["createdAt", "DESC"]],
    });
  }

  /**
   * Internal Access Control
   */
  _checkAccess(user, file) {
    if (file.visibility === "public") return true;
    if (user.roles?.includes("admin") || user.roles?.includes("superadmin"))
      return true;
    if (file.uploadedBy === user.id) return true;

    if (
      file.allowedRoles &&
      Array.isArray(file.allowedRoles) &&
      file.allowedRoles.length > 0
    ) {
      const hasRole = file.allowedRoles.some((role) =>
        user.roles.includes(role),
      );
      if (hasRole) return true;
    }

    throw new AppError("Access Denied", 403);
  }
}

export const fileRetrievalService = new FileRetrievalService();