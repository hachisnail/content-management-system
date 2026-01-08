import { useState } from 'react';
import api from '../api';

/**
 * Reusable Hook for handling file uploads with metadata
 */
export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * @param {File} file - The browser File object
   * @param {Object} metadata - { relatedType, relatedId, isPublic, ... }
   */
  const upload = async (file, metadata = {}) => {
    if (!file) return;
    
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();

      // 1. Append Metadata FIRST (Critical for backend folder routing)
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      // 2. Append File LAST
      formData.append('file', file);

      const response = await api.uploadFile(formData);
      return response;
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.message || "Failed to upload file");
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
};