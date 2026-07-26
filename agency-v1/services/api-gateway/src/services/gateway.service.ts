import { GrpcClientHelper, PROTO_PATHS } from "@agency/grpc";

const AUTH_GRPC_URL = process.env.AUTH_GRPC_URL || "auth-service:50051";

const authGrpcClient = GrpcClientHelper.getClient(
  "auth-service",
  PROTO_PATHS.auth,
  "auth",
  "AuthService",
  AUTH_GRPC_URL,
  { failureThreshold: 3, resetTimeoutMs: 5000, timeoutMs: 3000 }
);

export interface ServiceRegistry {
  [key: string]: string;
}

const SERVICE_REGISTRY: ServiceRegistry = {
  auth: process.env.AUTH_URL || "http://auth-service:4001",
  crm: process.env.CRM_URL || "http://crm-service:4002",
  project: process.env.PROJECT_URL || "http://project-service:4003",
  "ai-engine": process.env.AI_ENGINE_URL || "http://ai-engine:4004",
  finance: process.env.FINANCE_URL || "http://finance-service:4005",
  "agent-team": process.env.AGENT_TEAM_URL || "http://agent-team-engine:4012",
  notification: process.env.NOTIFICATION_URL || "http://notification-service:4007",
  analytics: process.env.ANALYTICS_URL || "http://analytics-service:4008",
};

export class GatewayService {
  /**
   * Resolver la URL de un microservicio por nombre
   */
  static resolveServiceUrl(name: string): string {
    return SERVICE_REGISTRY[name] || "";
  }

  /**
   * Verificar token JWT via gRPC con fallback HTTP
   */
  static async verifyToken(token: string): Promise<{ valid: boolean; userId?: string; companyId?: string }> {
    try {
      const result: any = await authGrpcClient.call("ValidateToken", { token }, async () => {
        const authUrl = GatewayService.resolveServiceUrl("auth");
        const resp = await fetch(`${authUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data: any = await resp.json();
        return {
          valid: resp.ok,
          userId: data.user?.id,
          companyId: data.user?.companyId,
        };
      });
      return result;
    } catch {
      return { valid: false };
    }
  }
}
