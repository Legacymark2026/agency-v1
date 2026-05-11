/**
 * GET  /api/v1/conversations/[id]/messages — List messages  (scope: inbox:read)
 * POST /api/v1/conversations/[id]/messages — Send message   (scope: inbox:write)
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
    const { ctx, error } = await validateApiKey(req, API_SCOPES.INBOX_READ);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { id } = await params;
    const conv = await prisma.conversation.findFirst({ where: { id, companyId: ctx!.companyId } });
    if (!conv) return apiResponse.notFound("Conversation");

    const { searchParams } = req.nextUrl;
    const limit = Math.min(200, parseInt(searchParams.get("limit") ?? "50"));

    const messages = await prisma.message.findMany({
        where: { conversationId: id },
        select: {
            id: true, body: true, direction: true, type: true,
            mediaUrl: true, status: true, errorMessage: true,
            createdAt: true,
            sentBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "asc" },
        take: limit,
    });

    return apiResponse.ok(messages, undefined, rl);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.INBOX_WRITE);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { id } = await params;
    const conv = await prisma.conversation.findFirst({ where: { id, companyId: ctx!.companyId } });
    if (!conv) return apiResponse.notFound("Conversation");

    let body: Record<string, any>;
    try { body = await req.json(); }
    catch { return apiResponse.badRequest("Invalid JSON body"); }

    if (!body.message && !body.body) {
        return apiResponse.badRequest("message (or body) is required");
    }

    const message = await prisma.message.create({
        data: {
            body:           body.message ?? body.body,
            direction:      "outbound",
            type:           body.type ?? "text",
            status:         "pending",
            conversationId: id,
            companyId:      ctx!.companyId,
        },
        select: {
            id: true, body: true, direction: true,
            type: true, status: true, createdAt: true,
        },
    });

    // Update conversation lastMessageAt
    await prisma.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() },
    });

    return apiResponse.created({
        ...message,
        note: "Message queued. Delivery depends on the configured channel provider (WhatsApp, Meta, etc.)",
    }, rl);
}
