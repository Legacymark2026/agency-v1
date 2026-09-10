/**
 * DIAN Express API Routes
 */
import { Router, Request, Response } from "express";
import { IDianComplianceUseCases, IDianRepositoryPort } from "../core/ports/dian.ports";

export function createDianRouter(
  useCases: IDianComplianceUseCases,
  repo: IDianRepositoryPort
): Router {
  const router = Router();

  // Document status & history
  router.get("/documents", async (req: Request, res: Response) => {
    try {
      const companyId = (req.query.companyId as string) || "default";
      const status = req.query.status as string | undefined;
      const docs = await repo.listDocuments(companyId, status);
      res.json({ success: true, data: docs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post("/emit-invoice", async (req: Request, res: Response) => {
    try {
      const doc = await useCases.emitElectronicInvoice(req.body);
      res.status(201).json({ success: true, data: doc });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post("/emit-pos", async (req: Request, res: Response) => {
    try {
      const doc = await useCases.emitPosEquivalent(req.body);
      res.status(201).json({ success: true, data: doc });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Resolutions
  router.get("/resolutions", async (req: Request, res: Response) => {
    try {
      const companyId = (req.query.companyId as string) || "default";
      const resolutions = await repo.listResolutions(companyId);
      res.json({ success: true, data: resolutions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post("/resolutions", async (req: Request, res: Response) => {
    try {
      const resolution = await repo.createResolution(req.body);
      res.status(201).json({ success: true, data: resolution });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  return router;
}
