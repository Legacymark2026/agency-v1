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
    isWebDriver?: boolean;
    hasLanguages?: boolean;
}
export interface BotAnalysisResult {
    isBotOrHeadless: boolean;
    botRiskScore: number;
    reasons: string[];
}
/**
 * Analyzes hardware and runtime signals to detect headless environments,
 * emulators, automation frameworks (Puppeteer, Selenium) and bot farms.
 */
export declare function analyzeBotSignals(signals: DeviceSignals): BotAnalysisResult;
/**
 * Normalizes an IP address to its /24 IPv4 or /48 IPv6 subnet
 * to balance uniqueness with privacy and minor dynamic IP shifts.
 */
export declare function canonicalizeIpSubnet(ip?: string | null): string;
/**
 * Computes a deterministic HMAC-SHA256 device fingerprint from hardware & environment signals.
 */
export declare function generateDeviceHash(signals: DeviceSignals, salt?: string): string;
/**
 * Express middleware to automatically extract or synthesize the device fingerprint from headers.
 */
export declare function deviceFingerprintMiddleware(salt?: string): (req: Request, res: Response, next: NextFunction) => void;
/**
 * In-memory or Redis-compatible device rate limiter
 * Enforces a maximum number of trial requests per device within a sliding window.
 */
export declare class DeviceRateLimiter {
    private static readonly memoryStore;
    static isRateLimited(deviceHash: string, maxRequests?: number, windowSeconds?: number): {
        limited: boolean;
        remaining: number;
        resetInSec: number;
    };
}
