import { Router, Request, Response, NextFunction } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/auth.middleware";
import { SecurityService } from "../services/security.service";
import { 
  loginSchema, 
  enable2FASchema, 
  verify2FASchema, 
  disable2FASchema 
} from "../validators/auth.validators";

function getStr(val: any): string {
  if (!val) return '';
  if (Array.isArray(val)) return String(val[0] || '');
  return String(val);
}

export function createAuthRouter(privateKey: string | null): Router {
  const router = Router();

  router.post("/login", validateRequest(loginSchema), (req: Request, res: Response, next: NextFunction) => {
    AuthController.login(req, res, next, privateKey);
  });

  router.post("/refresh", (req: Request, res: Response, next: NextFunction) => {
    AuthController.refresh(req, res, next);
  });

  router.post("/logout-all", (req: Request, res: Response, next: NextFunction) => {
    AuthController.logoutAll(req, res, next);
  });

  router.get("/sessions", (req: Request, res: Response, next: NextFunction) => {
    AuthController.getSessions(req, res, next);
  });

  router.get("/profile", (req: Request, res: Response, next: NextFunction) => {
    AuthController.getProfile(req, res, next);
  });

  // ── 🔒 2FA & Audit Logs Endpoints ──────────────────────────────────────────
  router.post("/2fa/generate", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, email } = req.body;
      const result = await SecurityService.generate2FA(getStr(userId), getStr(email));
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  });

  router.post("/2fa/enable", validateRequest(enable2FASchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, secret, token } = req.body;
      const result = await SecurityService.enable2FA(getStr(userId), getStr(secret), getStr(token), req.ip, getStr(req.headers['user-agent']));
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  });

  router.post("/2fa/verify", validateRequest(verify2FASchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, tokenOrBackupCode } = req.body;
      const result = await SecurityService.verify2FA(getStr(userId), getStr(tokenOrBackupCode), req.ip, getStr(req.headers['user-agent']));
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  });

  router.post("/2fa/disable", validateRequest(disable2FASchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.body;
      const result = await SecurityService.disable2FA(getStr(userId), req.ip, getStr(req.headers['user-agent']));
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  });

  router.get("/audit-logs", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getStr(req.query.userId || req.headers['x-user-id']);
      const limit = parseInt(getStr(req.query.limit)) || 50;
      const result = await SecurityService.getAuditLogs(userId, limit);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  });

  return router;
}
