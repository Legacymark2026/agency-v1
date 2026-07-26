import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "public-api-service");

export class PublicApiService {
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
