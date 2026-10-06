/**
 * Supplier Express HTTP Endpoints (Hexagonal Driving Adapter)
 */
import { Router, Request, Response } from "express";
import { ISupplierUseCases } from "../core/ports/supplier.ports";
import { validateRequest } from "@agency/service-auth";
import {
  createSupplierSchema,
  updateSupplierSchema,
  updateSupplierStatusSchema,
  attachDocumentSchema,
  verifyDocumentSchema,
} from "./supplier.schemas";

export function createSupplierRouter(useCases: ISupplierUseCases): Router {
  const router = Router();

  const getCompanyId = (req: Request): string => {
    return (req as any).user?.companyId || (req.headers["x-company-id"] as string) || (req.query.companyId as string) || "default";
  };

  // ── List & Search Suppliers ───────────────────────────────────────────────
  router.get("/", async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const category = req.query.category as any;
      const status = req.query.status as any;
      const search = req.query.search as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await useCases.querySuppliers({
        companyId,
        category,
        status,
        search,
        limit,
        offset,
      });

      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Check Expiring Documents / Audits ─────────────────────────────────────
  router.get("/expiring-documents", async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const expiring = await useCases.checkExpiringCertifications(companyId, days);
      res.json({ success: true, data: expiring });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Get Supplier Details with Compliance Status ───────────────────────────
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const supplierId = String(req.params.id);
      const result = await useCases.getSupplierDetails(supplierId, companyId);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });

  // ── Register New Supplier ─────────────────────────────────────────────────
  router.post("/", validateRequest(createSupplierSchema), async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const created = await useCases.registerSupplier({
        ...req.body,
        companyId,
      });
      res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ── Update Supplier Information ───────────────────────────────────────────
  router.patch("/:id", validateRequest(updateSupplierSchema), async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const supplierId = String(req.params.id);
      const updated = await useCases.updateSupplierInformation({
        id: supplierId,
        companyId,
        ...req.body,
      });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ── Update Supplier Status ────────────────────────────────────────────────
  router.patch("/:id/status", validateRequest(updateSupplierStatusSchema), async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const supplierId = String(req.params.id);
      const updated = await useCases.changeSupplierStatus({
        id: supplierId,
        companyId,
        status: req.body.status,
        reason: req.body.reason,
      });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ── Attach Certification Document ─────────────────────────────────────────
  router.post("/:id/documents", validateRequest(attachDocumentSchema), async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const supplierId = String(req.params.id);
      const doc = await useCases.attachCertificationDocument({
        supplierId,
        companyId,
        documentType: req.body.documentType,
        title: req.body.title,
        fileUrl: req.body.fileUrl,
        fileKey: req.body.fileKey,
        fileSize: req.body.fileSize,
        mimeType: req.body.mimeType,
        issueDate: req.body.issueDate ? new Date(req.body.issueDate) : undefined,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
        notes: req.body.notes,
      });
      res.status(201).json({ success: true, data: doc });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ── Verify Certification Document ─────────────────────────────────────────
  router.patch("/:id/documents/:docId/verify", validateRequest(verifyDocumentSchema), async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const docId = String(req.params.docId);
      const user = (req as any).user?.email || "auditor@legacymarksas.com";
      const doc = await useCases.verifyDocument({
        documentId: docId,
        companyId,
        verifiedBy: user,
        isVerified: req.body.isVerified,
        notes: req.body.notes,
      });
      res.json({ success: true, data: doc });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  return router;
}
