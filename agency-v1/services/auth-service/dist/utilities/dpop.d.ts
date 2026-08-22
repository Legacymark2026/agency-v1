/**
 * services/auth-service/src/utilities/dpop.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Demonstrating Proof-of-Possession (DPoP) Validation Engine (RFC 9449)
 */
export interface DPoPProof {
    htm: string;
    htu: string;
    iat: number;
    jti: string;
}
export declare function calculateJwkThumbprint(jwk: {
    kty: string;
    n: string;
    e: string;
}): string;
export declare function verifyDPoPProof(dpopHeader: string, expectedMethod: string, expectedUrl: string): Promise<{
    success: boolean;
    thumbprint?: string;
    error?: string;
}>;
