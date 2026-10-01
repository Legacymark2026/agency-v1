/**
 * Key Management Service (KMS)
 * Cifra llaves de API usando AES-256-GCM
 */
import crypto from 'crypto';

// En prod, esto debe venir del entorno o de un Vault. Fallback local para dev.
const KMS_MASTER_KEY = process.env.KMS_MASTER_KEY || "a2b4c6d8e0f1234567890abcdef1234567890abcdef1234567890abcdef12345"; 

export class KmsService {
  private static getAlgorithm() { return 'aes-256-gcm'; }
  private static getKey() {
    return Buffer.from(KMS_MASTER_KEY.substring(0, 32), 'utf-8');
  }

  public static encrypt(plainText: string): { cipherText: string; iv: string; authTag: string } {
    if (!plainText) return { cipherText: "", iv: "", authTag: "" };
    
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.getAlgorithm(), this.getKey(), iv) as crypto.CipherGCM;
    
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return {
      cipherText: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag
    };
  }

  public static decrypt(cipherText: string, ivHex: string, authTagHex: string): string {
    if (!cipherText || !ivHex || !authTagHex) return "";
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.getAlgorithm(), this.getKey(), iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(cipherText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
