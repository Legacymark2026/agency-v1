import crypto from 'crypto';

/**
 * SHA-256 normalizes and hashes sensitive data string (ex: email) according to Ads APIs specs.
 * Requires lowercase, trimmed, no-extra-spaces string before hashing.
 */
export function hashData(data: string | null | undefined): string | undefined {
  if (!data) return undefined;
  const normalized = data.trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * SHA-256 normalizes and hashes phone numbers according to Meta/Google specs.
 * Requires only numbers (including country code) before hashing.
 */
export function hashPhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined;
  // Remove all non-numeric characters for phone normalization
  const normalized = phone.replace(/\D/g, '');
  if (!normalized) return undefined;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
