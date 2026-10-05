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
