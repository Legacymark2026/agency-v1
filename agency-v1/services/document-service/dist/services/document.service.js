"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "document-service");
class DocumentService {
    /**
     * Obtener propuestas de documentos por empresa
     */
    static async getProposals(companyId) {
        return database_1.prisma.proposal.findMany({
            where: { companyId },
            orderBy: { createdAt: "desc" }
        });
    }
    /**
     * Crear nueva propuesta de documento con transacción atómica
     */
    static async createProposal(input) {
        return database_1.prisma.$transaction(async (tx) => {
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
exports.DocumentService = DocumentService;
//# sourceMappingURL=document.service.js.map