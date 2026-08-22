"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicApiService = void 0;
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "public-api-service");
class PublicApiService {
    /**
     * Obtener información pública de la API v1
     */
    static async getPublicStatus() {
        return {
            name: "LegacyMark Public API Gateway",
            version: "v1",
            status: "OPERATIONAL",
            documentationUrl: "https://docs.legacymarksas.com/api/v1",
            timestamp: new Date().toISOString()
        };
    }
}
exports.PublicApiService = PublicApiService;
//# sourceMappingURL=public-api.service.js.map