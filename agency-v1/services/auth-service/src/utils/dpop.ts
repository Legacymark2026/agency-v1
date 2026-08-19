/**
 * services/auth-service/src/utils/dpop.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Demonstrating Proof-of-Possession (DPoP) Validation Engine (RFC 9449)
 * Binds issued tokens to client-side public keys, mitigating token theft reuse.
 */

import crypto from "crypto";

export interface DPoPProof {
  htm: string; // HTTP Method (e.g. POST, GET)
  htu: string; // HTTP URI (e.g. https://api.legacymark.com/oauth/token)
  iat: number; // Issued At timestamp
  jti: string; // Unique token identifier (replay protection)
}

/**
 * Calculates SHA-256 JWK thumbprint according to RFC 7638.
 * Binds client public key to JWT 'cnf' (confirmation) claim.
 */
export function calculateJwkThumbprint(jwk: { kty: string; n: string; e: string }): string {
  // Sort keys alphabetically as required by RFC 7638 standard
  const canonicalJwk = JSON.stringify({
    e: jwk.e,
    kty: jwk.kty,
    n: jwk.n,
  });
  return crypto.createHash("sha256").update(canonicalJwk).digest("base64url");
}

/**
 * Verifies DPoP JWS proof signature and payload metadata.
 * @param dpopHeader Raw DPoP JWS proof string from client header
 * @param expectedMethod HTTP Method expected for verification
 * @param expectedUrl HTTP URL expected for verification
 */
export async function verifyDPoPProof(
  dpopHeader: string,
  expectedMethod: string,
  expectedUrl: string
): Promise<{ success: boolean; thumbprint?: string; error?: string }> {
  try {
    const parts = dpopHeader.split(".");
    if (parts.length !== 3) {
      return { success: false, error: "Invalid DPoP token format" };
    }

    // 1. Decode Header and Extract Public JWK Key
    const headerDecoded = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (headerDecoded.typ !== "dpop+jwt" || !headerDecoded.alg || !headerDecoded.jwk) {
      return { success: false, error: "Invalid DPoP header typ or algorithms" };
    }

    const clientJwk = headerDecoded.jwk;

    // 2. Re-create public key object from JWK to verify signature
    const publicKey = crypto.createPublicKey({
      key: clientJwk,
      format: "jwk",
    });

    // 3. Verify Signature
    const signatureInput = `${parts[0]}.${parts[1]}`;
    const verified = crypto.verify(
      "sha256",
      Buffer.from(signatureInput),
      publicKey,
      Buffer.from(parts[2], "base64url")
    );

    if (!verified) {
      return { success: false, error: "DPoP signature verification failed" };
    }

    // 4. Validate Claims
    const payload: DPoPProof = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));

    if (payload.htm.toUpperCase() !== expectedMethod.toUpperCase()) {
      return { success: false, error: "DPoP HTTP method mismatch" };
    }

    // Validate URI (allow path matching)
    if (!expectedUrl.includes(payload.htu)) {
      // Basic check
      const cleanHtu = payload.htu.split("?")[0];
      const cleanExpected = expectedUrl.split("?")[0];
      if (cleanHtu !== cleanExpected && !cleanExpected.endsWith(cleanHtu)) {
        return { success: false, error: `DPoP URI mismatch: expected ${expectedUrl}, got ${payload.htu}` };
      }
    }

    // 5. Expiry Check (Proofs must be fresh, e.g., max 120s old to prevent replay)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - payload.iat) > 120) {
      return { success: false, error: "DPoP proof expired or clock skewed too far" };
    }

    const thumbprint = calculateJwkThumbprint(clientJwk);
    return { success: true, thumbprint };
  } catch (err: any) {
    return { success: false, error: `DPoP processing failed: ${err.message}` };
  }
}
