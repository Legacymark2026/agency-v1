/**
 * Agent Team Engine — Pure Hexagonal Use Cases Orchestration
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  IAgentTeamUseCases,
  ISwarmPlanRepositoryPort,
  ISpecialistAgentPort,
  IAgentTeamEventPublisherPort,
} from "../ports/agent-team.ports";
import {
  SwarmPlanDomain,
  getExecutableNodes,
} from "../domain/agent-team.domain";

export class AgentTeamUseCases implements IAgentTeamUseCases {
  constructor(
    private readonly repoPort: ISwarmPlanRepositoryPort,
    private readonly specialistPort: ISpecialistAgentPort,
    private readonly eventPublisher: IAgentTeamEventPublisherPort
  ) {}

  public async createPlan(goal: string, companyId: string): Promise<SwarmPlanDomain> {
    const plan = SwarmPlanDomain.create(goal, companyId);
    const saved = await this.repoPort.save(plan);

    await this.eventPublisher.publishEvent("agent_team.plan.created", {
      planId: saved.planId,
      companyId: saved.companyId,
      goal: saved.goal,
      nodeCount: saved.nodes.length,
    });

    return saved;
  }

  public async executeStep(planId: string): Promise<SwarmPlanDomain> {
    const plan = await this.repoPort.findById(planId);
    if (!plan) throw new Error(`Plan ${planId} no encontrado`);

    const executable = getExecutableNodes(plan.nodes);
    if (executable.length === 0) return plan;

    let currentPlan = plan;
    for (const node of executable) {
      if (node.requiresApproval) {
        currentPlan = currentPlan.updateNode(node.id, { status: "AWAITING_APPROVAL" });
        await this.repoPort.save(currentPlan);
        await this.eventPublisher.publishEvent("agent_team.node.awaiting_approval", {
          planId,
          nodeId: node.id,
          role: node.role,
        });
        continue;
      }

      currentPlan = currentPlan.updateNode(node.id, { status: "RUNNING" });
      await this.repoPort.save(currentPlan);

      const result = await this.specialistPort.executeTask(node.role, node.instruction);

      currentPlan = currentPlan.updateNode(node.id, {
        status: "COMPLETED",
        output: result.output,
        confidenceScore: result.confidence,
      });
      await this.repoPort.save(currentPlan);

      await this.eventPublisher.publishEvent("agent_team.node.completed", {
        planId,
        nodeId: node.id,
        output: result.output,
      });
    }

    return currentPlan;
  }

  public async approveNode(planId: string, nodeId: string): Promise<SwarmPlanDomain> {
    const plan = await this.repoPort.findById(planId);
    if (!plan) throw new Error(`Plan ${planId} no encontrado`);

    const node = plan.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Nodo ${nodeId} no encontrado`);

    const result = await this.specialistPort.executeTask(node.role, node.instruction);

    const updated = plan.updateNode(nodeId, {
      status: "COMPLETED",
      output: result.output,
      confidenceScore: result.confidence,
    });

    const saved = await this.repoPort.save(updated);

    await this.eventPublisher.publishEvent("agent_team.node.approved", {
      planId,
      nodeId,
    });

    return saved;
  }
}
