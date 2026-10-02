/**
 * DIAN Express API Routes
 */
import { Router, Request, Response } from "express";
import { IDianComplianceUseCases, IDianRepositoryPort } from "../core/ports/dian.ports";
import { z } from "zod";
import { validateRequest } from "../middlewares/validateRequest";

const emitInvoiceSchema = z.object({
  companyId: z.string(),
  prefix: z.string(),
  emitterNit: z.string(),
  emitterName: z.string(),
  receiverNit: z.string(),
  receiverName: z.string(),
  subtotal: z.number().positive(),
  vatAmount: z.number().min(0),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    subtotal: z.number().positive()
  })).min(1)
});

const resolutionSchema = z.object({
  companyId: z.string(),
  prefix: z.string(),
  resolutionNumber: z.string(),
  dateFrom: z.string().or(z.date()),
  dateTo: z.string().or(z.date()),
  startRange: z.number(),
  endRange: z.number(),
  currentNumber: z.number(),
  technicalKey: z.string().optional()
});


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

  router.post("/emit-invoice", validateRequest(emitInvoiceSchema), async (req: Request, res: Response) => {
    try {
      const doc = await useCases.emitElectronicInvoice(req.body);
      res.status(201).json({ success: true, data: doc });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post("/emit-pos", validateRequest(emitInvoiceSchema), async (req: Request, res: Response) => {
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

  router.post("/resolutions", validateRequest(resolutionSchema), async (req: Request, res: Response) => {
    try {
      const resolution = await repo.createResolution(req.body);
      res.status(201).json({ success: true, data: resolution });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  return router;
}

