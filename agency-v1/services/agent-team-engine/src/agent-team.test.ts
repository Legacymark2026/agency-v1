import { describe, it, expect } from "vitest";
import { AgentTeamUseCases } from "./core/usecases/agent-team.usecases";
import { getExecutableNodes, SwarmPlanDomain } from "./core/domain/agent-team.domain";
import { ISwarmPlanRepositoryPort, ISpecialistAgentPort, IAgentTeamEventPublisherPort } from "./core/ports/agent-team.ports";

describe("Agent Team Swarm Engine — Hexagonal Architecture 5.0", () => {
  it("computes DAG dependencies and returns only executable nodes", () => {
    const plan = SwarmPlanDomain.create("Lanzar nueva sucursal", "comp-1");
    const executable = getExecutableNodes(plan.nodes);

    expect(executable.length).toBe(1);
    expect(executable[0].id).toBe("task_1"); // task_2 depends on task_1
  });

  it("orchestrates task execution through specialized agent ports and handles checkpoints", async () => {
    const store = new Map<string, SwarmPlanDomain>();
    const publishedEvents: any[] = [];

    const mockRepo: ISwarmPlanRepositoryPort = {
      save: async (p) => {
        store.set(p.planId, p);
        return p;
      },
      findById: async (id) => store.get(id) || null,
    };

    const mockSpecialist: ISpecialistAgentPort = {
      executeTask: async (role, inst) => ({
        output: `Aprobado por ${role}`,
        confidence: 0.98,
      }),
    };

    const mockPublisher: IAgentTeamEventPublisherPort = {
      publishEvent: async (topic, event) => {
        publishedEvents.push({ topic, event });
      },
    };

    const useCases = new AgentTeamUseCases(mockRepo, mockSpecialist, mockPublisher);

    // 1. Create plan
    const plan = await useCases.createPlan("Abrir restaurante", "comp-rest-1");
    expect(plan.nodes.length).toBe(3);
    expect(publishedEvents.some((e) => e.topic === "agent_team.plan.created")).toBe(true);

    // 2. Execute step 1 (task_1 completes)
    const afterStep1 = await useCases.executeStep(plan.planId);
    expect(afterStep1.nodes[0].status).toBe("COMPLETED");
    expect(afterStep1.nodes[1].status).toBe("PENDING");

    // 3. Execute step 2 (task_2 completes)
    const afterStep2 = await useCases.executeStep(plan.planId);
    expect(afterStep2.nodes[1].status).toBe("COMPLETED");

    // 4. Execute step 3 (task_3 requires approval -> enters AWAITING_APPROVAL)
    const afterStep3 = await useCases.executeStep(plan.planId);
    expect(afterStep3.nodes[2].status).toBe("AWAITING_APPROVAL");
    expect(afterStep3.status).toBe("PAUSED");

    // 5. Human approval
    const afterApproval = await useCases.approveNode(plan.planId, "task_3");
    expect(afterApproval.nodes[2].status).toBe("COMPLETED");
    expect(afterApproval.status).toBe("COMPLETED");
  });
});
