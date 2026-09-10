/**
 * Automation Service — Pure Hexagonal Use Cases Orchestration
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  IAutomationUseCases,
  IAutomationRepositoryPort,
  IActionDispatcherPort,
  IAutomationEventPublisherPort,
  CreateWorkflowDTO,
  TriggerWorkflowDTO,
} from "../ports/automation.ports";
import { WorkflowDomain } from "../domain/automation.domain";

export class AutomationUseCases implements IAutomationUseCases {
  constructor(
    private readonly repoPort: IAutomationRepositoryPort,
    private readonly actionDispatcher: IActionDispatcherPort,
    private readonly eventPublisher: IAutomationEventPublisherPort
  ) {}

  public async createWorkflow(dto: CreateWorkflowDTO): Promise<WorkflowDomain> {
    const wf = new WorkflowDomain(
      "wf_" + Math.random().toString(36).substring(2, 9),
      dto.companyId,
      dto.name,
      dto.triggerType,
      true,
      dto.actions,
      0,
      0,
      new Date()
    );

    const saved = await this.repoPort.save(wf);

    await this.eventPublisher.publishEvent("automation.workflow.created", {
      workflowId: saved.id,
      companyId: saved.companyId,
      name: saved.name,
    });

    return saved;
  }

  public async triggerWorkflows(
    dto: TriggerWorkflowDTO
  ): Promise<{ executedCount: number; results: Array<{ workflowId: string; success: boolean }> }> {
    const workflows = await this.repoPort.findMatchingWorkflows(dto.companyId, dto.triggerType);
    const results: Array<{ workflowId: string; success: boolean }> = [];

    for (const wf of workflows) {
      let wfSuccess = true;
      for (const action of wf.actions) {
        const ok = await this.actionDispatcher.dispatchAction(action.type, action.config, dto.payload);
        if (!ok) {
          wfSuccess = false;
          break;
        }
      }

      const updated = wf.recordExecution(wfSuccess);
      await this.repoPort.save(updated);

      results.push({ workflowId: wf.id, success: wfSuccess });

      await this.eventPublisher.publishEvent("automation.workflow.executed", {
        workflowId: wf.id,
        success: wfSuccess,
      });
    }

    return { executedCount: workflows.length, results };
  }

  public async getWorkflowStats(workflowId: string): Promise<{ total: number; failed: number; successRate: number }> {
    const wf = await this.repoPort.findById(workflowId);
    if (!wf) throw new Error(`Workflow ${workflowId} no encontrado`);

    return {
      total: wf.totalExecutions,
      failed: wf.failedExecutions,
      successRate: wf.successRate,
    };
  }
}
