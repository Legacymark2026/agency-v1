/**
 * Project Service — Prisma Persistence Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { prisma } from "@agency/database";
import { IProjectRepositoryPort } from "../core/ports/project.ports";
import { ProjectDomain } from "../core/domain/project.domain";

export class PrismaProjectAdapter implements IProjectRepositoryPort {
  public async save(project: ProjectDomain): Promise<ProjectDomain> {
    try {
      await (prisma as any).project.upsert({
        where: { id: project.id },
        update: {
          name: project.name,
          description: project.description,
          status: project.status,
          budget: project.budget,
        },
        create: {
          id: project.id,
          companyId: project.companyId,
          name: project.name,
          description: project.description,
          status: project.status,
          budget: project.budget,
        },
      });
    } catch {}
    return project;
  }

  public async findById(id: string): Promise<ProjectDomain | null> {
    try {
      const row = await (prisma as any).project.findUnique({ where: { id } });
      if (!row) return null;
      return new ProjectDomain(
        row.id,
        row.companyId,
        row.name,
        row.description || "",
        row.status || "PLANNING",
        row.budget || 0,
        [],
        row.createdAt
      );
    } catch {
      return null;
    }
  }

  public async findByCompany(companyId: string): Promise<ProjectDomain[]> {
    try {
      const rows = await (prisma as any).project.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
      });
      return rows.map((r: any) => new ProjectDomain(
        r.id,
        r.companyId,
        r.name,
        r.description || "",
        r.status || "PLANNING",
        r.budget || 0,
        [],
        r.createdAt
      ));
    } catch {
      return [];
    }
  }
}
