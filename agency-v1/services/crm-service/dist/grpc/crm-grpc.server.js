"use strict";
/**
 * services/crm-service/src/grpc/crm-grpc.server.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Synchronous High-Speed gRPC Server for CrmService (Port 50052)
 * Executes CQRS Queries and Commands via Protobuf binary RPCs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCrmGrpcServer = startCrmGrpcServer;
const grpc_1 = require("@agency/grpc");
const commands_1 = require("../cqrs/commands");
const queries_1 = require("../cqrs/queries");
const database_1 = require("@agency/database");
const CRM_GRPC_PORT = parseInt(process.env.GRPC_PORT || "50052", 10);
function startCrmGrpcServer() {
    const server = new grpc_1.GrpcServerHelper();
    server.addService(grpc_1.PROTO_PATHS.crm, "crm", "CrmService", {
        CheckHealth: async (_call, callback) => {
            callback(null, {
                status: "healthy",
                service: "crm-service",
                timestamp: Date.now(),
            });
        },
        GetLeadDetails: async (call, callback) => {
            try {
                const { leadId } = call.request;
                const lead = await database_1.prisma.lead.findUnique({ where: { id: leadId } });
                if (!lead) {
                    return callback(null, { success: false, error: "Lead not found" });
                }
                callback(null, {
                    success: true,
                    leadId: lead.id,
                    name: lead.name,
                    email: lead.email || "",
                    phone: lead.phone || "",
                    status: lead.status,
                    score: lead.score || 0,
                    companyId: lead.companyId,
                    error: "",
                });
            }
            catch (err) {
                callback(null, { success: false, error: err.message || "Internal gRPC error" });
            }
        },
        CreateLead: async (call, callback) => {
            try {
                const { companyId, name, email, phone, source, score } = call.request;
                const lead = await (0, commands_1.executeCreateLeadCommand)({
                    companyId,
                    name,
                    email,
                    phone,
                    source,
                    score,
                });
                callback(null, {
                    success: true,
                    leadId: lead.id,
                    name: lead.name,
                    email: lead.email || "",
                    phone: lead.phone || "",
                    status: lead.status,
                    score: lead.score || 0,
                    companyId: lead.companyId,
                    error: "",
                });
            }
            catch (err) {
                callback(null, { success: false, error: err.message || "Internal gRPC error" });
            }
        },
        GetPipeline: async (call, callback) => {
            try {
                const { companyId } = call.request;
                const pipeline = await (0, queries_1.executeGetPipelineQuery)(companyId);
                callback(null, {
                    success: true,
                    companyId: pipeline.companyId,
                    stages: pipeline.stages,
                    totalDeals: pipeline.totalDeals,
                    totalValue: pipeline.totalValue,
                    error: "",
                });
            }
            catch (err) {
                callback(null, { success: false, stages: [], totalDeals: 0, totalValue: 0, error: err.message });
            }
        },
    });
    server.start(CRM_GRPC_PORT).then(() => {
        console.log(`⚡ CRM gRPC Server running on port ${CRM_GRPC_PORT} (Protobuf Sync)`);
    }).catch((err) => {
        console.error("❌ Failed to start CRM gRPC server:", err.message);
    });
    return server;
}
//# sourceMappingURL=crm-grpc.server.js.map