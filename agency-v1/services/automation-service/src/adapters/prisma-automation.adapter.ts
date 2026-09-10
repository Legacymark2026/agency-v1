/**
 * Automation Service — Prisma Persistence Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { prisma } from "@agency/database";
import { IAutomationRepositoryPort } from "../core/ports/automation.ports";
import { WorkflowDomain } from "../core/domain/automation.domain";

export class PrismaAutomationAdapter implements IAutomationRepositoryPort {
  public async save(wf: WorkflowDomain): Promise<WorkflowDomain> {
    try {
      await (prisma as any).workflow.upsert({
        where: { id: wf.id },
        update: {
          name: wf.name,
          isActive: wf.isActive,
        },
        create: {
          id: wf.id,
          companyId: wf.companyId,
          name: wf.name,
          triggerType: wf.triggerType,
          isActive: wf.isActive,
        },
      });
    } catch {}
    return wf;
  }

  public async findById(id: string): Promise<WorkflowDomain | null> {
    try {
      const row = await (prisma as any).workflow.findUnique({ where: { id } });
      if (!row) return null;
      return new WorkflowDomain(
        row.id,
        row.companyId,
        row.name,
        row.triggerType,
        row.isActive,
        [],
        0,
        0,
        row.createdAt
      );
    } catch {
      return null;
    }
  }

  public async findMatchingWorkflows(companyId: string, triggerType: string): Promise<WorkflowDomain[]> {
    try {
      const rows = await (prisma as any).workflow.findMany({
        where: { companyId, triggerType, isActive: true },
      });
      return rows.map((r: any) => new WorkflowDomain(
        r.id,
        r.companyId,
        r.name,
        r.triggerType,
        r.isActive,
        typeof r.actions === "string" ? JSON.parse(r.actions) : (r.actions || [])
      ));
    } catch {
      return [];
    }
  }
}
