export class FileSpecification {
  /**
   * @param {Object} rules - JSON rules from Category model or defaults
   */
  constructor(rules = {}) {
    this.rules = rules;
  }

  isSatisfiedBy(fileData) {
    // 1. Size Check
    if (this.rules.maxSize && fileData.size > this.rules.maxSize) {
      throw new Error(`File too large. Max size: ${this.rules.maxSize} bytes.`);
    }

    // 2. MIME Type Check
    if (this.rules.allowedMimes && Array.isArray(this.rules.allowedMimes)) {
      if (!this.rules.allowedMimes.includes(fileData.mimetype)) {
        throw new Error(`File type '${fileData.mimetype}' not allowed.`);
      }
    }

    return true;
  }
}