/**
 * Agent Team Engine — Pure Domain Entities & Swarm DAG Calculations
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero external framework dependencies.
 */

export type SpecialistRole = "FINANCE_SPECIALIST" | "LEGAL_COMPLIANCE" | "MARKETING_STRATEGIST" | "TECH_ARCHITECT";

export interface SwarmTaskNode {
  id: string;
  role: SpecialistRole;
  title: string;
  instruction: string;
  dependencies: string[];
  status: "PENDING" | "RUNNING" | "COMPLETED" | "BLOCKED" | "AWAITING_APPROVAL";
  requiresApproval?: boolean;
  output?: string;
  confidenceScore?: number;
}

export function getExecutableNodes(nodes: SwarmTaskNode[]): SwarmTaskNode[] {
  const completedIds = new Set(nodes.filter((n) => n.status === "COMPLETED").map((n) => n.id));

  return nodes.filter((n) => {
    if (n.status !== "PENDING") return false;
    return n.dependencies.every((depId) => completedIds.has(depId));
  });
}

export class SwarmPlanDomain {
  constructor(
    public readonly planId: string,
    public readonly companyId: string,
    public readonly goal: string,
    public readonly nodes: SwarmTaskNode[],
    public readonly status: "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "PAUSED" = "IN_PROGRESS",
    public readonly createdAt: Date = new Date()
  ) {}

  public static create(goal: string, companyId: string): SwarmPlanDomain {
    const planId = `swarm_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const nodes: SwarmTaskNode[] = [
      {
        id: "task_1",
        role: "FINANCE_SPECIALIST",
        title: "Análisis Financiero & Costos",
        instruction: `Evaluar costos para: "${goal}"`,
        dependencies: [],
        status: "PENDING",
      },
      {
        id: "task_2",
        role: "TECH_ARCHITECT",
        title: "Diseño de Arquitectura de Software",
        instruction: `Diseñar componentes para: "${goal}"`,
        dependencies: ["task_1"],
        status: "PENDING",
      },
      {
        id: "task_3",
        role: "LEGAL_COMPLIANCE",
        title: "Aprobación Regulatoria",
        instruction: `Validar cumplimiento para: "${goal}"`,
        dependencies: ["task_2"],
        status: "PENDING",
        requiresApproval: true,
      },
    ];

    return new SwarmPlanDomain(planId, companyId, goal, nodes, "IN_PROGRESS", new Date());
  }

  public updateNode(nodeId: string, partial: Partial<SwarmTaskNode>): SwarmPlanDomain {
    const updatedNodes = this.nodes.map((n) => (n.id === nodeId ? { ...n, ...partial } : n));
    const allCompleted = updatedNodes.every((n) => n.status === "COMPLETED");
    const anyAwaiting = updatedNodes.some((n) => n.status === "AWAITING_APPROVAL");

    let status = this.status;
    if (allCompleted) status = "COMPLETED";
    else if (anyAwaiting) status = "PAUSED";
    else status = "IN_PROGRESS";

    return new SwarmPlanDomain(this.planId, this.companyId, this.goal, updatedNodes, status, this.createdAt);
  }
}
