/**
 * GET /api/v1/me
 * ──────────────
 * Returns metadata about the current API key (scopes, plan, key prefix).
 * Useful for clients to verify their credentials and check available scopes.
 *
 * Scope required: any valid active key (no specific scope needed)
 */

import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/api-v1/response";
import { checkRateLimit } from "@/lib/api-v1/rate-limit";
import { RATE_LIMITS } from "@/lib/api-v1/types";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
    return apiResponse.options();
}

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
        return apiResponse.unauthorized();
    }

    const rawToken = authHeader.slice(7).trim();
    const keyHash  = createHash("sha256").update(rawToken).digest("hex");

    const apiKey = await prisma.apiKey.findFirst({
        where: { keyHash },
        include: {
            company: { select: { name: true, subscriptionTier: true } },
            user:    { select: { firstName: true, lastName: true, email: true } },
        },
    });

    if (!apiKey || !apiKey.isActive) {
        return apiResponse.unauthorized("Invalid or revoked API key");
    }

    const rateLimitHeaders: Record<string, string> = {};
    const rateLimitError = checkRateLimit(
        { keyId: apiKey.id, companyId: apiKey.companyId ?? "unknown", userId: apiKey.userId ?? "",
          scopes: apiKey.scopes as string[], plan: apiKey.company?.subscriptionTier ?? "free" },
        rateLimitHeaders
    );
    if (rateLimitError) return rateLimitError;

    const plan = apiKey.company?.subscriptionTier ?? "free";
    const planLimits = RATE_LIMITS[plan] ?? RATE_LIMITS["free"];

    return apiResponse.ok({
        key: {
            prefix:    apiKey.prefix,
            name:      apiKey.name,
            scopes:    apiKey.scopes,
            isActive:  apiKey.isActive,
            expiresAt: apiKey.expiresAt?.toISOString() ?? null,
            createdAt: apiKey.createdAt.toISOString(),
            lastUsedAt: (apiKey as any).lastUsedAt?.toISOString() ?? null,
        },
        company: {
            name: apiKey.company?.name,
            plan,
        },
        createdBy: {
            name:  `${apiKey.user?.firstName ?? ""} ${apiKey.user?.lastName ?? ""}`.trim(),
            email: apiKey.user?.email,
        },
        rateLimit: {
            requestsPerHour: planLimits.requests,
            plan,
        },
    }, undefined, rateLimitHeaders);
}
