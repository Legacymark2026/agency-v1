/**
 * LegacyMark Public API v1 — Standardized Response Helpers
 * ──────────────────────────────────────────────────────────
 * Every public API response goes through these helpers to ensure
 * a consistent envelope: { success, data?, error?, meta? }
 */

import { NextResponse } from "next/server";
import type { ApiResponse } from "./types";

type CorsHeaders = {
    "Access-Control-Allow-Origin": string;
    "Access-Control-Allow-Methods": string;
    "Access-Control-Allow-Headers": string;
    "X-API-Version": string;
};

const BASE_CORS_HEADERS: CorsHeaders = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "X-API-Version":                "1.0.0",
};

function buildHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return { ...BASE_CORS_HEADERS, ...extra };
}

export const apiResponse = {
    /** 200 OK */
    ok<T>(data: T, meta?: ApiResponse["meta"], extraHeaders: Record<string, string> = {}) {
        const body: ApiResponse<T> = { success: true, data, meta };
        return NextResponse.json(body, {
            status: 200,
            headers: buildHeaders(extraHeaders),
        });
    },

    /** 201 Created */
    created<T>(data: T, extraHeaders: Record<string, string> = {}) {
        const body: ApiResponse<T> = { success: true, data };
        return NextResponse.json(body, {
            status: 201,
            headers: buildHeaders(extraHeaders),
        });
    },

    /** 204 No Content */
    noContent() {
        return new NextResponse(null, {
            status: 204,
            headers: buildHeaders(),
        });
    },

    /** 400 Bad Request */
    badRequest(message: string) {
        const body: ApiResponse = { success: false, error: message };
        return NextResponse.json(body, {
            status: 400,
            headers: buildHeaders(),
        });
    },

    /** 401 Unauthorized */
    unauthorized(message = "Unauthorized. Provide a valid Bearer token.") {
        const body: ApiResponse = { success: false, error: message };
        return NextResponse.json(body, {
            status: 401,
            headers: buildHeaders({
                "WWW-Authenticate": 'Bearer realm="LegacyMark API", charset="UTF-8"',
            }),
        });
    },

    /** 403 Forbidden (authenticated but missing scope) */
    forbidden(message = "Forbidden. Your API key lacks the required scope.") {
        const body: ApiResponse = { success: false, error: message };
        return NextResponse.json(body, {
            status: 403,
            headers: buildHeaders(),
        });
    },

    /** 404 Not Found */
    notFound(resource = "Resource") {
        const body: ApiResponse = { success: false, error: `${resource} not found` };
        return NextResponse.json(body, {
            status: 404,
            headers: buildHeaders(),
        });
    },

    /** 409 Conflict */
    conflict(message: string) {
        const body: ApiResponse = { success: false, error: message };
        return NextResponse.json(body, {
            status: 409,
            headers: buildHeaders(),
        });
    },

    /** 429 Too Many Requests */
    rateLimited(limit: number, resetAt: Date) {
        const resetTimestamp = Math.ceil(resetAt.getTime() / 1000);
        const body: ApiResponse = {
            success: false,
            error: `Rate limit exceeded. Your plan allows ${limit} requests/hour. Try again after ${resetAt.toISOString()}.`,
        };
        return NextResponse.json(body, {
            status: 429,
            headers: buildHeaders({
                "X-RateLimit-Limit":     String(limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset":     String(resetTimestamp),
                "Retry-After":           String(resetTimestamp),
            }),
        });
    },

    /** 500 Internal Server Error */
    serverError(message = "Internal Server Error") {
        const body: ApiResponse = { success: false, error: message };
        return NextResponse.json(body, {
            status: 500,
            headers: buildHeaders(),
        });
    },

    /** Preflight OPTIONS handler */
    options() {
        return new NextResponse(null, {
            status: 204,
            headers: buildHeaders(),
        });
    },
};
