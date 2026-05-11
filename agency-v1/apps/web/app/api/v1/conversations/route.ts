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
                id: true, status: true, channel: true, platformId: true,
                assignedTo: true, tags: true, unreadCount: true,
                lastMessageAt: true, createdAt: true, leadId: true,
                assignee: { select: { firstName: true, lastName: true } },
                lead: { select: { name: true, phone: true, email: true } },
                messages: {
                    select: { content: true, direction: true, createdAt: true },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
            orderBy: { lastMessageAt: "desc" },
            skip, take: limit,
        }),
    ]);

    const data = conversations.map(c => ({
        id: c.id, status: c.status, channel: c.channel, platform: c.platformId,
        contact: c.lead
            ? { name: c.lead.name, phone: c.lead.phone, email: c.lead.email }
            : null,
        assignedTo: c.assignee
            ? `${c.assignee.firstName ?? ""} ${c.assignee.lastName ?? ""}`.trim()
            : null,
        tags: c.tags,
        unreadCount: c.unreadCount,
        lastMessage: c.messages[0]
            ? { body: c.messages[0].content, direction: c.messages[0].direction, createdAt: c.messages[0].createdAt }
            : null,
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

    // leadId is required to link a conversation to a contact
    if (!body.leadId && !body.lead_id) {
        return apiResponse.badRequest("leadId is required to open a conversation");
    }

    const leadId = body.leadId ?? body.lead_id;
    const lead = await prisma.lead.findFirst({ where: { id: leadId, companyId: ctx!.companyId } });
    if (!lead) return apiResponse.notFound("Lead");

    const conversation = await prisma.conversation.create({
        data: {
            channel:    body.channel    ?? "WHATSAPP",
            platformId: body.platformId ?? body.platform_id ?? null,
            status:     "OPEN",
            leadId,
            companyId:  ctx!.companyId,
        },
        select: {
            id: true, channel: true, platformId: true,
            status: true, leadId: true, createdAt: true,
        },
    });

    return apiResponse.created(conversation, rl);
}
