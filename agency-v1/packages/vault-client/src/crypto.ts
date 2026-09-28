import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.PII_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('PII_ENCRYPTION_KEY environment variable is missing.');
  }
  // Ensure the key is exactly 32 bytes for aes-256-gcm
  const keyBuffer = Buffer.from(secret, 'utf-8');
  if (keyBuffer.length !== 32) {
    throw new Error('PII_ENCRYPTION_KEY must be exactly 32 bytes long.');
  }
  return keyBuffer;
}

/**
 * Encrypts a string using AES-256-GCM for PII protection.
 * @param text The plain text to encrypt.
 * @returns The encrypted string encoded in base64 (format: iv + tag + encrypted text).
 */
export function encryptPII(text: string): string {
  if (!text) return text;
  
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/**
 * Decrypts a string previously encrypted with encryptPII.
 * @param hash The encrypted string in base64.
 * @returns The decrypted plain text.
 */
export function decryptPII(hash: string): string {
  if (!hash) return hash;
  
  const key = getKey();
  const buffer = Buffer.from(hash, 'base64');
  
  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
