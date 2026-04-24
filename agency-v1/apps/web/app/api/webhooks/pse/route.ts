import { NextResponse } from "next/server";
import { getPSETransactionStatus } from "@/lib/pse";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

function validatePSESignature(body: string, signature: string | null): boolean {
  const expectedSignature = process.env.PSE_WEBHOOK_SECRET;
  if (!expectedSignature) {
    logger.warn("[PSE Webhook] No webhook secret configured");
    return true;
  }
  
  if (!signature || signature !== expectedSignature) {
    return false;
  }
  return true;
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-pse-signature");
    const body = await req.text();

    if (!validatePSESignature(body, signature)) {
      logger.warn("[PSE Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = await req.json();
    const provider = process.env.PSE_PROVIDER || "bamboo";

    logger.info("[PSE Webhook] Received", { provider, payload });

    const transactionId = payload.metadataOut?.transactionId || payload.transactionId;
    const interactionId = payload.metadataOut?.interactionId || payload.merchantInteractionId;

    if (!transactionId && !interactionId) {
      logger.warn("[PSE Webhook] No transaction ID found");
      return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 });
    }

    let statusCode = payload.statusCode || payload.status?.code;
    let companyId: string | null = null;

    if (interactionId?.includes("-")) {
      companyId = interactionId.split("-")[0];
    }

    if (!companyId) {
      const invoice = await prisma.invoice.findFirst({
        where: { 
          OR: [
            { token: interactionId },
            { id: { contains: interactionId } }
          ]
        },
        select: { companyId: true }
      });
      companyId = invoice?.companyId || null;
    }

    if (provider === "bamboo" && transactionId && !statusCode) {
      const status = await getPSETransactionStatus(transactionId);
      statusCode = status.statusCode;
    }

    const statusInt = parseInt(statusCode || "0", 10);
    const isApproved = statusInt >= 4;

    if (isApproved && companyId) {
      await prisma.company.update({
        where: { id: companyId },
        data: {
          subscriptionStatus: "active",
          subscriptionTier: "pro",
        },
      });

      logger.info("[PSE] Payment approved", { companyId, transactionId, statusCode });
    } else if (!isApproved && companyId) {
      await prisma.company.update({
        where: { id: companyId },
        data: {
          subscriptionStatus: "past_due",
        },
      });

      logger.warn("[PSE] Payment pending/failed", { companyId, transactionId, statusCode });
    }

    return NextResponse.json({ received: true, status: isApproved ? "approved" : "pending" });
  } catch (error) {
    logger.error("[PSE Webhook] Error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "PSE webhook endpoint active" });
}