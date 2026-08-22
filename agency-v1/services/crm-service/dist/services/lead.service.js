"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadService = void 0;
const database_1 = require("@agency/database");
const assignment_engine_1 = require("../assignment-engine");
class LeadService {
    /**
     * Obtiene la lista de leads con filtros paginados
     */
    static async getLeads(filter) {
        const { companyId, status, source, scoreMin, scoreMax, search, page = 1, pageSize = 20, sortBy = "createdAt", sortOrder = "desc", syncDealId, syncEmail } = filter;
        const where = { companyId };
        if (status)
            where.status = status;
        if (source)
            where.source = source;
        if (scoreMin !== undefined || scoreMax !== undefined) {
            where.score = {
                gte: scoreMin ?? 0,
                lte: scoreMax ?? 100,
            };
        }
        if (syncDealId || syncEmail) {
            const orConditions = [];
            if (syncDealId)
                orConditions.push({ convertedToDealId: syncDealId });
            if (syncEmail)
                orConditions.push({ email: { equals: syncEmail, mode: "insensitive" } });
            where.OR = orConditions;
        }
        else if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
            ];
        }
        const skip = (page - 1) * pageSize;
        const [leads, total] = await Promise.all([
            database_1.prisma.lead.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: pageSize,
            }),
            database_1.prisma.lead.count({ where }),
        ]);
        return {
            leads,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    /**
     * Obtiene un lead específico por su ID y companyId
     */
    static async getLeadById(id, companyId) {
        const lead = await database_1.prisma.lead.findFirst({
            where: { id, companyId }
        });
        if (!lead) {
            const error = new Error(`Lead with ID '${id}' not found`);
            error.statusCode = 404;
            throw error;
        }
        return lead;
    }
    /**
     * Crea un nuevo lead ejecutando asignación de agente y transacción atómica de Outbox
     */
    static async createLead(input) {
        // 1. Ejecutar motor de asignación automática de leads (Lead Assignment Engine)
        const assignedAgentId = await (0, assignment_engine_1.routeLead)({ companyId: input.companyId, source: input.source || "manual" });
        // 2. Transacción Atómica Prisma: Crear Lead + Registrar evento en Outbox
        const result = await database_1.prisma.$transaction(async (tx) => {
            const newLead = await tx.lead.create({
                data: {
                    companyId: input.companyId,
                    name: input.name,
                    email: input.email,
                    phone: input.phone || null,
                    company: input.company || null,
                    source: input.source || "manual",
                    notes: input.notes || null,
                    score: input.score ?? 10,
                    status: "NEW",
                    assignedToId: assignedAgentId || null
                }
            });
            // Insertar evento en la tabla Outbox de la misma transacción para garantizar atomicidad
            await tx.outboxEvent.create({
                data: {
                    eventType: "lead.created",
                    aggregateType: "Lead",
                    aggregateId: newLead.id,
                    payload: JSON.stringify({
                        id: newLead.id,
                        companyId: newLead.companyId,
                        name: newLead.name,
                        email: newLead.email,
                        assignedToId: newLead.assignedToId,
                        createdAt: newLead.createdAt
                    }),
                    status: "PENDING",
                    attempts: 0
                }
            });
            return newLead;
        });
        return result;
    }
}
exports.LeadService = LeadService;
//# sourceMappingURL=lead.service.js.map