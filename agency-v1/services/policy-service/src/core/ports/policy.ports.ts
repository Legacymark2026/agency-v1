import { Policy, EvaluationRequest, EvaluationResponse } from "../domain/policy.domain";

export interface IPolicyRepositoryPort {
  listActivePolicies(tenantId?: string): Promise<Policy[]>;
  getPolicyByCode(code: string): Promise<Policy | null>;
  savePolicy(policy: Policy): Promise<Policy>;
  deactivatePolicy(code: string): Promise<boolean>;
}

export interface IPolicyEventPublisherPort {
  publishPolicyDecision(event: {
    decision: "PERMIT" | "DENY";
    subjectId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    tenantId?: string;
    reasons: string[];
    obligations: string[];
  }): Promise<void>;
}
