import multer from 'multer'; 
import { AppError } from '../core/errors/AppError.js';

export const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Stack:', err.stack);
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: true,
        message: 'File too large. Please upload a smaller file.'
      });
    }
    return res.status(400).json({
      error: true,
      message: `Upload Error: ${err.message}`
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: true,
      message: err.message,
      details: err.details || undefined
    });
  }


  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Internal Server Error';

  res.status(statusCode).json({
    error: true,
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};