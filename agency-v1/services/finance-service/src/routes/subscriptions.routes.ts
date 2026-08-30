/**
 * Subscriptions Router
 * Fix A-6: replaces fragile notes LIKE "[SUBSCRIPTION]" pattern with structured metadata.
 *          Subscriptions are still stored as Invoice rows (no schema migration needed),
 *          but now use a dedicated compound field: subscriptionId = UUID stored in the
 *          invoiceNumber prefix "SUB-" for easy filtering with a proper index.
 *          Schema migration recommended: add `isSubscription Boolean @default(false)`
 *          and `subscriptionInterval String?` columns to Invoice table.
 * Fix C-2: all routes protected by requireUserOrServiceAuth
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { logger } from "../utils/logger.utils";

// ── Subscription marker (prefix instead of notes LIKE) ───────────────────────
const SUB_PREFIX = "SUB-";
const SUB_TAG = "[SUBSCRIPTION]";

function buildSubscriptionWhere(companyId: string) {
  return {
    companyId,
    invoiceNumber: { startsWith: SUB_PREFIX },
  };
}

const createSubscriptionSchema = z.object({
  companyId: z.string().optional(),
  planName: z.string().min(1, "planName required"),
  amount: z.number().positive("amount required"),
  currency: z.string().default("USD"),
  clientName: z.string().default("Subscriber"),
  clientNit: z.string().optional(),
  interval: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]).default("MONTHLY"),
});

export const subscriptionsRouter = Router();

subscriptionsRouter.use(requireUserOrServiceAuth);

// ── GET /subscriptions ─────────────────────────────────────────────────────────
subscriptionsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId =
      (req.headers["x-company-id"] as string | undefined) ||
      (req.query.companyId ? String(req.query.companyId) : undefined);

    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const subscriptions = await prisma.invoice.findMany({
      where: buildSubscriptionWhere(companyId),
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    res.json({ success: true, subscriptions });
  } catch (err) {
    logger.error("[subscriptions] GET / failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── POST /subscriptions ────────────────────────────────────────────────────────
subscriptionsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const companyId =
      (req.headers["x-company-id"] as string | undefined) || req.body.companyId;
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createSubscriptionSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { planName, amount, currency, clientName, clientNit, interval } = parsed.data;
    const subId = `${SUB_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const nextDueDate = new Date();
    if (interval === "YEARLY") nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
    else if (interval === "QUARTERLY") nextDueDate.setMonth(nextDueDate.getMonth() + 3);
    else nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        invoiceNumber: subId,
        clientName,
        clientNit: clientNit || null,
        subtotalAmount: amount,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: amount,
        advanceAmount: 0,
        finalAmount: amount,
        currency,
        dueDate: nextDueDate,
        notes: `${SUB_TAG} Plan: ${planName} | Interval: ${interval}`,
        status: "DRAFT_AWAITING_PAYMENT",
        isElectronic: false,
        items: {
          create: [{
            title: `Plan ${planName} (${interval})`,
            description: `Renovación periódica ${interval}`,
            quantity: 1,
            unitPrice: amount,
            taxRate: 0,
            totalAmount: amount,
          }],
        },
      },
      include: { items: true },
    });

    res.status(201).json({ success: true, subscription: invoice });
  } catch (err) {
    logger.error("[subscriptions] POST / failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── POST /subscriptions/:id/cancel ────────────────────────────────────────────
subscriptionsRouter.post("/:id/cancel", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: "Subscription not found" });
    if (!existing.invoiceNumber?.startsWith(SUB_PREFIX)) {
      return res.status(400).json({ success: false, error: "This invoice is not a subscription" });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    res.json({ success: true, subscription: invoice });
  } catch (err) {
    logger.error("[subscriptions] POST /:id/cancel failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});
