export const CATEGORY_DEFAULTS = {
  maxSize: 50 * 1024 * 1024,
  allowedMimes: [], 
  singleInstance: false
};

export const FILE_CATEGORIES = {
  avatar: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    singleInstance: true, 
  },
  documents: {
    maxSize: 20 * 1024 * 1024,
    allowedMimes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    singleInstance: false,
  }
};