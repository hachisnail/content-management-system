/* web/src/hooks/useFileUpload.js */
import { useState } from 'react';
import apiClient from '../api/client';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const upload = async (file, options = {}) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();

    // [CRITICAL FIX] Append metadata BEFORE the file.
    // Multer needs these fields available in req.body when it starts processing the file.
    if (options.recordId) formData.append('recordId', options.recordId);
    if (options.recordType) formData.append('recordType', options.recordType);
    if (options.category) formData.append('category', options.category);
    if (options.visibility) formData.append('visibility', options.visibility);
    
    if (options.replaceExisting !== undefined) {
      formData.append('replaceExisting', options.replaceExisting);
    }

    // Append the file LAST
    formData.append('file', file);

    try {
      const response = await apiClient.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      setResult(response.data);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed';
      setError(msg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setProgress(0);
    setError(null);
    setResult(null);
  };

  return {
    upload,
    reset,
    isUploading,
    progress,
    error,
    result
  };
};