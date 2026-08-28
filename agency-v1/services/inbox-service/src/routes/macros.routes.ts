/**
 * Macros Router
 * Handles /api/inbox/macros/* routes
 */
import { Router, Request, Response } from "express";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { logger } from "../lib/inbox/logger";

// Whitelist of fields allowed when creating a macro
const MACRO_ALLOWED_UPDATE_FIELDS = [
  "title",
  "description",
  "icon",
  "color",
  "actionType",
  "payload",
  "isActive",
] as const;

export function createMacrosRouter(): Router {
  const router = Router();

  router.use(requireUserOrServiceAuth);

  // ── GET /macros ─────────────────────────────────────────────────────────────
  router.get("/macros", async (req: Request, res: Response) => {
    try {
      const companyId =
        (req.headers["x-company-id"] as string | undefined) ||
        (req.query.companyId ? String(req.query.companyId) : undefined);

      if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

      const macros = await prisma.inboxMacro.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
      });
      res.json({ success: true, data: macros });
    } catch (err) {
      logger.error("[macros] GET /macros failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── POST /macros ────────────────────────────────────────────────────────────
  router.post("/macros", async (req: Request, res: Response) => {
    try {
      const { companyId, title, description, icon, color, actionType, payload, isActive } = req.body;
      if (!companyId || !title || !actionType) {
        return res.status(400).json({ success: false, error: "companyId, title, and actionType required" });
      }
      const macro = await prisma.inboxMacro.create({
        data: {
          companyId,
          title,
          description,
          icon: icon || "Wand2",
          color: color || "#10b981",
          actionType,
          payload: payload || {},
          isActive: isActive ?? true,
        },
      });
      res.status(201).json({ success: true, data: macro });
    } catch (err) {
      logger.error("[macros] POST /macros failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── PATCH /macros/:id ───────────────────────────────────────────────────────
  router.patch("/macros/:id", async (req: Request, res: Response) => {
    try {
      const updateData: Record<string, unknown> = {};
      for (const field of MACRO_ALLOWED_UPDATE_FIELDS) {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
      }

      const macro = await prisma.inboxMacro.update({
        where: { id: req.params.id },
        data: updateData,
      });
      res.json({ success: true, data: macro });
    } catch (err) {
      logger.error("[macros] PATCH /macros/:id failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── DELETE /macros/:id ──────────────────────────────────────────────────────
  router.delete("/macros/:id", async (req: Request, res: Response) => {
    try {
      await prisma.inboxMacro.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (err) {
      logger.error("[macros] DELETE /macros/:id failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── POST /macros/:id/toggle ─────────────────────────────────────────────────
  router.post("/macros/:id/toggle", async (req: Request, res: Response) => {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ success: false, error: "isActive (boolean) required" });
      }
      const macro = await prisma.inboxMacro.update({
        where: { id: req.params.id },
        data: { isActive },
      });
      res.json({ success: true, data: macro });
    } catch (err) {
      logger.error("[macros] POST /macros/:id/toggle failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  return router;
}
