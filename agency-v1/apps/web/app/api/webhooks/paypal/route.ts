import { NextResponse } from "next/server";
import { capturePayPalOrder, getPayPalOrderDetails } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("paypal-transmission-sig");
  const timestamp = req.headers.get("paypal-transmission-time");
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) {
    logger.warn("[PayPal Webhook] Webhook ID not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  try {
    const event = JSON.parse(payload);
    logger.info("[PayPal Webhook] Received event", { eventType: event.event_type });

    switch (event.event_type) {
      case "CHECKOUT.ORDER.APPROVED": {
        const orderId = event.resource?.id;
        if (orderId) {
          logger.info("[PayPal] Order approved, awaiting capture", { orderId });
        }
        break;
      }

      case "PAYMENT.CAPTURE.COMPLETED": {
        const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
        const captureId = event.resource?.id;
        const amount = parseFloat(event.resource?.amount?.value || "0");
        const currency = event.resource?.amount?.currency_code || "USD";

        if (orderId && captureId) {
          const details = await getPayPalOrderDetails(orderId);
          const customId = details.purchase_units?.[0]?.custom_id;
          let metadata: Record<string, string> = {};

          try {
            metadata = customId ? JSON.parse(customId) : {};
          } catch {
            metadata = {};
          }

          const companyId = metadata.companyId || customId;

          if (companyId) {
            await prisma.company.update({
              where: { id: companyId },
              data: {
                subscriptionStatus: "active",
                subscriptionTier: metadata.tier || "pro",
              },
            });

            logger.info("[PayPal] Payment completed", {
              companyId,
              tier: metadata.tier,
              amount,
              currency,
            });
          }
        }
        break;
      }

      case "PAYMENT.CAPTURE.DENIED": {
        const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
        const customId = event.resource?.custom_id;

        if (customId || orderId) {
          logger.warn("[PayPal] Payment denied", { customId, orderId });
        }
        break;
      }

      case "CUSTOMER.DISPUTE.CREATED": {
        logger.warn("[PayPal] Dispute opened", {
          disputeId: event.resource?.dispute_id,
        });
        break;
      }

      default:
        logger.info("[PayPal] Unhandled event type", { eventType: event.event_type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("[PayPal Webhook] Error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "PayPal webhook endpoint active" });
}