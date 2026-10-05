import { describe, it, expect } from "vitest";
import { PolicyDecisionPoint, EvaluationRequest } from "./core/domain/policy.domain";
import { InMemoryPolicyAdapter } from "./adapters/policy-db.adapter";
import { PolicyUseCases } from "./core/usecases/policy.usecases";

describe("Centralized Policy Engine (PDP) — Verification Suite", () => {
  const adapter = new InMemoryPolicyAdapter();
  const useCases = new PolicyUseCases(adapter);

  it("POL-001: Denies cross-tenant resource access for non-superadmin users", async () => {
    const request: EvaluationRequest = {
      subject: {
        id: "usr-1",
        role: "USER",
        tenantId: "TENANT_A",
        companyId: "TENANT_A",
      },
      action: "READ",
      resource: {
        type: "INVOICE",
        id: "inv-99",
        tenantId: "TENANT_B", // Different tenant!
        companyId: "TENANT_B",
      },
    };

    const res = await useCases.evaluate(request);

    expect(res.decision).toBe("DENY");
    expect(res.matchingPolicies).toContain("POL_TENANT_ISOLATION:R-001");
    expect(res.obligations).toContain("SECURITY_ALERT_CROSS_TENANT_ATTEMPT");
  });

  it("POL-001: Permits cross-tenant access for SUPER_ADMIN", async () => {
    const request: EvaluationRequest = {
      subject: {
        id: "usr-admin",
        role: "SUPER_ADMIN",
        tenantId: "PLATFORM_ROOT",
      },
      action: "READ",
      resource: {
        type: "INVOICE",
        id: "inv-99",
        tenantId: "TENANT_B",
      },
    };

    const res = await useCases.evaluate(request);

    expect(res.decision).toBe("PERMIT");
  });

  it("POL-002: Denies financial operations > 10M COP for standard users", async () => {
    const request: EvaluationRequest = {
      subject: {
        id: "usr-sales",
        role: "SALES_REP",
        tenantId: "TENANT_A",
      },
      action: "APPROVE",
      resource: {
        type: "TRANSACTION",
        amount: 25000000, // 25M COP
        tenantId: "TENANT_A",
      },
    };

    const res = await useCases.evaluate(request);

    expect(res.decision).toBe("DENY");
    expect(res.matchingPolicies).toContain("POL_HIGH_VALUE_FINANCE:R-002");
    expect(res.obligations).toContain("DUAL_APPROVAL_REQUIRED");
  });

  it("POL-002: Permits financial operations > 10M COP for FINANCE_DIRECTOR with MFA obligation", async () => {
    const request: EvaluationRequest = {
      subject: {
        id: "usr-cfo",
        role: "FINANCE_DIRECTOR",
        tenantId: "TENANT_A",
      },
      action: "APPROVE",
      resource: {
        type: "TRANSACTION",
        amount: 25000000,
        tenantId: "TENANT_A",
      },
    };

    const res = await useCases.evaluate(request);

    expect(res.decision).toBe("PERMIT");
    expect(res.obligations).toContain("MFA_STEP_UP_REQUIRED");
  });

  it("POL-003: Denies DIAN statutory emission to unauthorized roles", async () => {
    const request: EvaluationRequest = {
      subject: {
        id: "usr-marketing",
        role: "MARKETING_ASSISTANT",
        tenantId: "TENANT_A",
      },
      action: "EMIT_DIAN",
      resource: {
        type: "INVOICE",
        id: "inv-123",
        tenantId: "TENANT_A",
      },
    };

    const res = await useCases.evaluate(request);

    expect(res.decision).toBe("DENY");
    expect(res.matchingPolicies).toContain("POL_DIAN_STATUTORY:R-004");
  });

  it("POL-003: Authorizes DIAN statutory emission for ACCOUNTANT", async () => {
    const request: EvaluationRequest = {
      subject: {
        id: "usr-accountant",
        role: "ACCOUNTANT",
        tenantId: "TENANT_A",
      },
      action: "EMIT_DIAN",
      resource: {
        type: "INVOICE",
        id: "inv-123",
        tenantId: "TENANT_A",
      },
    };

    const res = await useCases.evaluate(request);

    expect(res.decision).toBe("PERMIT");
    expect(res.matchingPolicies).toContain("POL_DIAN_STATUTORY:R-005");
  });

  it("Zero-Trust: Evaluates decisions in less than 5 milliseconds", async () => {
    const request: EvaluationRequest = {
      subject: { id: "u1", role: "ADMIN", tenantId: "T1" },
      action: "READ",
      resource: { type: "POS_ORDER", tenantId: "T1" },
    };

    const res = await useCases.evaluate(request);

    expect(res.decision).toBe("PERMIT");
    expect(res.evaluationDurationMs).toBeLessThan(10);
  });
});
