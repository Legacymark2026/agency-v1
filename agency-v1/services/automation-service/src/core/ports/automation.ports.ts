/**
 * Automation Service — Hexagonal Ports (Inbound & Outbound Interfaces)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { WorkflowDomain } from "../domain/automation.domain";

export interface CreateWorkflowDTO {
  companyId: string;
  name: string;
  triggerType: string;
  actions: Array<{ type: string; config: Record<string, any> }>;
}

export interface TriggerWorkflowDTO {
  triggerType: string;
  companyId: string;
  payload: Record<string, any>;
}

// Inbound Port: Primary Use Cases
export interface IAutomationUseCases {
  createWorkflow(dto: CreateWorkflowDTO): Promise<WorkflowDomain>;
  triggerWorkflows(dto: TriggerWorkflowDTO): Promise<{ executedCount: number; results: Array<{ workflowId: string; success: boolean }> }>;
  getWorkflowStats(workflowId: string): Promise<{ total: number; failed: number; successRate: number }>;
}

// Outbound Port: Persistence
export interface IAutomationRepositoryPort {
  save(wf: WorkflowDomain): Promise<WorkflowDomain>;
  findById(id: string): Promise<WorkflowDomain | null>;
  findMatchingWorkflows(companyId: string, triggerType: string): Promise<WorkflowDomain[]>;
}

// Outbound Port: Action Dispatcher (Email / Webhook / DB)
export interface IActionDispatcherPort {
  dispatchAction(actionType: string, config: Record<string, any>, context: Record<string, any>): Promise<boolean>;
}

// Outbound Port: Event Publisher
export interface IAutomationEventPublisherPort {
  publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}
