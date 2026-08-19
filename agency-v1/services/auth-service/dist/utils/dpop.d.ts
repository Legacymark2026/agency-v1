/**
 * services/auth-service/src/utils/dpop.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Demonstrating Proof-of-Possession (DPoP) Validation Engine (RFC 9449)
 * Binds issued tokens to client-side public keys, mitigating token theft reuse.
 */
export interface DPoPProof {
    htm: string;
    htu: string;
    iat: number;
    jti: string;
}
/**
 * Calculates SHA-256 JWK thumbprint according to RFC 7638.
 * Binds client public key to JWT 'cnf' (confirmation) claim.
 */
export declare function calculateJwkThumbprint(jwk: {
    kty: string;
    n: string;
    e: string;
}): string;
/**
 * Verifies DPoP JWS proof signature and payload metadata.
 * @param dpopHeader Raw DPoP JWS proof string from client header
 * @param expectedMethod HTTP Method expected for verification
 * @param expectedUrl HTTP URL expected for verification
 */
export declare function verifyDPoPProof(dpopHeader: string, expectedMethod: string, expectedUrl: string): Promise<{
    success: boolean;
    thumbprint?: string;
    error?: string;
}>;
