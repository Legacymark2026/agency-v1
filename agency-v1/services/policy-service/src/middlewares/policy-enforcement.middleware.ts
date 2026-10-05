import { Request, Response, NextFunction } from "express";

/**
 * Reusable Policy Enforcement Point (PEP) middleware.
 * Delegates authorization decisions to the Centralized Policy Engine (PDP).
 */
export function enforcePolicy(action: string, getResource: (req: Request) => { type: string; id?: string; amount?: number; classification?: any }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user || {};
      const tenantId = (req.headers["x-company-id"] as string) || user.companyId || user.tenantId;

      const evaluationPayload = {
        subject: {
          id: user.id || "anonymous",
          role: user.role || "GUEST",
          roles: user.roles || (user.role ? [user.role] : []),
          tenantId: tenantId,
          companyId: tenantId,
          isMfaVerified: !!user.isMfaVerified,
        },
        action,
        resource: {
          ...getResource(req),
          tenantId: tenantId,
          companyId: tenantId,
        },
        context: {
          ipAddress: req.ip || req.socket.remoteAddress,
          currentTime: new Date().toISOString(),
          originatingService: req.headers["x-service-name"] as string || "unknown",
        },
      };

      // In production, invoke PDP service over HTTP/gRPC.
      // If running inside the policy service itself, call directly or via localhost:4050
      const policyServiceUrl = process.env.POLICY_SERVICE_URL || "http://policy-service:4050";
      
      const response = await fetch(`${policyServiceUrl}/api/policies/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evaluationPayload),
      });

      if (!response.ok) {
        throw new Error(`Policy engine returned HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.decision !== "PERMIT") {
        res.status(403).json({
          error: "Forbidden by Centralized Security Policy",
          reasons: result.reasons,
          obligations: result.obligations,
        });
        return;
      }

      // If obligations exist (e.g. MFA required), attach to request
      (req as any).policyObligations = result.obligations;
      next();
    } catch (err: any) {
      console.error("[PolicyEnforcement] PDP Evaluation Error:", err.message);
      // Fail closed (Zero-Trust)
      res.status(500).json({ error: "Authorization Policy Decision Point unavailable" });
    }
  };
}
