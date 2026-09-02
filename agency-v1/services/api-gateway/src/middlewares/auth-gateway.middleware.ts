/**
 * Gateway Authentication & Identity Injection Middleware — API Gateway
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: Resolves race condition in proxyReq by performing synchronous (awaited)
 *          token verification before the request is passed to http-proxy-middleware.
 * Fix C-5: Strips incoming spoofed identity headers (x-user-id, x-company-id)
 *          and only sets them from verified gRPC or HTTP auth payloads.
 */
import { Request, Response, NextFunction } from "express";
import { GrpcClientHelper, PROTO_PATHS } from "@agency/grpc";
import { resolveServiceUrl } from "../lib/service-registry";

const AUTH_GRPC_URL = process.env.AUTH_GRPC_URL || "auth-service:50051";

export const authGrpcClient = GrpcClientHelper.getClient(
  "auth-service",
  PROTO_PATHS.auth,
  "auth",
  "AuthService",
  AUTH_GRPC_URL,
  { failureThreshold: 3, resetTimeoutMs: 5000, timeoutMs: 3000 }
);

export async function authenticateGatewayRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // 1. Always strip incoming client-supplied identity headers to prevent header spoofing
  delete req.headers["x-user-id"];
  delete req.headers["x-company-id"];
  delete req.headers["x-user-role"];

  const authHeader = req.headers.authorization || (req.headers.Authorization as string);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // No token provided — continue without injecting identity headers
    return next();
  }

  const rawToken = authHeader.slice(7).trim();
  if (!rawToken) {
    return next();
  }

  try {
    // 2. Validate token synchronously via gRPC with circuit-breaker and HTTP fallback
    const result: any = await authGrpcClient.call("ValidateToken", { token: rawToken }, async () => {
      // HTTP Fallback to auth-service /api/auth/me
      const authUrl = await resolveServiceUrl("auth");
      const resp = await fetch(`${authUrl}/api/auth/me`, {
        headers: { Authorization: authHeader },
        signal: AbortSignal.timeout(2500),
      });

      if (!resp.ok) return { valid: false, userId: "", companyId: "", role: "" };
      const data: any = await resp.json();
      return {
        valid: true,
        userId: data.user?.id || "",
        companyId: data.companies?.[0]?.id || "",
        role: data.user?.role || "",
      };
    });

    if (result && result.valid && result.userId) {
      // 3. Inject verified identity headers before proxying
      req.headers["x-user-id"] = String(result.userId);
      if (result.companyId) {
        req.headers["x-company-id"] = String(result.companyId);
      }
      if (result.role) {
        req.headers["x-user-role"] = String(result.role);
      }
    }
  } catch (err: any) {
    // Non-blocking for public or mixed routes — downstream will enforce if required
    console.warn(`[GatewayAuth] Token verification bypassed for path ${req.path}:`, err.message);
  }

  next();
}
