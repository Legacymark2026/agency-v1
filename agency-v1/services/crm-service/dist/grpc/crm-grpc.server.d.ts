/**
 * services/crm-service/src/grpc/crm-grpc.server.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Synchronous High-Speed gRPC Server for CrmService (Port 50052)
 * Executes CQRS Queries and Commands via Protobuf binary RPCs.
 */
import { GrpcServerHelper } from "@agency/grpc";
export declare function startCrmGrpcServer(): GrpcServerHelper;
