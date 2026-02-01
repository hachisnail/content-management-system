import multer from 'multer'; 

export const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development' || err.status >= 500) {
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

  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: true,
    message: message,
    // Only show stack in dev
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};