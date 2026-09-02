/**
 * Cryptographic Keystore — Auth Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes C-1: Eliminates race conditions by deterministically loading or generating
 *            RS256 4096-bit RSA keys before any router or gRPC server accesses them.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";

let privateKey: string | null = null;
let publicKey: string | null = null;

export function initCryptoKeys(): { privateKey: string; publicKey: string } {
  if (privateKey && publicKey) {
    return { privateKey, publicKey };
  }

  try {
    // 1. Check standard production cert mounts
    if (fs.existsSync("/certs/private.key") && fs.existsSync("/certs/public.key")) {
      privateKey = fs.readFileSync("/certs/private.key", "utf8");
      publicKey = fs.readFileSync("/certs/public.key", "utf8");
      console.log("[auth-service] RS256 keys loaded from /certs");
      return { privateKey, publicKey };
    }

    // 2. Check local repo certs
    const localPrivate = path.join(__dirname, "../../../certs/private.key");
    const localPublic = path.join(__dirname, "../../../certs/public.key");
    if (fs.existsSync(localPrivate) && fs.existsSync(localPublic)) {
      privateKey = fs.readFileSync(localPrivate, "utf8");
      publicKey = fs.readFileSync(localPublic, "utf8");
      console.log("[auth-service] RS256 keys loaded from local certs");
      return { privateKey, publicKey };
    }
  } catch (err: any) {
    console.warn("[auth-service] Key load warning:", err.message);
  }

  // 3. Fallback: generate high-entropy 4096-bit RSA keypair synchronously
  console.warn("[auth-service] ⚠️  No pre-mounted RSA keys found — generating 4096-bit RS256 keypair in memory.");
  const { privateKey: genPrivate, publicKey: genPublic } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  privateKey = genPrivate;
  publicKey = genPublic;

  return { privateKey, publicKey };
}

export function getCryptoKeys(): { privateKey: string; publicKey: string } {
  return initCryptoKeys();
}
