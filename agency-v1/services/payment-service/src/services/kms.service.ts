import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
// En un entorno real, la master key viene de AWS KMS o HashiCorp Vault.
const KMS_MASTER_KEY = process.env.KMS_MASTER_KEY || "0123456789abcdef0123456789abcdef"; // 32 bytes

export class KmsService {
  static encrypt(plainText: string) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KMS_MASTER_KEY), iv);
    let cipherText = cipher.update(plainText, "utf8", "hex");
    cipherText += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return {
      cipherText,
      iv: iv.toString("hex"),
      authTag,
    };
  }

  static decrypt(cipherText: string, ivHex: string, authTagHex: string) {
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(KMS_MASTER_KEY), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    let plainText = decipher.update(cipherText, "hex", "utf8");
    plainText += decipher.final("utf8");
    return plainText;
  }
}
