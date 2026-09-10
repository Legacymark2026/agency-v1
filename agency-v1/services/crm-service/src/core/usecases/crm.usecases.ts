/**
 * CRM Service — Pure Hexagonal Use Cases Orchestration
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  ICrmUseCases,
  ICrmLeadRepositoryPort,
  ICrmEventPublisherPort,
  CreateLeadDTO,
} from "../ports/crm.ports";
import {
  LeadDomain,
  evaluateCondition,
  evaluateScoringRule,
} from "../domain/crm.domain";

export class CrmUseCases implements ICrmUseCases {
  constructor(
    private readonly repoPort: ICrmLeadRepositoryPort,
    private readonly eventPublisher: ICrmEventPublisherPort
  ) {}

  public async createLead(dto: CreateLeadDTO): Promise<LeadDomain> {
    const lead = new LeadDomain(
      "lead_" + Math.random().toString(36).substring(2, 9),
      dto.companyId,
      dto.email,
      dto.fullName,
      0,
      undefined,
      "NEW",
      dto.formData || {},
      new Date()
    );

    const saved = await this.repoPort.saveLead(lead);

    await this.eventPublisher.publishCrmEvent("crm.lead.created", {
      leadId: saved.id,
      companyId: saved.companyId,
      email: saved.email,
    });

    return this.assignLead(saved.id);
  }

  public async assignLead(leadId: string): Promise<LeadDomain> {
    const lead = await this.repoPort.findLeadById(leadId);
    if (!lead) throw new Error(`Lead ${leadId} no encontrado`);

    const rules = await this.repoPort.findActiveRules(lead.companyId);
    let assignedUserId: string | null = null;

    for (const rule of rules) {
      const matches = rule.conditions.length > 0 && rule.conditions.every((cond) =>
        evaluateCondition(lead, cond)
      );

      if (matches) {
        if (rule.useRoundRobin && rule.targetAgentIds.length > 0) {
          const currentIndex = await this.repoPort.getRoundRobinIndex(lead.companyId, rule.id);
          const nextIndex = (currentIndex + 1) % rule.targetAgentIds.length;
          assignedUserId = rule.targetAgentIds[currentIndex % rule.targetAgentIds.length];
          await this.repoPort.setRoundRobinIndex(lead.companyId, rule.id, nextIndex);
        } else if (rule.assignedUserId) {
          assignedUserId = rule.assignedUserId;
        }
        break;
      }
    }

    if (!assignedUserId) {
      const agents = await this.repoPort.getCompanyAgentIds(lead.companyId);
      if (agents.length > 0) {
        assignedUserId = agents[0];
      }
    }

    if (assignedUserId) {
      const assigned = lead.assignToAgent(assignedUserId);
      const updated = await this.repoPort.saveLead(assigned);

      await this.eventPublisher.publishCrmEvent("crm.lead.assigned", {
        leadId: updated.id,
        companyId: updated.companyId,
        assignedTo: assignedUserId,
      });

      return updated;
    }

    return lead;
  }

  public async scoreLead(
    leadId: string,
    rules: Array<{ field: string; op: string; val: string; points: number }>
  ): Promise<LeadDomain> {
    const lead = await this.repoPort.findLeadById(leadId);
    if (!lead) throw new Error(`Lead ${leadId} no encontrado`);

    let score = 0;
    for (const r of rules) {
      const val = (lead as any)[r.field] ?? lead.formData[r.field];
      if (evaluateScoringRule(val, r.op, r.val)) {
        score += r.points;
      }
    }

    const updated = lead.updateScore(score);
    await this.repoPort.saveLead(updated);

    await this.eventPublisher.publishCrmEvent("crm.lead.scored", {
      leadId: updated.id,
      score: updated.score,
    });

    return updated;
  }
}
