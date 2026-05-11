/**
 * GET    /api/v1/contacts/[id]  — Get contact  (scope: contacts:read)
 * PUT    /api/v1/contacts/[id]  — Update       (scope: contacts:write)
 * DELETE /api/v1/contacts/[id]  — Delete       (scope: contacts:write)
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
    const { ctx, error } = await validateApiKey(req, API_SCOPES.CONTACTS_READ);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { id } = await params;
    const deal = await prisma.deal.findFirst({
        where: { id, companyId: ctx!.companyId },
        select: {
            id: true, contactName: true, contactEmail: true,
            contactPhone: true, source: true, stage: true,
            value: true, priority: true, notes: true, createdAt: true, updatedAt: true,
        },
    });
    if (!deal) return apiResponse.notFound("Contact");

    return apiResponse.ok({
        id: deal.id, name: deal.contactName, email: deal.contactEmail,
        phone: deal.contactPhone, source: deal.source, stage: deal.stage,
        dealValue: deal.value, priority: deal.priority, notes: deal.notes,
        createdAt: deal.createdAt, updatedAt: deal.updatedAt,
    }, undefined, rl);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.CONTACTS_WRITE);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { id } = await params;
    const existing = await prisma.deal.findFirst({ where: { id, companyId: ctx!.companyId } });
    if (!existing) return apiResponse.notFound("Contact");

    let body: Record<string, any>;
    try { body = await req.json(); }
    catch { return apiResponse.badRequest("Invalid JSON body"); }

    const updated = await prisma.deal.update({
        where: { id },
        data: {
            ...(body.name     !== undefined && { contactName:  body.name }),
            ...(body.email    !== undefined && { contactEmail: body.email }),
            ...(body.phone    !== undefined && { contactPhone: body.phone }),
            ...(body.notes    !== undefined && { notes:        body.notes }),
            ...(body.priority !== undefined && { priority:     body.priority }),
        },
    });

    return apiResponse.ok({ id: updated.id, name: updated.contactName,
        email: updated.contactEmail, updatedAt: updated.updatedAt }, undefined, rl);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.CONTACTS_WRITE);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { id } = await params;
    const existing = await prisma.deal.findFirst({ where: { id, companyId: ctx!.companyId } });
    if (!existing) return apiResponse.notFound("Contact");

    await prisma.deal.delete({ where: { id } });
    return apiResponse.noContent();
}
