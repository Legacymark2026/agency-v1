/**
 * GET  /api/v1/webhooks  — List configured webhooks (scope: webhooks:manage)
 * POST /api/v1/webhooks  — Register a new webhook   (scope: webhooks:manage)
 */

import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-v1/auth";
import { checkRateLimit } from "@/lib/api-v1/rate-limit";
import { apiResponse } from "@/lib/api-v1/response";
import { API_SCOPES } from "@/lib/api-v1/types";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return apiResponse.options(); }

const SUPPORTED_EVENTS = [
    "lead.created", "lead.updated", "lead.deleted",
    "deal.won", "deal.lost", "deal.stage_changed",
    "contact.created", "contact.updated",
    "conversation.started", "message.received",
    "campaign.created", "payment.received", "invoice.sent",
    "automation.triggered",
];

export async function GET(req: NextRequest) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.WEBHOOKS_MANAGE);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const webhooks = await prisma.webhook.findMany({
        where: { companyId: ctx!.companyId },
        select: {
            id: true, name: true, url: true, events: true,
            isActive: true, failureCount: true,
            lastDeliveredAt: true, lastStatusCode: true,
            createdAt: true,
            _count: { select: { deliveryLogs: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const data = webhooks.map(w => ({
        ...w,
        deliveryCount: w._count.deliveryLogs,
        _count: undefined,
    }));

    return apiResponse.ok(data, undefined, rl);
}

export async function POST(req: NextRequest) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.WEBHOOKS_MANAGE);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    let body: Record<string, any>;
    try { body = await req.json(); }
    catch { return apiResponse.badRequest("Invalid JSON body"); }

    if (!body.name)   return apiResponse.badRequest("name is required");
    if (!body.url)    return apiResponse.badRequest("url is required");
    if (!body.events) return apiResponse.badRequest("events[] is required");

    if (!Array.isArray(body.events) || body.events.length === 0) {
        return apiResponse.badRequest("events must be a non-empty array");
    }

    const invalid = body.events.filter((e: string) => !SUPPORTED_EVENTS.includes(e));
    if (invalid.length > 0) {
        return apiResponse.badRequest(
            `Unsupported events: [${invalid.join(", ")}]. Supported: [${SUPPORTED_EVENTS.join(", ")}]`
        );
    }

    try { new URL(body.url); }
    catch { return apiResponse.badRequest(`Invalid URL: "${body.url}"`); }

    const secret = `whsec_${randomBytes(32).toString("hex")}`;

    const webhook = await prisma.webhook.create({
        data: {
            name:      body.name,
            url:       body.url,
            events:    body.events,
            secret,
            isActive:  true,
            companyId: ctx!.companyId,
        },
        select: {
            id: true, name: true, url: true, events: true,
            isActive: true, createdAt: true,
        },
    });

    return apiResponse.created({
        ...webhook,
        secret, // Only shown at creation time — store it securely!
        note: "The secret is shown only once. Use it to verify HMAC-SHA256 signatures on incoming requests (header: X-LegacyMark-Signature).",
    }, rl);
}
