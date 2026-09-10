/**
 * Audit Security API Routes
 */
import { Router, Request, Response } from "express";
import { IAuditSecurityUseCases, IAuditRepositoryPort } from "../core/ports/audit.ports";

export function createAuditRouter(
  useCases: IAuditSecurityUseCases,
  repo: IAuditRepositoryPort
): Router {
  const router = Router();

  router.get("/logs", async (req: Request, res: Response) => {
    try {
      const companyId = (req.query.companyId as string) || "default";
      const records = await repo.listAuditRecords(companyId);
      res.json({ success: true, data: records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post("/logs", async (req: Request, res: Response) => {
    try {
      const record = await useCases.logEvent(req.body);
      res.status(201).json({ success: true, data: record });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.get("/verify-integrity", async (req: Request, res: Response) => {
    try {
      const companyId = (req.query.companyId as string) || "default";
      const verification = await useCases.verifyAuditIntegrity(companyId);
      res.json({ success: true, data: verification });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
