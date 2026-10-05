"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canonicalizeIpSubnet = canonicalizeIpSubnet;
exports.generateDeviceHash = generateDeviceHash;
exports.deviceFingerprintMiddleware = deviceFingerprintMiddleware;
const crypto_1 = __importDefault(require("crypto"));
const DEFAULT_SALT = process.env.FINGERPRINT_SECRET_SALT || "legacymark-antiabuse-salt-2026";
/**
 * Normalizes an IP address to its /24 IPv4 or /48 IPv6 subnet
 * to balance uniqueness with privacy and minor dynamic IP shifts.
 */
function canonicalizeIpSubnet(ip) {
    if (!ip)
        return "0.0.0.0/0";
    const cleaned = ip.replace(/^.*:/, ""); // strip IPv6 prefix if mapped (e.g. ::ffff:192.168.1.1)
    const parts = cleaned.split(".");
    if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
    return ip.slice(0, 19); // IPv6 prefix approx
}
/**
 * Computes a deterministic HMAC-SHA256 device fingerprint from hardware & environment signals.
 */
function generateDeviceHash(signals, salt = DEFAULT_SALT) {
    const payload = [
        signals.canvasHash || "no-canvas",
        signals.webglRenderer || "no-webgl",
        signals.audioHash || "no-audio",
        signals.screenResolution || "no-res",
        signals.cpuCores ? String(signals.cpuCores) : "0",
        signals.timezone || "UTC",
        signals.platform || "unknown",
        (signals.language || "en").toLowerCase().slice(0, 2),
        (signals.userAgent || "generic").trim().toLowerCase().slice(0, 120),
        canonicalizeIpSubnet(signals.ipSubnet),
    ].join("|");
    return crypto_1.default.createHmac("sha256", salt).update(payload).digest("hex");
}
/**
 * Express middleware to automatically extract or synthesize the device fingerprint from headers.
 */
function deviceFingerprintMiddleware(salt = DEFAULT_SALT) {
    return (req, res, next) => {
        // 1. Direct client header from frontend SDK if available
        const directHeader = req.headers["x-device-fingerprint"];
        // 2. Client-provided hardware signals payload
        let signals = {};
        const signalsHeader = req.headers["x-device-signals"];
        if (signalsHeader) {
            try {
                const decoded = Buffer.from(signalsHeader, "base64").toString("utf8");
                signals = JSON.parse(decoded);
            }
            catch {
                // Fallback to basic header extraction
            }
        }
        const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
        signals.userAgent = signals.userAgent || req.headers["user-agent"];
        signals.language = signals.language || req.headers["accept-language"];
        signals.ipSubnet = signals.ipSubnet || clientIp;
        // Use direct header if it's a valid 64-char sha256 hex, else compute deterministically
        const finalHash = directHeader && directHeader.length === 64 && /^[0-9a-f]+$/i.test(directHeader)
            ? directHeader.toLowerCase()
            : generateDeviceHash(signals, salt);
        req.deviceFingerprint = finalHash;
        req.deviceSignals = signals;
        res.setHeader("x-device-fingerprint", finalHash);
        next();
    };
}
