/**
 * GET  /api/v1/deals  — List pipeline deals (scope: deals:read)
 * POST /api/v1/deals  — Create a deal       (scope: deals:write)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-v1/auth";
import { checkRateLimit } from "@/lib/api-v1/rate-limit";
import { apiResponse } from "@/lib/api-v1/response";
import { API_SCOPES } from "@/lib/api-v1/types";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return apiResponse.options(); }

const DEAL_SELECT = {
    id: true, title: true, value: true, stage: true, priority: true,
    contactName: true, contactEmail: true, contactPhone: true,
    source: true, notes: true, closingDate: true, probability: true,
    assignedToId: true, createdAt: true, updatedAt: true,
    assignedTo: { select: { firstName: true, lastName: true, email: true } },
} as const;

// ── GET /api/v1/deals ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.DEALS_READ);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { searchParams } = req.nextUrl;
    const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit    = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const skip     = (page - 1) * limit;
    const stage    = searchParams.get("stage")    ?? undefined;
    const priority = searchParams.get("priority") ?? undefined;
    const search   = searchParams.get("search")   ?? undefined;

    const where = {
        companyId: ctx!.companyId,
        ...(stage    && { stage }),
        ...(priority && { priority }),
        ...(search   && {
            OR: [
                { title:        { contains: search, mode: "insensitive" as const } },
                { contactName:  { contains: search, mode: "insensitive" as const } },
                { contactEmail: { contains: search, mode: "insensitive" as const } },
            ],
        }),
    };

    const [total, deals] = await Promise.all([
        prisma.deal.count({ where }),
        prisma.deal.findMany({ where, select: DEAL_SELECT, orderBy: { createdAt: "desc" }, skip, take: limit }),
    ]);

    return apiResponse.ok(deals, { page, limit, total, hasMore: skip + limit < total }, rl);
}

// ── POST /api/v1/deals ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.DEALS_WRITE);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    let body: Record<string, any>;
    try { body = await req.json(); }
    catch { return apiResponse.badRequest("Invalid JSON body"); }

    if (!body.title) return apiResponse.badRequest("title is required");

    const deal = await prisma.deal.create({
        data: {
            title:        body.title,
            value:        body.value      ?? 0,
            stage:        body.stage      ?? "NEW",
            priority:     body.priority   ?? "MEDIUM",
            contactName:  body.contactName  ?? body.contact_name,
            contactEmail: body.contactEmail ?? body.contact_email,
            contactPhone: body.contactPhone ?? body.contact_phone,
            source:       body.source     ?? "API",
            notes:        body.notes,
            closingDate:  body.closingDate  ? new Date(body.closingDate)  : undefined,
            probability:  body.probability,
            companyId:    ctx!.companyId,
        },
        select: DEAL_SELECT,
    });

    return apiResponse.created(deal, rl);
}
