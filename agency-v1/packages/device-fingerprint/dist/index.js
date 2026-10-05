"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceRateLimiter = void 0;
exports.analyzeBotSignals = analyzeBotSignals;
exports.canonicalizeIpSubnet = canonicalizeIpSubnet;
exports.generateDeviceHash = generateDeviceHash;
exports.deviceFingerprintMiddleware = deviceFingerprintMiddleware;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Analyzes hardware and runtime signals to detect headless environments,
 * emulators, automation frameworks (Puppeteer, Selenium) and bot farms.
 */
function analyzeBotSignals(signals) {
    const reasons = [];
    let score = 0.0;
    // 1. WebDriver automation flag
    if (signals.isWebDriver) {
        score += 0.8;
        reasons.push("NAVIGATOR_WEBDRIVER_ACTIVE");
    }
    const ua = (signals.userAgent || "").toLowerCase();
    // 2. Headless browser patterns
    if (ua.includes("headlesschrome") || ua.includes("phantomjs") || ua.includes("puppeteer") || ua.includes("playwright")) {
        score += 0.9;
        reasons.push("HEADLESS_USER_AGENT_PATTERN");
    }
    // 3. Virtualized / Software WebGL Renderers (common in cloud servers / containers)
    const renderer = (signals.webglRenderer || "").toLowerCase();
    if (renderer.includes("llvmpipe") ||
        renderer.includes("mesa offscreen") ||
        renderer.includes("swiftshader") ||
        renderer.includes("virtualbox") ||
        renderer.includes("vmware")) {
        score += 0.7;
        reasons.push(`SOFTWARE_WEBGL_RENDERER: ${signals.webglRenderer}`);
    }
    // 4. Abnormal CPU / Screen combinations
    if (signals.cpuCores === 0 || signals.cpuCores === "0") {
        score += 0.3;
        reasons.push("ZERO_CPU_CORES_REPORTED");
    }
    if (signals.screenResolution === "0x0" || signals.screenResolution === "800x600") {
        score += 0.2;
        reasons.push(`GENERIC_OR_EMPTY_RESOLUTION: ${signals.screenResolution}`);
    }
    const normalizedScore = Math.min(1.0, score);
    return {
        isBotOrHeadless: normalizedScore >= 0.7,
        botRiskScore: Number(normalizedScore.toFixed(2)),
        reasons,
    };
}
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
        const botAnalysis = analyzeBotSignals(signals);
        req.deviceFingerprint = finalHash;
        req.deviceSignals = signals;
        req.botAnalysis = botAnalysis;
        res.setHeader("x-device-fingerprint", finalHash);
        res.setHeader("x-device-bot-risk", String(botAnalysis.botRiskScore));
        if (botAnalysis.isBotOrHeadless) {
            res.setHeader("x-device-bot-detected", "1");
        }
        next();
    };
}
/**
 * In-memory or Redis-compatible device rate limiter
 * Enforces a maximum number of trial requests per device within a sliding window.
 */
class DeviceRateLimiter {
    static memoryStore = new Map();
    static isRateLimited(deviceHash, maxRequests = 3, windowSeconds = 86400) {
        const now = Date.now();
        const entry = this.memoryStore.get(deviceHash);
        if (!entry || entry.resetAt <= now) {
            this.memoryStore.set(deviceHash, { count: 1, resetAt: now + windowSeconds * 1000 });
            return { limited: false, remaining: maxRequests - 1, resetInSec: windowSeconds };
        }
        if (entry.count >= maxRequests) {
            const resetInSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
            return { limited: true, remaining: 0, resetInSec };
        }
        entry.count += 1;
        const resetInSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
        return { limited: false, remaining: maxRequests - entry.count, resetInSec };
    }
}
exports.DeviceRateLimiter = DeviceRateLimiter;
