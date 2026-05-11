/**
 * GET    /api/v1/webhooks/[id]  — Get webhook    (scope: webhooks:manage)
 * PUT    /api/v1/webhooks/[id]  — Update webhook (scope: webhooks:manage)
 * DELETE /api/v1/webhooks/[id]  — Delete webhook (scope: webhooks:manage)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-v1/auth";
import { checkRateLimit } from "@/lib/api-v1/rate-limit";
import { apiResponse } from "@/lib/api-v1/response";
import { API_SCOPES } from "@/lib/api-v1/types";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return apiResponse.options(); }

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.WEBHOOKS_MANAGE);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { id } = await params;
    const webhook = await prisma.webhook.findFirst({
        where: { id, companyId: ctx!.companyId },
        select: {
            id: true, name: true, url: true, events: true,
            isActive: true, failureCount: true,
            lastDeliveredAt: true, lastStatusCode: true, createdAt: true,
            deliveryLogs: {
                orderBy: { deliveredAt: "desc" },
                take: 10,
                select: {
                    id: true, statusCode: true, success: true,
                    durationMs: true, responseBody: true, deliveredAt: true,
                },
            },
        },
    });
    if (!webhook) return apiResponse.notFound("Webhook");

    return apiResponse.ok(webhook, undefined, rl);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.WEBHOOKS_MANAGE);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { id } = await params;
    if (!await prisma.webhook.findFirst({ where: { id, companyId: ctx!.companyId } })) {
        return apiResponse.notFound("Webhook");
    }

    let body: Record<string, any>;
    try { body = await req.json(); }
    catch { return apiResponse.badRequest("Invalid JSON body"); }

    const updated = await prisma.webhook.update({
        where: { id },
        data: {
            ...(body.name     !== undefined && { name:     body.name }),
            ...(body.url      !== undefined && { url:      body.url }),
            ...(body.events   !== undefined && { events:   body.events }),
            ...(body.isActive !== undefined && { isActive: body.isActive }),
        },
        select: {
            id: true, name: true, url: true, events: true,
            isActive: true, updatedAt: true,
        },
    });

    return apiResponse.ok(updated, undefined, rl);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.WEBHOOKS_MANAGE);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { id } = await params;
    if (!await prisma.webhook.findFirst({ where: { id, companyId: ctx!.companyId } })) {
        return apiResponse.notFound("Webhook");
    }

    await prisma.webhook.delete({ where: { id } });
    return apiResponse.noContent();
}
