export class StorageAdapter {
  /**
   * Persist a file to storage
   * @param {Object} fileObject - The file object (from Multer)
   * @param {String} destinationFolder - Logical folder path
   * @returns {Promise<String>} - The unique path/key of the stored file
   */
  async upload(fileObject, destinationFolder) { throw new Error('Method not implemented'); }

  /**
   * Remove a file from storage
   * @param {String} path - The path/key returned by upload
   */
  async delete(path) { throw new Error('Method not implemented'); }

  /**
   * Get a readable stream
   * @param {String} path 
   */
  async getStream(path) { throw new Error('Method not implemented'); }
}