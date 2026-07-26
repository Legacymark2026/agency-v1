import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "pos-service");

export interface OpenSessionInput {
  companyId: string;
  cashierId: string;
  openingBalance: number;
  registerId?: string;
}

export class PosService {
  /**
   * Obtener sesiones de caja POS por empresa
   */
  static async getSessions(companyId: string) {
    return (prisma as any).posSession.findMany({
      where: { companyId },
      orderBy: { openedAt: "desc" }
    });
  }

  /**
   * Abrir nueva sesión de caja POS con transacción atómica
   */
  static async openSession(input: OpenSessionInput) {
    return prisma.$transaction(async (tx: any) => {
      const session = await tx.posSession.create({
        data: {
          companyId: input.companyId,
          cashierId: input.cashierId,
          openingBalance: input.openingBalance,
          registerId: input.registerId || "REG-01",
          status: "OPEN",
          openedAt: new Date()
        }
      });

      await eventBus.publish("pos.session.opened", {
        sessionId: session.id,
        companyId: session.companyId,
        cashierId: session.cashierId,
        timestamp: new Date().toISOString()
      });

      return session;
    });
  }
}
