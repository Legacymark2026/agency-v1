/**
 * GET  /api/v1/campaigns  — List campaigns  (scope: campaigns:read)
 * POST /api/v1/campaigns  — Create campaign (scope: campaigns:write)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-v1/auth";
import { checkRateLimit } from "@/lib/api-v1/rate-limit";
import { apiResponse } from "@/lib/api-v1/response";
import { API_SCOPES } from "@/lib/api-v1/types";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return apiResponse.options(); }

const CAMPAIGN_SELECT = {
    id: true, name: true, code: true, platform: true, status: true,
    description: true, budget: true, startDate: true, endDate: true,
    impressions: true, clicks: true, conversions: true, spend: true,
    createdAt: true, updatedAt: true,
    _count: { select: { leads: true } },
} as const;

export async function GET(req: NextRequest) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.CAMPAIGNS_READ);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { searchParams } = req.nextUrl;
    const page     = Math.max(1, parseInt(searchParams.get("page")   ?? "1"));
    const limit    = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const skip     = (page - 1) * limit;
    const status   = searchParams.get("status")   ?? undefined;
    const platform = searchParams.get("platform") ?? undefined;

    const where = {
        companyId: ctx!.companyId,
        ...(status   && { status }),
        ...(platform && { platform }),
    };

    const [total, campaigns] = await Promise.all([
        prisma.campaign.count({ where }),
        prisma.campaign.findMany({
            where, select: CAMPAIGN_SELECT,
            orderBy: { createdAt: "desc" }, skip, take: limit,
        }),
    ]);

    const data = campaigns.map(c => ({
        ...c,
        leadCount: c._count.leads,
        _count: undefined,
    }));

    return apiResponse.ok(data, { page, limit, total, hasMore: skip + limit < total }, rl);
}

export async function POST(req: NextRequest) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.CAMPAIGNS_WRITE);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    let body: Record<string, any>;
    try { body = await req.json(); }
    catch { return apiResponse.badRequest("Invalid JSON body"); }

    if (!body.name)     return apiResponse.badRequest("name is required");
    if (!body.code)     return apiResponse.badRequest("code is required (unique campaign tracking code)");
    if (!body.platform) return apiResponse.badRequest("platform is required (e.g. META, GOOGLE, TIKTOK)");

    // Ensure code uniqueness within company
    const existing = await prisma.campaign.findFirst({
        where: { code: body.code.toUpperCase(), companyId: ctx!.companyId },
    });
    if (existing) return apiResponse.conflict(`Campaign with code "${body.code}" already exists (id: ${existing.id})`);

    const campaign = await prisma.campaign.create({
        data: {
            name:        body.name,
            code:        body.code.toUpperCase(),
            platform:    body.platform.toUpperCase(),
            description: body.description,
            budget:      body.budget,
            startDate:   body.startDate  ? new Date(body.startDate)  : undefined,
            endDate:     body.endDate    ? new Date(body.endDate)    : undefined,
            companyId:   ctx!.companyId,
        },
        select: CAMPAIGN_SELECT,
    });

    return apiResponse.created({
        ...campaign,
        leadCount: campaign._count.leads,
        _count: undefined,
    }, rl);
}
