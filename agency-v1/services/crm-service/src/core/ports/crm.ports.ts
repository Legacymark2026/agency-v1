/**
 * CRM Service — Hexagonal Ports (Inbound & Outbound Interfaces)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { LeadDomain, LeadCondition } from "../domain/crm.domain";

export interface CreateLeadDTO {
  companyId: string;
  email: string;
  fullName?: string;
  formData?: Record<string, any>;
}

export interface AssignmentRuleDomain {
  id: string;
  companyId: string;
  name: string;
  priority: number;
  isActive: boolean;
  conditions: LeadCondition[];
  assignedUserId?: string;
  useRoundRobin: boolean;
  targetAgentIds: string[];
}

// Inbound Port: Primary Use Cases
export interface ICrmUseCases {
  createLead(dto: CreateLeadDTO): Promise<LeadDomain>;
  assignLead(leadId: string): Promise<LeadDomain>;
  scoreLead(leadId: string, rules: Array<{ field: string; op: string; val: string; points: number }>): Promise<LeadDomain>;
}

// Outbound Port: Repository Persistence
export interface ICrmLeadRepositoryPort {
  saveLead(lead: LeadDomain): Promise<LeadDomain>;
  findLeadById(id: string): Promise<LeadDomain | null>;
  findActiveRules(companyId: string): Promise<AssignmentRuleDomain[]>;
  getRoundRobinIndex(companyId: string, ruleId: string): Promise<number>;
  setRoundRobinIndex(companyId: string, ruleId: string, nextIndex: number): Promise<void>;
  getCompanyAgentIds(companyId: string): Promise<string[]>;
}

// Outbound Port: Event Bus
export interface ICrmEventPublisherPort {
  publishCrmEvent(topic: string, event: Record<string, any>): Promise<void>;
}
