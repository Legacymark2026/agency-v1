import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

export interface DeviceSignals {
  canvasHash?: string;
  webglRenderer?: string;
  audioHash?: string;
  screenResolution?: string;
  cpuCores?: number | string;
  timezone?: string;
  platform?: string;
  language?: string;
  userAgent?: string;
  ipSubnet?: string;
}

const DEFAULT_SALT = process.env.FINGERPRINT_SECRET_SALT || "legacymark-antiabuse-salt-2026";

/**
 * Normalizes an IP address to its /24 IPv4 or /48 IPv6 subnet
 * to balance uniqueness with privacy and minor dynamic IP shifts.
 */
export function canonicalizeIpSubnet(ip?: string | null): string {
  if (!ip) return "0.0.0.0/0";
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
export function generateDeviceHash(signals: DeviceSignals, salt: string = DEFAULT_SALT): string {
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

  return crypto.createHmac("sha256", salt).update(payload).digest("hex");
}

/**
 * Express middleware to automatically extract or synthesize the device fingerprint from headers.
 */
export function deviceFingerprintMiddleware(salt: string = DEFAULT_SALT) {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Direct client header from frontend SDK if available
    const directHeader = req.headers["x-device-fingerprint"] as string;
    
    // 2. Client-provided hardware signals payload
    let signals: DeviceSignals = {};
    const signalsHeader = req.headers["x-device-signals"] as string;
    if (signalsHeader) {
      try {
        const decoded = Buffer.from(signalsHeader, "base64").toString("utf8");
        signals = JSON.parse(decoded);
      } catch {
        // Fallback to basic header extraction
      }
    }

    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip;
    signals.userAgent = signals.userAgent || (req.headers["user-agent"] as string);
    signals.language = signals.language || (req.headers["accept-language"] as string);
    signals.ipSubnet = signals.ipSubnet || clientIp;

    // Use direct header if it's a valid 64-char sha256 hex, else compute deterministically
    const finalHash =
      directHeader && directHeader.length === 64 && /^[0-9a-f]+$/i.test(directHeader)
        ? directHeader.toLowerCase()
        : generateDeviceHash(signals, salt);

    (req as any).deviceFingerprint = finalHash;
    (req as any).deviceSignals = signals;

    res.setHeader("x-device-fingerprint", finalHash);
    next();
  };
}
