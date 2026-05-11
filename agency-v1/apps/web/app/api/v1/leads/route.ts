/**
 * GET  /api/v1/leads        — List leads (scope: leads:read)
 * POST /api/v1/leads        — Create a lead (scope: leads:write)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-v1/auth";
import { checkRateLimit } from "@/lib/api-v1/rate-limit";
import { apiResponse } from "@/lib/api-v1/response";
import { API_SCOPES } from "@/lib/api-v1/types";
import { detectLeadSource, calculateLeadScore } from "@/lib/lead-source-detector";

export const dynamic = "force-dynamic";

export async function OPTIONS() { return apiResponse.options(); }

// ── GET /api/v1/leads ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.LEADS_READ);
    if (error) return error;

    const rl: Record<string, string> = {};
    const rlError = checkRateLimit(ctx!, rl);
    if (rlError) return rlError;

    const { searchParams } = req.nextUrl;
    const page    = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit   = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const skip    = (page - 1) * limit;
    const status  = searchParams.get("status")  ?? undefined;
    const source  = searchParams.get("source")  ?? undefined;
    const search  = searchParams.get("search")  ?? undefined;
    const sortBy  = searchParams.get("sort")    ?? "createdAt";
    const sortDir = (searchParams.get("dir") === "asc" ? "asc" : "desc") as "asc" | "desc";

    const where = {
        companyId: ctx!.companyId,
        ...(status && { status }),
        ...(source && { source }),
        ...(search && {
            OR: [
                { name:  { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
                { phone: { contains: search, mode: "insensitive" as const } },
            ],
        }),
    };

    const [total, leads] = await Promise.all([
        prisma.lead.count({ where }),
        prisma.lead.findMany({
            where,
            select: {
                id: true, name: true, email: true, phone: true,
                company: true, jobTitle: true, source: true, medium: true,
                status: true, score: true, tags: true,
                utmSource: true, utmMedium: true, utmCampaign: true,
                conversionProbability: true,
                createdAt: true, updatedAt: true,
                campaign: { select: { id: true, name: true, code: true, platform: true } },
            },
            orderBy: { [sortBy]: sortDir },
            skip,
            take: limit,
        }),
    ]);

    return apiResponse.ok(leads, { page, limit, total, hasMore: skip + limit < total }, rl);
}

// ── POST /api/v1/leads ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.LEADS_WRITE);
    if (error) return error;

    const rl: Record<string, string> = {};
    const rlError = checkRateLimit(ctx!, rl);
    if (rlError) return rlError;

    let body: Record<string, any>;
    try { body = await req.json(); }
    catch { return apiResponse.badRequest("Invalid JSON body"); }

    if (!body.email) return apiResponse.badRequest("email is required");

    // Auto-detect source from UTM params
    const sourceResult = detectLeadSource(
        {
            utm_source:   body.utm_source   ?? body.utmSource,
            utm_medium:   body.utm_medium   ?? body.utmMedium,
            utm_campaign: body.utm_campaign ?? body.utmCampaign,
            utm_term:     body.utm_term     ?? body.utmTerm,
            utm_content:  body.utm_content  ?? body.utmContent,
        },
        req.headers.get("referer") ?? body.referer
    );

    // Check for existing lead by email
    const existing = await prisma.lead.findFirst({
        where: { email: body.email, companyId: ctx!.companyId },
    });
    if (existing) return apiResponse.conflict(`A lead with email "${body.email}" already exists (id: ${existing.id})`);

    const score = calculateLeadScore({
        email:    body.email,
        name:     body.name,
        phone:    body.phone,
        company:  body.company,
        jobTitle: body.jobTitle,
        source:   sourceResult.source,
    });

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const userAgent = req.headers.get("user-agent") ?? undefined;

    const lead = await prisma.lead.create({
        data: {
            email:       body.email,
            name:        body.name,
            phone:       body.phone,
            company:     body.company,
            jobTitle:    body.jobTitle,
            message:     body.message,
            source:      sourceResult.source,
            medium:      sourceResult.medium,
            utmSource:   sourceResult.utmSource   ?? body.utm_source,
            utmMedium:   sourceResult.utmMedium   ?? body.utm_medium,
            utmCampaign: sourceResult.utmCampaign ?? body.utm_campaign,
            utmTerm:     sourceResult.utmTerm     ?? body.utm_term,
            utmContent:  sourceResult.utmContent  ?? body.utm_content,
            referer:     body.referer,
            landingPage: body.landingPage ?? body.landing_page,
            tags:        body.tags ?? [],
            score,
            fbclid:      body.fbclid,
            gclid:       body.gclid,
            ttclid:      body.ttclid,
            li_fat_id:   body.li_fat_id,
            fbp:         body.fbp,
            fbc:         body.fbc,
            ipAddress,
            userAgent,
            companyId:   ctx!.companyId,
        },
        select: {
            id: true, name: true, email: true, phone: true,
            company: true, source: true, status: true, score: true,
            utmSource: true, utmCampaign: true, tags: true, createdAt: true,
        },
    });

    return apiResponse.created(lead, rl);
}
