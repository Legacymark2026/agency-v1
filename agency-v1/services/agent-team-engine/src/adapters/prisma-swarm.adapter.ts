/**
 * Agent Team Engine — Prisma Persistence Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { ISwarmPlanRepositoryPort } from "../core/ports/agent-team.ports";
import { SwarmPlanDomain } from "../core/domain/agent-team.domain";

export class PrismaSwarmAdapter implements ISwarmPlanRepositoryPort {
  private inMemory = new Map<string, SwarmPlanDomain>();

  public async save(plan: SwarmPlanDomain): Promise<SwarmPlanDomain> {
    this.inMemory.set(plan.planId, plan);
    return plan;
  }

  public async findById(planId: string): Promise<SwarmPlanDomain | null> {
    return this.inMemory.get(planId) || null;
  }
}
