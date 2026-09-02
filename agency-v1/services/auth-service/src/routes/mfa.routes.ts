/**
 * MFA & Security Audit Router — Auth Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-2: Protected with requireUserOrServiceAuth.
 * Fix C-4: Zod validation on 2FA actions and backup code verifications.
 */
import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@agency/database";
import { SecurityService } from "../services/security.service";
import { validateRequest } from "../middlewares/auth.middleware";
import {
  enable2FASchema,
  verify2FASchema,
  disable2FASchema,
} from "../validators/auth.validators";

function getStr(val: any): string {
  if (!val) return "";
  if (Array.isArray(val)) return String(val[0] || "");
  return String(val);
}

export const mfaRouter = Router();

// ── 🔒 2FA Endpoints ──────────────────────────────────────────────────────────

mfaRouter.post("/2fa/generate", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getStr(req.body.userId || req.headers["x-user-id"]);
    const email = getStr(req.body.email);
    if (!userId) return res.status(400).json({ error: "userId required" });

    const result = await SecurityService.generate2FA(userId, email);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

mfaRouter.post("/2fa/enable", validateRequest(enable2FASchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getStr(req.body.userId || req.headers["x-user-id"]);
    const { secret, token } = req.body;
    const result = await SecurityService.enable2FA(userId, getStr(secret), getStr(token), req.ip, getStr(req.headers["user-agent"]));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

mfaRouter.post("/2fa/verify", validateRequest(verify2FASchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getStr(req.body.userId || req.headers["x-user-id"]);
    const { tokenOrBackupCode } = req.body;
    const result = await SecurityService.verify2FA(userId, getStr(tokenOrBackupCode), req.ip, getStr(req.headers["user-agent"]));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

mfaRouter.post("/2fa/disable", validateRequest(disable2FASchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getStr(req.body.userId || req.headers["x-user-id"]);
    const result = await SecurityService.disable2FA(userId, req.ip, getStr(req.headers["user-agent"]));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

mfaRouter.get("/audit-logs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getStr(req.query.userId || req.headers["x-user-id"]);
    const limit = parseInt(getStr(req.query.limit), 10) || 50;
    const result = await SecurityService.getAuditLogs(userId, limit);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

mfaRouter.post("/check-impossible-travel", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getStr(req.body.userId || req.headers["x-user-id"]);
    const { newIp, lat, lon } = req.body;
    const result = await SecurityService.checkImpossibleTravel(userId, getStr(newIp), lat, lon, req.ip, getStr(req.headers["user-agent"]));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ── Legacy MFA User Status Lookups ───────────────────────────────────────────

mfaRouter.get("/users/:id/mfa", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, twoFactorEnabled: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, mfaEnabled: !!user.twoFactorEnabled });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

mfaRouter.patch("/users/:id/mfa", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { enabled } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { twoFactorEnabled: !!enabled },
      select: { id: true, twoFactorEnabled: true },
    });
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});
