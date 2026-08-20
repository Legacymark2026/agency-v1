/**
 * services/crm-service/src/grpc/crm-grpc.server.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Synchronous High-Speed gRPC Server for CrmService (Port 50052)
 * Executes CQRS Queries and Commands via Protobuf binary RPCs.
 */

import { GrpcServerHelper, PROTO_PATHS } from "@agency/grpc";
import { executeCreateLeadCommand } from "../cqrs/commands";
import { executeGetLeadsQuery, executeGetPipelineQuery } from "../cqrs/queries";
import { prisma } from "@agency/database";

const CRM_GRPC_PORT = parseInt(process.env.GRPC_PORT || "50052", 10);

export function startCrmGrpcServer() {
  const server = new GrpcServerHelper();

  server.addService(
    PROTO_PATHS.crm,
    "crm",
    "CrmService",
    {
      CheckHealth: async (_call: any, callback: any) => {
        callback(null, {
          status: "healthy",
          service: "crm-service",
          timestamp: Date.now(),
        });
      },

      GetLeadDetails: async (call: any, callback: any) => {
        try {
          const { leadId } = call.request;
          const lead = await prisma.lead.findUnique({ where: { id: leadId } });
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
        } catch (err: any) {
          callback(null, { success: false, error: err.message || "Internal gRPC error" });
        }
      },

      CreateLead: async (call: any, callback: any) => {
        try {
          const { companyId, name, email, phone, source, score } = call.request;
          const lead = await executeCreateLeadCommand({
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
        } catch (err: any) {
          callback(null, { success: false, error: err.message || "Internal gRPC error" });
        }
      },

      GetPipeline: async (call: any, callback: any) => {
        try {
          const { companyId } = call.request;
          const pipeline = await executeGetPipelineQuery(companyId);
          callback(null, {
            success: true,
            companyId: pipeline.companyId,
            stages: pipeline.stages,
            totalDeals: pipeline.totalDeals,
            totalValue: pipeline.totalValue,
            error: "",
          });
        } catch (err: any) {
          callback(null, { success: false, stages: [], totalDeals: 0, totalValue: 0, error: err.message });
        }
      },
    }
  );

  server.start(CRM_GRPC_PORT).then(() => {
    console.log(`⚡ CRM gRPC Server running on port ${CRM_GRPC_PORT} (Protobuf Sync)`);
  }).catch((err: any) => {
    console.error("❌ Failed to start CRM gRPC server:", err.message);
  });

  return server;
}
