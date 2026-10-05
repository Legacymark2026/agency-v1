import { Router, Request, Response } from "express";
import { z } from "zod";
import { SubscriptionUseCases } from "../core/usecases/subscription.usecases";

const claimTrialSchema = z.object({
  companyId: z.string().min(1, "companyId is required"),
  deviceHash: z.string().min(16, "deviceHash must be valid"),
  durationDays: z.number().int().positive().optional(),
});

export function createSubscriptionRouter(useCases: SubscriptionUseCases): Router {
  const router = Router();

  // ── GET /eligibility/:companyId ─────────────────────────────────────────────
  router.get("/eligibility/:companyId", async (req: Request, res: Response) => {
    try {
      const companyId = String(req.params.companyId);
      const deviceHash =
        (req.headers["x-device-fingerprint"] as string) ||
        (req.query.deviceHash as string) ||
        (req as any).deviceFingerprint;

      if (!deviceHash) {
        res.status(400).json({ success: false, error: "Device fingerprint required" });
        return;
      }

      const result = await useCases.checkEligibility(companyId, deviceHash);
      res.json({
        success: true,
        eligible: result.eligible,
        reason: result.reason,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── POST /trial/claim ───────────────────────────────────────────────────────
  router.post("/trial/claim", async (req: Request, res: Response) => {
    try {
      const body = {
        ...req.body,
        deviceHash:
          req.body.deviceHash ||
          (req.headers["x-device-fingerprint"] as string) ||
          (req as any).deviceFingerprint,
      };

      const parsed = claimTrialSchema.parse(body);

      // ── REFUERZO 1: Rate Limiting por Hardware Device Hash ─────────────────
      const { DeviceRateLimiter } = await import("@agency/device-fingerprint");
      const rateCheck = DeviceRateLimiter.isRateLimited(parsed.deviceHash, 3, 86400);
      if (rateCheck.limited) {
        res.status(429).json({
          success: false,
          error: `RATE_LIMITED_BY_DEVICE: Maximum trial claim attempts exceeded for this hardware. Reset in ${rateCheck.resetInSec}s.`,
          resetInSec: rateCheck.resetInSec,
        });
        return;
      }

      // ── REFUERZO 2: Detección de Headless, Automatización y Emuladores ───────
      const botAnalysis = (req as any).botAnalysis;
      if (botAnalysis && botAnalysis.isBotOrHeadless) {
        res.status(403).json({
          success: false,
          error: "HEADLESS_OR_AUTOMATED_DEVICE_BLOCKED: Automated browsers and virtualized devices cannot claim promotional trials.",
          botRiskScore: botAnalysis.botRiskScore,
          reasons: botAnalysis.reasons,
        });
        return;
      }

      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip;

      const result = await useCases.claimFreeTrial({
        companyId: parsed.companyId,
        deviceHash: parsed.deviceHash,
        durationDays: parsed.durationDays,
        ipSubnet: ip,
        userAgent: req.headers["user-agent"],
      });

      if (!result.success) {
        res.status(403).json({
          success: false,
          error: result.error,
          code: "TRIAL_CLAIM_REJECTED",
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: "Free trial activated successfully",
        subscription: result.subscription,
        trialEndsAt: result.trialEndsAt,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: "Validation error", details: err.errors });
        return;
      }
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── REFUERZO 3: Webhook Ingestion Engine (Stripe & Bold Colombia) ────────────
  router.post("/webhooks/stripe", async (req: Request, res: Response) => {
    try {
      const event = req.body;
      const eventType = event.type;
      const dataObj = event.data?.object || {};

      console.log(`[subscription-service] Stripe Webhook received: ${eventType}`);

      if (eventType === "customer.subscription.deleted" || eventType === "customer.subscription.updated") {
        const stripeSubId = dataObj.id;
        const status = dataObj.status; // 'active', 'past_due', 'canceled', etc.

        // Sync with Prisma via company lookup or event bus
        const { prisma } = await import("@agency/database");
        const company = await prisma.company.findFirst({
          where: { stripeSubscriptionId: stripeSubId },
        });

        if (company) {
          await prisma.company.update({
            where: { id: company.id },
            data: { subscriptionStatus: status },
          });
          console.log(`[subscription-service] Company ${company.id} updated to ${status} via Stripe webhook`);
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[subscription-service] Stripe webhook error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/webhooks/bold", async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      console.log("[subscription-service] Bold Colombia webhook event:", payload.event || payload.action);
      // Process Bold payment notification and update company subscription status
      res.json({ received: true, provider: "Bold Colombia" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // ── GET /:companyId ─────────────────────────────────────────────────────────
  router.get("/:companyId", async (req: Request, res: Response) => {
    try {
      const companyId = String(req.params.companyId);
      const subscription = await useCases.getSubscriptionDetails(companyId);

      if (!subscription) {
        res.status(404).json({ success: false, error: "Subscription not found" });
        return;
      }

      res.json({
        success: true,
        subscription,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
