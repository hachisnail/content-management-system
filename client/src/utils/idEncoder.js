/**
 * Simple obfuscation to hide sequential IDs in URLs.
 * NOT for security (encryption), just for abstraction.
 */

export const encodeId = (id) => {
  if (!id) return '';
  try {
    // Prefix with 'uid_' to avoid short single-char strings
    // Base64 encode and make URL safe
    return btoa(`uid_${id}`)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    console.error("ID Encoding failed", e);
    return id;
  }
};

export const decodeId = (encoded) => {
  if (!encoded) return null;
  try {
    // Restore Base64 padding and chars
    let str = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    const decoded = atob(str);
    // Remove prefix
    return decoded.replace('uid_', '');
  } catch (e) {
    console.error("ID Decoding failed", e);
    return null;
  }
};