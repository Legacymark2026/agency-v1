/**
 * LegacyMark Public API v1 — Authentication Middleware
 * ─────────────────────────────────────────────────────
 * Validates Bearer API Keys, checks scope authorization,
 * logs usage, and returns an ApiKeyContext for downstream handlers.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import type { ApiKeyContext, ApiScope } from "./types";
import { apiResponse } from "./response";

/**
 * Validates the incoming request's Authorization header.
 * Extracts & hashes the Bearer token, then looks it up in the DB.
 * 
 * @param req     Incoming Next.js request
 * @param scope   The scope required for this endpoint (e.g. "leads:read")
 * @returns       { ctx, error } — only one will be set
 */
export async function validateApiKey(
    req: NextRequest,
    scope: ApiScope
): Promise<{ ctx: ApiKeyContext | null; error: NextResponse | null }> {
    // ── 1. Extract Bearer token ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return {
            ctx: null,
            error: apiResponse.unauthorized("Missing or invalid Authorization header. Use: Authorization: Bearer lm_live_..."),
        };
    }

    const rawToken = authHeader.slice(7).trim();
    if (!rawToken || !rawToken.startsWith("lm_")) {
        return {
            ctx: null,
            error: apiResponse.unauthorized("Invalid API key format. Keys must start with lm_live_"),
        };
    }

    // ── 2. Hash the token and look it up (never store raw keys) ─────────────
    const keyHash = createHash("sha256").update(rawToken).digest("hex");

    const apiKey = await prisma.apiKey.findFirst({
        where: { keyHash },
        include: {
            company: {
                select: { id: true, subscriptionTier: true },
            },
        },
    }).catch(() => null);

    // ── 3. Validate key existence and status ─────────────────────────────────
    if (!apiKey) {
        return {
            ctx: null,
            error: apiResponse.unauthorized("API key not found or has been revoked"),
        };
    }

    if (!apiKey.isActive) {
        return {
            ctx: null,
            error: apiResponse.unauthorized("API key is inactive. Please generate a new key from your Developer Console"),
        };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return {
            ctx: null,
            error: apiResponse.unauthorized(`API key expired on ${apiKey.expiresAt.toISOString()}. Rotate it from your Developer Console`),
        };
    }

    // ── 4. Scope check ───────────────────────────────────────────────────────
    const keyScopes = (apiKey.scopes as string[]) || [];
    if (!keyScopes.includes(scope)) {
        return {
            ctx: null,
            error: apiResponse.forbidden(
                `This API key does not have the required scope: "${scope}". ` +
                `Current scopes: [${keyScopes.join(", ")}]`
            ),
        };
    }

    // Log usage (fire-and-forget, non-blocking)
    prisma.userActivityLog.create({
        data: {
            userId: apiKey.userId ?? undefined,
            action: `api.${req.method.toLowerCase()}.${req.nextUrl.pathname}`,
            details: { keyId: apiKey.id, endpoint: req.nextUrl.pathname },
        },
    }).catch(() => { /* non-critical */ });

    // Update lastUsedAt (fire-and-forget)
    prisma.apiKey.update({
        where: { id: apiKey.id },
        data:  { lastUsedAt: new Date() },
    }).catch(() => { /* non-critical */ });

    return {
        ctx: {
            keyId:     apiKey.id,
            companyId: apiKey.companyId as string,
            userId:    apiKey.userId ?? "",
            scopes:    keyScopes,
            plan:      apiKey.company?.subscriptionTier ?? "free",
        },
        error: null,
    };
}
