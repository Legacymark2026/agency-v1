/**
 * GET  /api/v1/contacts  — List CRM contacts (scope: contacts:read)
 * POST /api/v1/contacts  — Create contact    (scope: contacts:write)
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
    const { ctx, error } = await validateApiKey(req, API_SCOPES.CONTACTS_READ);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { searchParams } = req.nextUrl;
    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const skip   = (page - 1) * limit;
    const search = searchParams.get("search") ?? undefined;

    // CRM Contacts = Deals with unique contactEmail
    const where = {
        companyId: ctx!.companyId,
        ...(search && {
            OR: [
                { contactName:  { contains: search, mode: "insensitive" as const } },
                { contactEmail: { contains: search, mode: "insensitive" as const } },
            ],
        }),
    };

    const [total, deals] = await Promise.all([
        prisma.deal.count({ where }),
        prisma.deal.findMany({
            where,
            select: {
                id: true, contactName: true, contactEmail: true,
                contactPhone: true, source: true, stage: true,
                value: true, priority: true, createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            skip, take: limit,
        }),
    ]);

    // Map to a clean "contact" shape
    const contacts = deals.map(d => ({
        id:    d.id,
        name:  d.contactName,
        email: d.contactEmail,
        phone: d.contactPhone ?? null,
        source: d.source,
        stage:  d.stage,
        dealValue: d.value,
        priority:  d.priority,
        createdAt: d.createdAt,
    }));

    return apiResponse.ok(contacts, { page, limit, total, hasMore: skip + limit < total }, rl);
}

export async function POST(req: NextRequest) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.CONTACTS_WRITE);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    let body: Record<string, any>;
    try { body = await req.json(); }
    catch { return apiResponse.badRequest("Invalid JSON body"); }

    if (!body.email) return apiResponse.badRequest("email is required");
    if (!body.name)  return apiResponse.badRequest("name is required");

    const contact = await prisma.deal.create({
        data: {
            title:        `Contact - ${body.name}`,
            contactName:  body.name,
            contactEmail: body.email,
            contactPhone: body.phone,
            source:       body.source ?? "API",
            stage:        body.stage  ?? "NEW",
            value:        body.dealValue ?? 0,
            priority:     body.priority ?? "MEDIUM",
            companyId:    ctx!.companyId,
        },
        select: {
            id: true, contactName: true, contactEmail: true,
            contactPhone: true, source: true, stage: true,
            value: true, priority: true, createdAt: true,
        },
    });

    return apiResponse.created({
        id: contact.id, name: contact.contactName,
        email: contact.contactEmail, phone: contact.contactPhone,
        source: contact.source, stage: contact.stage,
        dealValue: contact.value, priority: contact.priority,
        createdAt: contact.createdAt,
    }, rl);
}
