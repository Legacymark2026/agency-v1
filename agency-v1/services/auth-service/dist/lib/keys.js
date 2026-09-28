"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCryptoKeys = initCryptoKeys;
exports.getCryptoKeys = getCryptoKeys;
/**
 * Cryptographic Keystore — Auth Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes C-1: Eliminates race conditions by deterministically loading or generating
 *            RS256 4096-bit RSA keys before any router or gRPC server accesses them.
 */
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let privateKey = null;
let publicKey = null;
function initCryptoKeys() {
    if (privateKey && publicKey) {
        return { privateKey, publicKey };
    }
    try {
        // 1. Check standard production cert mounts
        if (fs_1.default.existsSync("/certs/private.key") && fs_1.default.existsSync("/certs/public.key")) {
            privateKey = fs_1.default.readFileSync("/certs/private.key", "utf8");
            publicKey = fs_1.default.readFileSync("/certs/public.key", "utf8");
            console.log("[auth-service] RS256 keys loaded from /certs");
            return { privateKey, publicKey };
        }
        // 2. Check local repo certs
        const localPrivate = path_1.default.join(__dirname, "../../../certs/private.key");
        const localPublic = path_1.default.join(__dirname, "../../../certs/public.key");
        if (fs_1.default.existsSync(localPrivate) && fs_1.default.existsSync(localPublic)) {
            privateKey = fs_1.default.readFileSync(localPrivate, "utf8");
            publicKey = fs_1.default.readFileSync(localPublic, "utf8");
            console.log("[auth-service] RS256 keys loaded from local certs");
            return { privateKey, publicKey };
        }
    }
    catch (err) {
        console.warn("[auth-service] Key load warning:", err.message);
    }
    // 3. Fallback: generate high-entropy 4096-bit RSA keypair synchronously
    console.warn("[auth-service] ⚠️  No pre-mounted RSA keys found — generating 4096-bit RS256 keypair in memory.");
    const { privateKey: genPrivate, publicKey: genPublic } = crypto_1.default.generateKeyPairSync("rsa", {
        modulusLength: 4096,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    privateKey = genPrivate;
    publicKey = genPublic;
    return { privateKey, publicKey };
}
function getCryptoKeys() {
    return initCryptoKeys();
}
//# sourceMappingURL=keys.js.map