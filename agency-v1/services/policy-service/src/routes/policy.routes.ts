import { Router, Request, Response } from "express";
import { PolicyUseCases } from "../core/usecases/policy.usecases";
import { z } from "zod";

const EvaluationSchema = z.object({
  subject: z.object({
    id: z.string(),
    role: z.string(),
    roles: z.array(z.string()).optional(),
    tenantId: z.string().optional(),
    companyId: z.string().optional(),
    department: z.string().optional(),
    clearanceLevel: z.number().optional(),
    isMfaVerified: z.boolean().optional(),
  }),
  action: z.string(),
  resource: z.object({
    type: z.string(),
    id: z.string().optional(),
    tenantId: z.string().optional(),
    companyId: z.string().optional(),
    amount: z.number().optional(),
    classification: z.enum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"]).optional(),
    status: z.string().optional(),
    ownerId: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
  context: z.object({
    currentTime: z.string().optional().transform(v => v ? new Date(v) : undefined),
    ipAddress: z.string().optional(),
    isOffHours: z.boolean().optional(),
    riskScore: z.number().optional(),
    originatingService: z.string().optional(),
  }).optional(),
});

export function createPolicyRouter(useCases: PolicyUseCases): Router {
  const router = Router();

  /**
   * POST /api/policies/evaluate
   * Main Policy Decision Point endpoint (<5ms SLA)
   */
  router.post("/evaluate", async (req: Request, res: Response) => {
    try {
      const parsed = EvaluationSchema.parse(req.body);
      const decision = await useCases.evaluate(parsed as any);
      res.json({ success: true, ...decision });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
        return;
      }
      res.status(500).json({ success: false, error: err.message || "Policy evaluation failure" });
    }
  });

  /**
   * POST /api/policies/simulate
   * Dry-run simulation for hypothetical policies
   */
  router.post("/simulate", async (req: Request, res: Response) => {
    try {
      const parsed = EvaluationSchema.parse(req.body.request);
      const hypotheticalPolicies = req.body.hypotheticalPolicies || [];
      const decision = await useCases.simulate(parsed as any, hypotheticalPolicies);
      res.json({ success: true, ...decision });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/policies
   * Lists all active centralized policies
   */
  router.get("/", async (req: Request, res: Response) => {
    try {
      const tenantId = (req.query.tenantId as string) || (req.headers["x-company-id"] as string);
      const policies = await useCases.listPolicies(tenantId);
      res.json({
        success: true,
        count: policies.length,
        policies: policies.map(p => ({
          id: p.id,
          code: p.code,
          name: p.name,
          description: p.description,
          version: p.version,
          combiningAlgorithm: p.combiningAlgorithm,
          target: p.target,
          rulesCount: p.rules.length,
          rules: p.rules.map(r => ({ id: r.id, name: r.name, effect: r.effect, description: r.description, obligation: r.obligation })),
          isActive: p.isActive,
          updatedAt: p.updatedAt
        }))
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * DELETE /api/policies/:code
   * Deactivates a centralized policy
   */
  router.delete("/:code", async (req: Request, res: Response) => {
    try {
      const code = String(req.params.code);
      const ok = await useCases.deactivatePolicy(code);
      if (!ok) {
        res.status(404).json({ success: false, error: "Policy not found" });
        return;
      }
      res.json({ success: true, message: `Policy ${code} deactivated successfully` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
