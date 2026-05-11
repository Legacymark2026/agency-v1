/**
 * GET    /api/v1/leads/[id]  — Get lead by ID  (scope: leads:read)
 * PUT    /api/v1/leads/[id]  — Update lead     (scope: leads:write)
 * DELETE /api/v1/leads/[id]  — Delete lead     (scope: leads:delete)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-v1/auth";
import { checkRateLimit } from "@/lib/api-v1/rate-limit";
import { apiResponse } from "@/lib/api-v1/response";
import { API_SCOPES } from "@/lib/api-v1/types";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return apiResponse.options(); }

const LEAD_SELECT = {
    id: true, name: true, email: true, phone: true,
    company: true, jobTitle: true, source: true, medium: true, status: true,
    score: true, tags: true, message: true,
    utmSource: true, utmMedium: true, utmCampaign: true, utmTerm: true, utmContent: true,
    referer: true, landingPage: true,
    fbclid: true, gclid: true, ttclid: true, li_fat_id: true,
    conversionProbability: true, predictionFactors: true,
    convertedToDealId: true, convertedAt: true,
    createdAt: true, updatedAt: true,
    campaign: { select: { id: true, name: true, code: true, platform: true } },
} as const;

// ── GET ─────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.LEADS_READ);
    if (error) return error;

    const rl: Record<string, string> = {};
    const rlError = checkRateLimit(ctx!, rl);
    if (rlError) return rlError;

    const { id } = await params;
    const lead = await prisma.lead.findFirst({
        where: { id, companyId: ctx!.companyId },
        select: LEAD_SELECT,
    });
    if (!lead) return apiResponse.notFound("Lead");

    return apiResponse.ok(lead, undefined, rl);
}

// ── PUT ─────────────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.LEADS_WRITE);
    if (error) return error;

    const rl: Record<string, string> = {};
    const rlError = checkRateLimit(ctx!, rl);
    if (rlError) return rlError;

    const { id } = await params;
    const existing = await prisma.lead.findFirst({ where: { id, companyId: ctx!.companyId } });
    if (!existing) return apiResponse.notFound("Lead");

    let body: Record<string, any>;
    try { body = await req.json(); }
    catch { return apiResponse.badRequest("Invalid JSON body"); }

    // Allowlist only safe fields to update
    const UPDATABLE_FIELDS = ["name", "phone", "company", "jobTitle", "message",
        "status", "tags", "score", "landingPage", "referer"];

    const data: Record<string, any> = {};
    for (const field of UPDATABLE_FIELDS) {
        if (body[field] !== undefined) data[field] = body[field];
    }

    if (Object.keys(data).length === 0) {
        return apiResponse.badRequest("No updatable fields provided. Allowed: " + UPDATABLE_FIELDS.join(", "));
    }

    const updated = await prisma.lead.update({
        where: { id },
        data,
        select: LEAD_SELECT,
    });

    return apiResponse.ok(updated, undefined, rl);
}

// ── DELETE ──────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.LEADS_DELETE);
    if (error) return error;

    const rl: Record<string, string> = {};
    const rlError = checkRateLimit(ctx!, rl);
    if (rlError) return rlError;

    const { id } = await params;
    const existing = await prisma.lead.findFirst({ where: { id, companyId: ctx!.companyId } });
    if (!existing) return apiResponse.notFound("Lead");

    await prisma.lead.delete({ where: { id } });
    return apiResponse.noContent();
}
