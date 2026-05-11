/**
 * GET  /api/v1/conversations        — List inbox conversations (scope: inbox:read)
 * POST /api/v1/conversations        — Create/open a conversation (scope: inbox:write)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-v1/auth";
import { checkRateLimit } from "@/lib/api-v1/rate-limit";
import { apiResponse } from "@/lib/api-v1/response";
import { API_SCOPES } from "@/lib/api-v1/types";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return apiResponse.options(); }

export async function GET(req: NextRequest) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.INBOX_READ);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { searchParams } = req.nextUrl;
    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const skip   = (page - 1) * limit;
    const status = searchParams.get("status") ?? undefined;

    const where = {
        companyId: ctx!.companyId,
        ...(status && { status }),
    };

    const [total, conversations] = await Promise.all([
        prisma.conversation.count({ where }),
        prisma.conversation.findMany({
            where,
            select: {
                id: true, status: true, channel: true, platform: true,
                contactName: true, contactPhone: true, contactEmail: true,
                assignedToId: true, tags: true, unreadCount: true,
                lastMessageAt: true, createdAt: true,
                assignedTo: { select: { firstName: true, lastName: true } },
                messages: {
                    select: { body: true, direction: true, createdAt: true },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
            orderBy: { lastMessageAt: "desc" },
            skip, take: limit,
        }),
    ]);

    const data = conversations.map(c => ({
        id: c.id, status: c.status, channel: c.channel, platform: c.platform,
        contact: { name: c.contactName, phone: c.contactPhone, email: c.contactEmail },
        assignedTo: c.assignedTo
            ? `${c.assignedTo.firstName ?? ""} ${c.assignedTo.lastName ?? ""}`.trim()
            : null,
        tags: c.tags,
        unreadCount: c.unreadCount,
        lastMessage: c.messages[0] ?? null,
        lastMessageAt: c.lastMessageAt,
        createdAt: c.createdAt,
    }));

    return apiResponse.ok(data, { page, limit, total, hasMore: skip + limit < total }, rl);
}

export async function POST(req: NextRequest) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.INBOX_WRITE);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    let body: Record<string, any>;
    try { body = await req.json(); }
    catch { return apiResponse.badRequest("Invalid JSON body"); }

    if (!body.contactPhone && !body.contactEmail) {
        return apiResponse.badRequest("contactPhone or contactEmail is required");
    }

    const conversation = await prisma.conversation.create({
        data: {
            channel:      body.channel      ?? "WHATSAPP",
            platform:     body.platform     ?? "whatsapp",
            contactName:  body.contactName,
            contactPhone: body.contactPhone,
            contactEmail: body.contactEmail,
            status:       "OPEN",
            companyId:    ctx!.companyId,
        },
        select: {
            id: true, channel: true, platform: true,
            contactName: true, contactPhone: true, status: true, createdAt: true,
        },
    });

    return apiResponse.created(conversation, rl);
}
