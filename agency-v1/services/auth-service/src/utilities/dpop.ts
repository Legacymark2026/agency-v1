/**
 * services/auth-service/src/utilities/dpop.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Demonstrating Proof-of-Possession (DPoP) Validation Engine (RFC 9449)
 */

import crypto from "crypto";

export interface DPoPProof {
  htm: string;
  htu: string;
  iat: number;
  jti: string;
}

export function calculateJwkThumbprint(jwk: { kty: string; n: string; e: string }): string {
  const canonicalJwk = JSON.stringify({
    e: jwk.e,
    kty: jwk.kty,
    n: jwk.n,
  });
  return crypto.createHash("sha256").update(canonicalJwk).digest("base64url");
}

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

    const headerDecoded = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (headerDecoded.typ !== "dpop+jwt" || !headerDecoded.alg || !headerDecoded.jwk) {
      return { success: false, error: "Invalid DPoP header typ or algorithms" };
    }

    const clientJwk = headerDecoded.jwk;
    const publicKey = crypto.createPublicKey({
      key: clientJwk,
      format: "jwk",
    });

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

    const payload: DPoPProof = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));

    if (payload.htm.toUpperCase() !== expectedMethod.toUpperCase()) {
      return { success: false, error: "DPoP HTTP method mismatch" };
    }

    if (!expectedUrl.includes(payload.htu)) {
      const cleanHtu = payload.htu.split("?")[0];
      const cleanExpected = expectedUrl.split("?")[0];
      if (cleanHtu !== cleanExpected && !cleanExpected.endsWith(cleanHtu)) {
        return { success: false, error: `DPoP URI mismatch: expected ${expectedUrl}, got ${payload.htu}` };
      }
    }

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
