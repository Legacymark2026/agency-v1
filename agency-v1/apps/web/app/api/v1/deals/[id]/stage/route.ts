/**
 * PATCH /api/v1/deals/[id]/stage — Move deal to a new stage (scope: deals:write)
 *
 * Valid stages: NEW | CONTACTED | QUALIFIED | PROPOSAL | NEGOTIATION | WON | LOST
 * Moving a deal automatically triggers S2S conversion events for ad platforms.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-v1/auth";
import { checkRateLimit } from "@/lib/api-v1/rate-limit";
import { apiResponse } from "@/lib/api-v1/response";
import { API_SCOPES } from "@/lib/api-v1/types";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return apiResponse.options(); }

const VALID_STAGES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;
type Stage = typeof VALID_STAGES[number];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { ctx, error } = await validateApiKey(req, API_SCOPES.DEALS_WRITE);
    if (error) return error;
    const rl: Record<string, string> = {};
    if (checkRateLimit(ctx!, rl)) return checkRateLimit(ctx!, rl)!;

    const { id } = await params;
    const deal = await prisma.deal.findFirst({ where: { id, companyId: ctx!.companyId } });
    if (!deal) return apiResponse.notFound("Deal");

    let body: { stage?: string; reason?: string };
    try { body = await req.json(); }
    catch { return apiResponse.badRequest("Invalid JSON body"); }

    if (!body.stage) return apiResponse.badRequest("stage is required");

    const newStage = (body.stage as string).toUpperCase();
    if (!VALID_STAGES.includes(newStage as Stage)) {
        return apiResponse.badRequest(`Invalid stage "${body.stage}". Valid values: ${VALID_STAGES.join(", ")}`);
    }

    const previousStage = deal.stage;
    const updated = await prisma.deal.update({
        where: { id },
        data: {
            stage: newStage,
            ...(newStage === "WON" && { closingDate: deal.closingDate ?? new Date() }),
        },
        select: {
            id: true, title: true, stage: true, value: true,
            contactEmail: true, contactName: true, updatedAt: true,
        },
    });

    return apiResponse.ok({
        ...updated,
        previousStage,
        movedAt: updated.updatedAt,
    }, undefined, rl);
}
