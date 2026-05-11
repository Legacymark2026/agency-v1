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
    const conv = await prisma.conversation.findFirst({
        where: { id, companyId: ctx!.companyId },
    });
    if (!conv) return apiResponse.notFound("Conversation");

    const { searchParams } = req.nextUrl;
    const limit = Math.min(200, parseInt(searchParams.get("limit") ?? "50"));

    const messages = await prisma.message.findMany({
        where: { conversationId: id },
        select: {
            id: true, content: true, direction: true, type: true,
            mediaUrl: true, status: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" },
        take: limit,
    });

    // Normalize: expose `body` as alias for `content` for API consumers
    const data = messages.map(m => ({
        id: m.id,
        body: m.content,
        direction: m.direction,
        type: m.type,
        mediaUrl: m.mediaUrl,
        status: m.status,
        createdAt: m.createdAt,
    }));

    return apiResponse.ok(data, undefined, rl);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.INBOX_WRITE);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { id } = await params;
    const conv = await prisma.conversation.findFirst({
        where: { id, companyId: ctx!.companyId },
    });
    if (!conv) return apiResponse.notFound("Conversation");

    let body: Record<string, any>;
    try { body = await req.json(); }
    catch { return apiResponse.badRequest("Invalid JSON body"); }

    const messageContent = body.message ?? body.body ?? body.content;
    if (!messageContent) {
        return apiResponse.badRequest("message (or body/content) is required");
    }

    const message = await prisma.message.create({
        data: {
            content:        messageContent,
            direction:      "outbound",
            type:           body.type ?? "TEXT",
            status:         "SENT",
            conversationId: id,
        },
        select: {
            id: true, content: true, direction: true,
            type: true, status: true, createdAt: true,
        },
    });

    // Update conversation lastMessageAt
    await prisma.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() },
    }).catch(() => {});

    return apiResponse.created({
        id: message.id,
        body: message.content,
        direction: message.direction,
        type: message.type,
        status: message.status,
        createdAt: message.createdAt,
        note: "Message queued. Delivery depends on the configured channel provider.",
    }, rl);
}
