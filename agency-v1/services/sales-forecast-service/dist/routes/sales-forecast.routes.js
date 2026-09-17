"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSalesForecastRouter = createSalesForecastRouter;
const express_1 = require("express");
function createSalesForecastRouter(useCases, repo) {
    const router = (0, express_1.Router)();
    // ── Tablas de Descuento ──────────────────────────────────────────────────
    router.get("/discount-tables", async (req, res) => {
        try {
            const companyId = req.query.companyId || "default";
            const tables = await repo.listDiscountTables(companyId);
            res.json({ success: true, data: tables });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
    router.post("/discount-tables", async (req, res) => {
        try {
            const table = await repo.createDiscountTable(req.body);
            res.status(201).json({ success: true, data: table });
        }
        catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    });
    router.post("/discount-tables/evaluate", async (req, res) => {
        try {
            const result = await useCases.evaluateDiscount(req.body);
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    });
    router.patch("/discount-tables/:id/toggle", async (req, res) => {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const { isActive } = req.body;
            const updated = await repo.toggleDiscountTable(id, Boolean(isActive));
            res.json({ success: true, data: updated });
        }
        catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    });
    // ── Proyecciones de Ventas (Machine Learning) ─────────────────────────────
    router.get("/projections", async (req, res) => {
        try {
            const companyId = req.query.companyId || "default";
            const period = req.query.period;
            const forecasts = await repo.listForecasts(companyId, period);
            res.json({ success: true, data: forecasts });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
    router.post("/projections/generate", async (req, res) => {
        try {
            const { companyId = "default", targetPeriod, productId, algorithm, alpha, beta, exogenousFactors, autoTune } = req.body;
            const now = new Date();
            const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, "0")}`;
            const forecasts = await useCases.runMLSalesForecast({
                companyId,
                targetPeriod: targetPeriod || defaultPeriod,
                productId,
                algorithm,
                alpha,
                beta,
                exogenousFactors,
                autoTune
            });
            res.json({ success: true, data: forecasts });
        }
        catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    });
    // ── Simulación de Escenarios Comerciales ─────────────────────────────────
    router.get("/simulations", async (req, res) => {
        try {
            const companyId = req.query.companyId || "default";
            const simulations = await repo.listSimulations(companyId);
            res.json({ success: true, data: simulations });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
    router.post("/simulations/run", async (req, res) => {
        try {
            const result = await useCases.simulateCommercialScenario(req.body);
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    });
    router.post("/simulations/compare", async (req, res) => {
        try {
            const { scenarios } = req.body;
            if (!Array.isArray(scenarios)) {
                res.status(400).json({ success: false, error: "scenarios debe ser un arreglo" });
                return;
            }
            const results = await useCases.compareScenarios(scenarios);
            res.json({ success: true, data: results });
        }
        catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    });
    // ── Optimizador Prescriptivo de Descuento (AI Margin Maximizer) ───────────
    router.post("/optimizer/optimal-discount", async (req, res) => {
        try {
            const result = await useCases.calculateOptimalDiscount(req.body);
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    });
    // ── Liquidación Preventiva de Lotes Próximos a Vencer (Markdown) ─────────
    router.get("/markdown/lot-recommendations", async (req, res) => {
        try {
            const companyId = req.query.companyId || "default";
            const withinDays = req.query.withinDays ? parseInt(req.query.withinDays, 10) : 60;
            const suggestions = await useCases.getBatchMarkdownSuggestions(companyId, withinDays);
            res.json({ success: true, data: suggestions });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
    return router;
}
