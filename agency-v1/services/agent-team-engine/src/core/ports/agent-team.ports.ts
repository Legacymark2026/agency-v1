/**
 * Agent Team Engine — Hexagonal Ports (Inbound & Outbound Interfaces)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { SwarmPlanDomain, SpecialistRole } from "../domain/agent-team.domain";

export interface IAgentTeamUseCases {
  createPlan(goal: string, companyId: string): Promise<SwarmPlanDomain>;
  executeStep(planId: string): Promise<SwarmPlanDomain>;
  approveNode(planId: string, nodeId: string): Promise<SwarmPlanDomain>;
}

export interface ISwarmPlanRepositoryPort {
  save(plan: SwarmPlanDomain): Promise<SwarmPlanDomain>;
  findById(planId: string): Promise<SwarmPlanDomain | null>;
}

export interface ISpecialistAgentPort {
  executeTask(role: SpecialistRole, instruction: string): Promise<{ output: string; confidence: number }>;
}

export interface IAgentTeamEventPublisherPort {
  publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}
