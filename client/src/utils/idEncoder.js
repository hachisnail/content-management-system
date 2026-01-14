/**
 * ID Encoder / Decoder
 * * UPDATE: Migrated to ULID.
 * ULIDs are case-insensitive, but we normalize to lowercase
 * to keep URLs, logs, and comparisons consistent.
 */

export const encodeId = (id) => {
  if (!id) return '';
  return String(id).toLowerCase();
};

export const decodeId = (encoded) => {
  if (!encoded) return null;
  return String(encoded).toLowerCase();
};
