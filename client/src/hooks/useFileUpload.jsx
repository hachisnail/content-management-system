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
   * @param {Object} metadata - { relatedType, relatedId, isPublic, category, ... }
   * @param {Object} options - { maxSize: number (in bytes) }
   */
  const upload = async (file, metadata = {}, options = {}) => {
    if (!file) return;
    
    setUploading(true);
    setError(null);

    try {
      // 1. CLIENT-SIDE VALIDATION
      if (options.maxSize && file.size > options.maxSize) {
        const limitMB = (options.maxSize / (1024 * 1024)).toFixed(0);
        throw new Error(`File is too large. Maximum size is ${limitMB}MB.`);
      }

      // 2. Prepare Form Data
      const formData = new FormData();

      // Append Metadata FIRST (Critical for backend folder routing)
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      // Append File LAST
      formData.append('file', file);

      const response = await api.uploadFile(formData);
      return response;
    } catch (err) {
      console.error("Upload failed:", err);
      // Handle standard Error objects or strings
      setError(err.message || "Failed to upload file");
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
};