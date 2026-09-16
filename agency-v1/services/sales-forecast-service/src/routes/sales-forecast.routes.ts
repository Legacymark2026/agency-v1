import { Router, Request, Response } from "express";
import { ISalesForecastUseCases, ISalesForecastRepositoryPort } from "../core/ports/sales-forecast.ports";
import { z } from "zod";

export function createSalesForecastRouter(
  useCases: ISalesForecastUseCases,
  repo: ISalesForecastRepositoryPort
): Router {
  const router = Router();

  // ── Tablas de Descuento ──────────────────────────────────────────────────
  router.get("/discount-tables", async (req: Request, res: Response) => {
    try {
      const companyId = (req.query.companyId as string) || "default";
      const tables = await repo.listDiscountTables(companyId);
      res.json({ success: true, data: tables });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post("/discount-tables", async (req: Request, res: Response) => {
    try {
      const table = await repo.createDiscountTable(req.body);
      res.status(201).json({ success: true, data: table });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post("/discount-tables/evaluate", async (req: Request, res: Response) => {
    try {
      const result = await useCases.evaluateDiscount(req.body);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.patch("/discount-tables/:id/toggle", async (req: Request, res: Response) => {
    try {
      const { isActive } = req.body;
      const updated = await repo.toggleDiscountTable(req.params.id, Boolean(isActive));
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ── Proyecciones de Ventas (Machine Learning) ─────────────────────────────
  router.get("/projections", async (req: Request, res: Response) => {
    try {
      const companyId = (req.query.companyId as string) || "default";
      const period = req.query.period as string | undefined;
      const forecasts = await repo.listForecasts(companyId, period);
      res.json({ success: true, data: forecasts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post("/projections/generate", async (req: Request, res: Response) => {
    try {
      const { companyId = "default", targetPeriod, productId } = req.body;
      const now = new Date();
      const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, "0")}`;
      const forecasts = await useCases.runMLSalesForecast({
        companyId,
        targetPeriod: targetPeriod || defaultPeriod,
        productId,
      });
      res.json({ success: true, data: forecasts });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ── Simulación de Escenarios Comerciales ─────────────────────────────────
  router.get("/simulations", async (req: Request, res: Response) => {
    try {
      const companyId = (req.query.companyId as string) || "default";
      const simulations = await repo.listSimulations(companyId);
      res.json({ success: true, data: simulations });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post("/simulations/run", async (req: Request, res: Response) => {
    try {
      const result = await useCases.simulateCommercialScenario(req.body);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  return router;
}
