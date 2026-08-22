"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationService = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "integration-service");
class IntegrationService {
    /**
     * Obtener integraciones activas por empresa
     */
    static async getIntegrations(companyId) {
        return database_1.prisma.integration.findMany({
            where: { companyId },
            orderBy: { createdAt: "desc" }
        });
    }
    /**
     * Conectar/Crear una integración con transacción atómica
     */
    static async connectIntegration(input) {
        return database_1.prisma.$transaction(async (tx) => {
            const integration = await tx.integration.upsert({
                where: {
                    companyId_provider: {
                        companyId: input.companyId,
                        provider: input.provider
                    }
                },
                update: {
                    config: input.config || {},
                    status: "CONNECTED",
                    updatedAt: new Date()
                },
                create: {
                    companyId: input.companyId,
                    provider: input.provider,
                    config: input.config || {},
                    status: "CONNECTED"
                }
            });
            return integration;
        });
    }
}
exports.IntegrationService = IntegrationService;
//# sourceMappingURL=integration.service.js.map