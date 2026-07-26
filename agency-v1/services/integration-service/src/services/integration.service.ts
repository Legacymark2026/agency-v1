import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "integration-service");

export interface CreateIntegrationInput {
  companyId: string;
  provider: string;
  config?: any;
}

export class IntegrationService {
  /**
   * Obtener integraciones activas por empresa
   */
  static async getIntegrations(companyId: string) {
    return prisma.integration.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Conectar/Crear una integración con transacción atómica
   */
  static async connectIntegration(input: CreateIntegrationInput) {
    return prisma.$transaction(async (tx: any) => {
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
