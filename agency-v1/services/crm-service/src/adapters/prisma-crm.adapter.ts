/**
 * CRM Service — Prisma Infrastructure Adapter (Driven Outbound Port)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { prisma } from "@agency/database";
import { ICrmLeadRepositoryPort, AssignmentRuleDomain } from "../core/ports/crm.ports";
import { LeadDomain } from "../core/domain/crm.domain";

export class PrismaCrmAdapter implements ICrmLeadRepositoryPort {
  public async saveLead(lead: LeadDomain): Promise<LeadDomain> {
    try {
      await (prisma as any).lead.upsert({
        where: { id: lead.id },
        update: {
          assignedTo: lead.assignedTo,
          score: lead.score,
          status: lead.status,
          formData: lead.formData,
        },
        create: {
          id: lead.id,
          companyId: lead.companyId,
          email: lead.email,
          fullName: lead.fullName,
          assignedTo: lead.assignedTo,
          score: lead.score,
          status: lead.status,
          formData: lead.formData,
        },
      });
    } catch {}
    return lead;
  }

  public async findLeadById(id: string): Promise<LeadDomain | null> {
    try {
      const row = await (prisma as any).lead.findUnique({ where: { id } });
      if (!row) return null;
      return new LeadDomain(
        row.id,
        row.companyId,
        row.email,
        row.fullName,
        row.score || 0,
        row.assignedTo || undefined,
        row.status || "NEW",
        typeof row.formData === "string" ? JSON.parse(row.formData) : (row.formData || {}),
        row.createdAt
      );
    } catch {
      return null;
    }
  }

  public async findActiveRules(companyId: string): Promise<AssignmentRuleDomain[]> {
    try {
      const rows = await (prisma as any).leadAssignmentRule.findMany({
        where: { companyId, isActive: true },
        orderBy: { priority: "asc" },
      });
      return rows.map((r: any) => ({
        id: r.id,
        companyId: r.companyId,
        name: r.name,
        priority: r.priority,
        isActive: r.isActive,
        conditions: typeof r.conditions === "string" ? JSON.parse(r.conditions) : (r.conditions || []),
        assignedUserId: r.assignedUserId,
        useRoundRobin: !!r.useRoundRobin,
        targetAgentIds: typeof r.targetAgentIds === "string" ? JSON.parse(r.targetAgentIds) : (r.targetAgentIds || []),
      }));
    } catch {
      return [];
    }
  }

  public async getRoundRobinIndex(companyId: string, ruleId: string): Promise<number> {
    try {
      const state = await (prisma as any).leadAssignmentRoundRobinState.findUnique({
        where: { companyId_ruleId: { companyId, ruleId } },
      });
      return state?.lastAssignedIndex ?? 0;
    } catch {
      return 0;
    }
  }

  public async setRoundRobinIndex(companyId: string, ruleId: string, nextIndex: number): Promise<void> {
    try {
      await (prisma as any).leadAssignmentRoundRobinState.upsert({
        where: { companyId_ruleId: { companyId, ruleId } },
        update: { lastAssignedIndex: nextIndex },
        create: { companyId, ruleId, lastAssignedIndex: nextIndex },
      });
    } catch {}
  }

  public async getCompanyAgentIds(companyId: string): Promise<string[]> {
    try {
      const users = await (prisma as any).companyUser.findMany({
        where: { companyId },
        select: { userId: true },
      });
      return users.map((u: any) => u.userId);
    } catch {
      return [];
    }
  }
}
