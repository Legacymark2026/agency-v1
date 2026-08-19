"use strict";
/**
 * services/auth-service/src/utils/dpop.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Demonstrating Proof-of-Possession (DPoP) Validation Engine (RFC 9449)
 * Binds issued tokens to client-side public keys, mitigating token theft reuse.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateJwkThumbprint = calculateJwkThumbprint;
exports.verifyDPoPProof = verifyDPoPProof;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Calculates SHA-256 JWK thumbprint according to RFC 7638.
 * Binds client public key to JWT 'cnf' (confirmation) claim.
 */
function calculateJwkThumbprint(jwk) {
    // Sort keys alphabetically as required by RFC 7638 standard
    const canonicalJwk = JSON.stringify({
        e: jwk.e,
        kty: jwk.kty,
        n: jwk.n,
    });
    return crypto_1.default.createHash("sha256").update(canonicalJwk).digest("base64url");
}
/**
 * Verifies DPoP JWS proof signature and payload metadata.
 * @param dpopHeader Raw DPoP JWS proof string from client header
 * @param expectedMethod HTTP Method expected for verification
 * @param expectedUrl HTTP URL expected for verification
 */
async function verifyDPoPProof(dpopHeader, expectedMethod, expectedUrl) {
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
        const publicKey = crypto_1.default.createPublicKey({
            key: clientJwk,
            format: "jwk",
        });
        // 3. Verify Signature
        const signatureInput = `${parts[0]}.${parts[1]}`;
        const verified = crypto_1.default.verify("sha256", Buffer.from(signatureInput), publicKey, Buffer.from(parts[2], "base64url"));
        if (!verified) {
            return { success: false, error: "DPoP signature verification failed" };
        }
        // 4. Validate Claims
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
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
    }
    catch (err) {
        return { success: false, error: `DPoP processing failed: ${err.message}` };
    }
}
//# sourceMappingURL=dpop.js.map