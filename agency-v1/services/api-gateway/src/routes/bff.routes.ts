/**
 * BFF Aggregator Routes — API Gateway
 * ─────────────────────────────────────────────────────────────────────────────
 * Exposes consolidated REST endpoints for dashboard panels:
 *   - GET /api/bff/dashboard (or /api/v1/bff/dashboard)
 *   - POST /api/bff/dashboard/invalidate (Cache flush on mutation)
 */
import { Router, Request, Response } from "express";
import { BffAggregatorService } from "../services/bff-aggregator.service";

export const bffRouter = Router();

/**
 * GET /api/bff/dashboard
 * Retorna en una sola solicitud todo el estado consolidado de los dashboards
 * consultando los microservicios en paralelo y con caché multicapa Redis.
 */
bffRouter.get("/dashboard", async (req: Request, res: Response): Promise<any> => {
  try {
    const companyId = (req.headers["x-company-id"] as string) || (req.query.companyId as string) || "company_default";
    const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string) || "user_default";
    const role = (req.headers["x-user-role"] as string) || "ADMIN";
    const token = req.headers.authorization;
    const correlationId = (req.headers["x-correlation-id"] as string);
    const bypassCache = req.query.fresh === "true" || req.query.refresh === "true";

    const summary = await BffAggregatorService.getAggregatedDashboard({
      companyId,
      userId,
      role,
      token,
      correlationId,
      bypassCache,
    });

    res.setHeader("X-BFF-Aggregated", "true");
    res.setHeader("X-Cache-Lookup", summary.cached ? "HIT" : "MISS");
    res.setHeader("X-Response-Time-Ms", String(summary.durationMs));

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error("[BFF] Error aggregating dashboard:", error);
    return res.status(500).json({
      success: false,
      error: "Error interno agregando métricas de dashboard en BFF",
      details: error.message,
    });
  }
});

/**
 * POST /api/bff/dashboard/invalidate
 * Invalida la caché del dashboard cuando ocurre una mutación importante.
 */
bffRouter.post("/dashboard/invalidate", async (req: Request, res: Response): Promise<any> => {
  try {
    const companyId = (req.body?.companyId as string) || (req.headers["x-company-id"] as string) || "company_default";
    await BffAggregatorService.invalidateCompanyCache(companyId);
    return res.json({ success: true, message: `Cache invalidated for company ${companyId}` });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
