/**
 * GET    /api/v1/deals/[id]        — Get deal    (scope: deals:read)
 * PUT    /api/v1/deals/[id]        — Update deal (scope: deals:write)
 * DELETE /api/v1/deals/[id]        — Delete deal (scope: deals:write)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-v1/auth";
import { checkRateLimit } from "@/lib/api-v1/rate-limit";
import { apiResponse } from "@/lib/api-v1/response";
import { API_SCOPES } from "@/lib/api-v1/types";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return apiResponse.options(); }

const SELECT = {
    id: true, title: true, value: true, stage: true, priority: true,
    contactName: true, contactEmail: true, source: true,
    notes: true, expectedClose: true, probability: true,
    assignedTo: true, createdAt: true, updatedAt: true,
    assignedUser: { select: { firstName: true, lastName: true, email: true } },
} as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.DEALS_READ);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { id } = await params;
    const deal = await prisma.deal.findFirst({ where: { id, companyId: ctx!.companyId }, select: SELECT });
    if (!deal) return apiResponse.notFound("Deal");

    return apiResponse.ok(deal, undefined, rl);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.DEALS_WRITE);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { id } = await params;
    if (!await prisma.deal.findFirst({ where: { id, companyId: ctx!.companyId } })) {
        return apiResponse.notFound("Deal");
    }

    let body: Record<string, any>;
    try { body = await req.json(); }
    catch { return apiResponse.badRequest("Invalid JSON body"); }

    const deal = await prisma.deal.update({
        where: { id },
        data: {
            ...(body.title        !== undefined && { title:        body.title }),
            ...(body.value        !== undefined && { value:        body.value }),
            ...(body.stage        !== undefined && { stage:        body.stage }),
            ...(body.priority     !== undefined && { priority:     body.priority }),
            ...(body.notes        !== undefined && { notes:        body.notes }),
            ...(body.probability  !== undefined && { probability:  body.probability }),
            ...(body.closingDate  !== undefined && { expectedClose:  new Date(body.closingDate) }),
            ...(body.contactName  !== undefined && { contactName:  body.contactName }),
            ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
        },
        select: SELECT,
    });

    return apiResponse.ok(deal, undefined, rl);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.DEALS_WRITE);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { id } = await params;
    if (!await prisma.deal.findFirst({ where: { id, companyId: ctx!.companyId } })) {
        return apiResponse.notFound("Deal");
    }

    await prisma.deal.delete({ where: { id } });
    return apiResponse.noContent();
}
