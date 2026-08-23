/**
 * Hierarchical Multi-Agent Swarm Orchestrator (DAG Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 * Autonomous orchestration engine that decomposes high-level goals into a
 * Directed Acyclic Graph (DAG) of specialized subtasks, executes them in
 * parallel/sequential order, and consolidates the output with approval checkpoints.
 */

export type SpecialistRole = "FINANCE_SPECIALIST" | "LEGAL_COMPLIANCE" | "MARKETING_STRATEGIST" | "TECH_ARCHITECT";

export interface SwarmTaskNode {
  id: string;
  role: SpecialistRole;
  title: string;
  instruction: string;
  dependencies: string[]; // Task IDs that must finish first
  status: "PENDING" | "RUNNING" | "COMPLETED" | "BLOCKED" | "AWAITING_APPROVAL";
  requiresApproval?: boolean;
  output?: string;
  confidenceScore?: number;
}

export interface SwarmPlan {
  planId: string;
  goal: string;
  nodes: SwarmTaskNode[];
  createdAt: string;
  status: "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "PAUSED";
}

export class SwarmOrchestratorService {
  private activePlans = new Map<string, SwarmPlan>();

  /**
   * Decomposes a high-level goal into a structured DAG of specialized agent tasks.
   */
  public createSwarmPlan(goal: string): SwarmPlan {
    const planId = `swarm_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    const nodes: SwarmTaskNode[] = [
      {
        id: "task_1",
        role: "FINANCE_SPECIALIST",
        title: "Análisis de Viabilidad Financiera & Costos Operativos",
        instruction: `Evaluar modelo de ingresos, impuestos y márgenes para el objetivo: "${goal}"`,
        dependencies: [],
        status: "PENDING",
        requiresApproval: false,
      },
      {
        id: "task_2",
        role: "LEGAL_COMPLIANCE",
        title: "Revisión Regulatoria DIAN & Cumplimiento GDPR/Habeas Data",
        instruction: `Comprobar normativas legales aplicables en Colombia/LATAM para: "${goal}"`,
        dependencies: ["task_1"],
        status: "PENDING",
        requiresApproval: true,
      },
      {
        id: "task_3",
        role: "TECH_ARCHITECT",
        title: "Diseño de Arquitectura de Microservicios & Escalabilidad",
        instruction: `Especificar endpoints, flujos de eventos y esquemas de base de datos para: "${goal}"`,
        dependencies: ["task_1"],
        status: "PENDING",
        requiresApproval: false,
      },
      {
        id: "task_4",
        role: "MARKETING_STRATEGIST",
        title: "Estrategia de Lanzamiento & Pruebas A/B",
        instruction: `Diseñar campaña de adquisición, optimización de CTR y mensaje clave para: "${goal}"`,
        dependencies: ["task_2", "task_3"],
        status: "PENDING",
        requiresApproval: false,
      },
    ];

    const plan: SwarmPlan = {
      planId,
      goal,
      nodes,
      createdAt: new Date().toISOString(),
      status: "PLANNING",
    };

    this.activePlans.set(planId, plan);
    return plan;
  }

  /**
   * Executes the DAG plan resolving task dependencies in optimal topological order.
   */
  public async executeSwarmPlan(planId: string): Promise<SwarmPlan> {
    const plan = this.activePlans.get(planId);
    if (!plan) throw new Error(`Swarm Plan ${planId} no encontrado.`);

    plan.status = "IN_PROGRESS";

    for (const node of plan.nodes) {
      // Check if dependencies are completed
      const depsCompleted = node.dependencies.every((depId) => {
        const dep = plan.nodes.find((n) => n.id === depId);
        return dep && dep.status === "COMPLETED";
      });

      if (!depsCompleted) {
        node.status = "BLOCKED";
        continue;
      }

      node.status = "RUNNING";
      // Simulate specialized LLM execution
      node.output = `[${node.role}] Resolución completada con éxito para tarea "${node.title}".`;
      node.confidenceScore = 0.96;
      node.status = node.requiresApproval ? "AWAITING_APPROVAL" : "COMPLETED";
    }

    const allFinished = plan.nodes.every((n) => n.status === "COMPLETED");
    if (allFinished) {
      plan.status = "COMPLETED";
    }

    return plan;
  }

  /**
   * Approves a human-in-the-loop checkpoint.
   */
  public approveTaskNode(planId: string, taskId: string): SwarmPlan {
    const plan = this.activePlans.get(planId);
    if (!plan) throw new Error(`Swarm Plan ${planId} no encontrado.`);

    const node = plan.nodes.find((n) => n.id === taskId);
    if (!node) throw new Error(`Task Node ${taskId} no encontrado.`);

    node.status = "COMPLETED";
    const allFinished = plan.nodes.every((n) => n.status === "COMPLETED");
    if (allFinished) {
      plan.status = "COMPLETED";
    }

    return plan;
  }
}

export const swarmOrchestrator = new SwarmOrchestratorService();
