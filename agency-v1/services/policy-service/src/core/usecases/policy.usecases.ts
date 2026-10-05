import { 
  PolicyDecisionPoint, 
  EvaluationRequest, 
  EvaluationResponse, 
  Policy 
} from "../domain/policy.domain";
import { IPolicyRepositoryPort, IPolicyEventPublisherPort } from "../ports/policy.ports";

export class PolicyUseCases {
  constructor(
    private readonly policyRepo: IPolicyRepositoryPort,
    private readonly eventPublisher?: IPolicyEventPublisherPort
  ) {}

  /**
   * Evaluates an authorization request in real-time (<5ms)
   */
  async evaluate(request: EvaluationRequest): Promise<EvaluationResponse> {
    const policies = await this.policyRepo.listActivePolicies(request.subject.tenantId);
    const result = PolicyDecisionPoint.evaluate(request, policies);

    // Asynchronously publish policy audit event without delaying decision response
    if (this.eventPublisher) {
      this.eventPublisher.publishPolicyDecision({
        decision: result.decision as "PERMIT" | "DENY",
        subjectId: request.subject.id,
        action: request.action,
        resourceType: request.resource.type,
        resourceId: request.resource.id,
        tenantId: request.subject.tenantId || request.resource.tenantId,
        reasons: result.reasons,
        obligations: result.obligations,
      }).catch(err => {
        console.warn("[PolicyUseCases] Non-fatal: Failed to publish policy decision event:", err.message);
      });
    }

    return result;
  }

  /**
   * Simulates policy evaluation against hypothetical or custom rules (Dry-run mode)
   */
  async simulate(request: EvaluationRequest, additionalPolicies: Policy[] = []): Promise<EvaluationResponse> {
    const existingPolicies = await this.policyRepo.listActivePolicies(request.subject.tenantId);
    const combinedPolicies = [...additionalPolicies, ...existingPolicies];
    return PolicyDecisionPoint.evaluate(request, combinedPolicies);
  }

  /**
   * Lists all active centralized policies
   */
  async listPolicies(tenantId?: string): Promise<Policy[]> {
    return this.policyRepo.listActivePolicies(tenantId);
  }

  /**
   * Registers or updates a policy
   */
  async registerPolicy(policy: Policy): Promise<Policy> {
    return this.policyRepo.savePolicy(policy);
  }

  /**
   * Deactivates a policy by code
   */
  async deactivatePolicy(code: string): Promise<boolean> {
    return this.policyRepo.deactivatePolicy(code);
  }
}
