import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "automation-service");

export interface CreateWorkflowInput {
  companyId: string;
  name: string;
  triggerType: string;
  triggerConfig?: any;
  steps?: any[];
}

export class AutomationService {
  /**
   * Obtener lista de flujos de trabajo por empresa
   */
  static async getWorkflows(companyId: string) {
    return prisma.workflow.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { executions: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Crear nuevo flujo de trabajo con transacción atómica
   */
  static async createWorkflow(input: CreateWorkflowInput) {
    return prisma.$transaction(async (tx: any) => {
      const workflow = await tx.workflow.create({
        data: {
          companyId: input.companyId,
          name: input.name,
          triggerType: input.triggerType,
          triggerConfig: input.triggerConfig || {},
          steps: input.steps || [],
          status: "ACTIVE"
        }
      });

      await eventBus.publish("workflow.started", {
        workflowId: workflow.id,
        companyId: workflow.companyId,
        triggerType: workflow.triggerType,
        timestamp: new Date().toISOString()
      });

      return workflow;
    });
  }
}
