import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "document-service");

export interface CreateProposalInput {
  companyId: string;
  title: string;
  clientName?: string;
  totalAmount?: number;
  content?: string;
}

export class DocumentService {
  /**
   * Obtener propuestas de documentos por empresa
   */
  static async getProposals(companyId: string) {
    return prisma.proposal.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Crear nueva propuesta de documento con transacción atómica
   */
  static async createProposal(input: CreateProposalInput) {
    return prisma.$transaction(async (tx: any) => {
      const proposal = await tx.proposal.create({
        data: {
          companyId: input.companyId,
          title: input.title,
          clientName: input.clientName,
          totalAmount: input.totalAmount || 0,
          content: input.content || "",
          status: "DRAFT"
        }
      });

      return proposal;
    });
  }
}
