"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaSalesForecastAdapter = void 0;
const database_1 = require("@agency/database");
class PrismaSalesForecastAdapter {
    async createDiscountTable(table) {
        const { tiers, ...rest } = table;
        const created = await database_1.prisma.discountTable.create({
            data: {
                ...rest,
                tiers: {
                    create: tiers.map((t) => ({
                        minQuantity: t.minQuantity,
                        maxQuantity: t.maxQuantity,
                        discountPct: t.discountPct,
                        fixedDiscount: t.fixedDiscount || 0,
                        minMarginFloorPct: t.minMarginFloorPct,
                    })),
                },
            },
            include: { tiers: true },
        });
        return created;
    }
    async listDiscountTables(companyId) {
        return database_1.prisma.discountTable.findMany({
            where: { companyId },
            include: { tiers: { orderBy: { minQuantity: "asc" } } },
            orderBy: { createdAt: "desc" },
        });
    }
    async getDiscountTableByCode(companyId, code) {
        return database_1.prisma.discountTable.findUnique({
            where: { companyId_code: { companyId, code } },
            include: { tiers: { orderBy: { minQuantity: "asc" } } },
        });
    }
    async toggleDiscountTable(id, isActive) {
        return database_1.prisma.discountTable.update({
            where: { id },
            data: { isActive },
            include: { tiers: true },
        });
    }
    async getHistoricalSales(companyId, productId, months = 12) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);
        // Consumir movimientos reales de salida por venta (OUT_SALE)
        const where = {
            companyId,
            movementType: "OUT_SALE",
            createdAt: { gte: startDate },
        };
        if (productId)
            where.productId = productId;
        const movements = await database_1.prisma.stockMovement.findMany({
            where,
            orderBy: { createdAt: "asc" },
        });
        // Agrupar por producto y por periodo mensual
        const monthlyMap = new Map();
        for (const m of movements) {
            const d = new Date(m.createdAt);
            const periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const prodKey = `${m.productId || "default"}__${periodKey}`;
            const cur = monthlyMap.get(prodKey) || {
                units: 0,
                revenue: 0,
                productId: m.productId || "default",
                sku: m.sku || "SKU-GEN",
                productName: m.productName || "Producto Comercial",
            };
            cur.units += Number(m.quantity) || 0;
            cur.revenue += Number(m.totalCost) || 0;
            monthlyMap.set(prodKey, cur);
        }
        const points = [];
        for (const [key, data] of monthlyMap.entries()) {
            const period = key.split("__")[1];
            points.push({
                date: new Date(`${period}-01`),
                period,
                productId: data.productId,
                sku: data.sku,
                productName: data.productName,
                unitsSold: data.units,
                revenue: data.revenue,
                avgPrice: data.units > 0 ? Math.round(data.revenue / data.units) : 0,
            });
        }
        return points;
    }
    async saveForecastRecord(forecast) {
        return database_1.prisma.salesForecastRecord.upsert({
            where: {
                companyId_productId_forecastPeriod: {
                    companyId: forecast.companyId,
                    productId: forecast.productId,
                    forecastPeriod: forecast.forecastPeriod,
                },
            },
            update: {
                predictedUnits: forecast.predictedUnits,
                predictedRevenue: forecast.predictedRevenue,
                confidenceScore: forecast.confidenceScore,
                modelUsed: forecast.modelType,
                historicalTrendPct: forecast.trendPct,
                seasonalityFactor: forecast.seasonalityMultiplier,
            },
            create: {
                companyId: forecast.companyId,
                productId: forecast.productId,
                sku: forecast.sku,
                productName: forecast.productName,
                forecastPeriod: forecast.forecastPeriod,
                predictedUnits: forecast.predictedUnits,
                predictedRevenue: forecast.predictedRevenue,
                confidenceScore: forecast.confidenceScore,
                modelUsed: forecast.modelType,
                historicalTrendPct: forecast.trendPct,
                seasonalityFactor: forecast.seasonalityMultiplier,
            },
        });
    }
    async listForecasts(companyId, period) {
        const where = { companyId };
        if (period)
            where.forecastPeriod = period;
        return database_1.prisma.salesForecastRecord.findMany({
            where,
            orderBy: { predictedRevenue: "desc" },
        });
    }
    async saveSimulation(simulation) {
        return database_1.prisma.scenarioSimulation.create({
            data: {
                companyId: simulation.companyId,
                name: simulation.name,
                scenarioType: simulation.scenarioType,
                baseRevenue: simulation.result.baseRevenue,
                projectedRevenue: simulation.result.projectedRevenue,
                projectedMargin: simulation.result.projectedMarginPct,
                volumeChangePct: simulation.result.volumeDeltaPct,
                marginChangePct: simulation.result.revenueDeltaPct,
                parameters: simulation.params,
                results: simulation.result,
            },
        });
    }
    async listSimulations(companyId) {
        return database_1.prisma.scenarioSimulation.findMany({
            where: { companyId },
            orderBy: { createdAt: "desc" },
            take: 20,
        });
    }
    async getExpiringLotsForMarkdown(companyId, withinDays) {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() + withinDays);
        try {
            return await database_1.prisma.productLot.findMany({
                where: {
                    companyId,
                    status: "ACTIVE",
                    expiryDate: { lte: threshold },
                },
                orderBy: { expiryDate: "asc" },
            });
        }
        catch {
            // Fallback para ambientes de demostración o antes de seed de inventario
            return [
                {
                    id: "lot-demo-1",
                    sku: "CAF-GEISHA-250G",
                    productName: "Café Varietal Geisha 250g",
                    quantity: 85,
                    unitCost: 18000,
                    unitPrice: 34000,
                    expiryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
                },
                {
                    id: "lot-demo-2",
                    sku: "SNK-CHOC-70",
                    productName: "Chocolate Origen Arauca 70%",
                    quantity: 140,
                    unitCost: 6500,
                    unitPrice: 12500,
                    expiryDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
                },
                {
                    id: "lot-demo-3",
                    sku: "INF-BERRIES-50G",
                    productName: "Infusión Frutos Rojos Premium",
                    quantity: 210,
                    unitCost: 8000,
                    unitPrice: 16000,
                    expiryDate: new Date(Date.now() + 52 * 24 * 60 * 60 * 1000),
                },
            ];
        }
    }
}
exports.PrismaSalesForecastAdapter = PrismaSalesForecastAdapter;
