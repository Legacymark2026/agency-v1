import { Policy, PolicyDecisionPoint } from "../core/domain/policy.domain";
import { IPolicyRepositoryPort, IPolicyEventPublisherPort } from "../core/ports/policy.ports";
import type { EventBus } from "@agency/events";

export class InMemoryPolicyAdapter implements IPolicyRepositoryPort, IPolicyEventPublisherPort {
  private readonly policies: Map<string, Policy> = new Map();

  constructor(private readonly eventBus?: EventBus) {
    // Seed with official Enterprise Built-in Policies
    const defaults = PolicyDecisionPoint.getBuiltinEnterprisePolicies();
    for (const p of defaults) {
      this.policies.set(p.code, p);
    }
  }

  async listActivePolicies(tenantId?: string): Promise<Policy[]> {
    return Array.from(this.policies.values()).filter(p => p.isActive);
  }

  async getPolicyByCode(code: string): Promise<Policy | null> {
    return this.policies.get(code) || null;
  }

  async savePolicy(policy: Policy): Promise<Policy> {
    this.policies.set(policy.code, policy);
    return policy;
  }

  async deactivatePolicy(code: string): Promise<boolean> {
    const existing = this.policies.get(code);
    if (!existing) return false;
    existing.isActive = false;
    existing.updatedAt = new Date();
    this.policies.set(code, existing);
    return true;
  }

  async publishPolicyDecision(event: {
    decision: "PERMIT" | "DENY";
    subjectId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    tenantId?: string;
    reasons: string[];
    obligations: string[];
  }): Promise<void> {
    if (!this.eventBus) return;
    try {
      await this.eventBus.publish("security.policy.evaluated" as any, {
        ...event,
        emittedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.warn("[InMemoryPolicyAdapter] Warning publishing event:", err.message);
    }
  }
}
