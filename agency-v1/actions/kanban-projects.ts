"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const REVALIDATE = () => revalidatePath("/dashboard/admin/operations/kanban");

async function resolveCompanyId(userId: string): Promise<string | null> {
  // Try CompanyUser junction table first (correct approach)
  const cu = await prisma.companyUser.findFirst({
    where: { userId },
    select: { companyId: true },
  });
  if (cu?.companyId) return cu.companyId;

  // Fallback: first company in the system
  const first = await prisma.company.findFirst({ select: { id: true } });
  return first?.id ?? null;
}

export async function createKanbanProject(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const name = (formData.get("name") as string) || "Gestión Operativa";
    const description = formData.get("description") as string;
    const budgetRaw = formData.get("budget");
    const budget = budgetRaw ? parseFloat(budgetRaw as string) : null;

    const companyId = await resolveCompanyId(session.user.id);
    if (!companyId) return { success: false, error: "No se encontró empresa." };

    const project = await prisma.kanbanProject.create({
      data: { name, description, budget, companyId, status: "ACTIVE", healthScore: 100 },
    });

    // Note: wipLimit column requires migration. Omit until `prisma db push` runs.
    await prisma.kanbanSwimlane.createMany({
      data: [
        { name: "Backlog", projectId: project.id, order: 0 },
        { name: "Sprint Activo", projectId: project.id, order: 1 },
        { name: "Revisión / Bloqueados", projectId: project.id, order: 2 },
      ],
    });

    REVALIDATE();
    return { success: true, project };
  } catch (err: any) {
    console.error("[createKanbanProject]", err);
    return { success: false, error: err.message || "Failed to create project." };
  }
}

export async function listKanbanProjects() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, projects: [] };

    const companyId = await resolveCompanyId(session.user.id);

    const projects = await prisma.kanbanProject.findMany({
      where: companyId ? { companyId } : {},
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { swimlanes: true } } },
    });
    return { success: true, projects };
  } catch (err: any) {
    return { success: false, projects: [] };
  }
}

export async function ensureDefaultProject() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const existing = await prisma.kanbanProject.findFirst({});
    if (existing) return { success: true, project: existing };

    const fd = new FormData();
    fd.set("name", "Gestión Operativa");
    fd.set("description", "Proyecto operativo principal de la agencia");
    return createKanbanProject(fd);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateKanbanProject(projectId: string, data: { name?: string; description?: string; budget?: number | null }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const project = await prisma.kanbanProject.update({
      where: { id: projectId },
      data
    });
    REVALIDATE();
    return { success: true, project };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteKanbanProject(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await prisma.kanbanProject.delete({
      where: { id: projectId }
    });
    REVALIDATE();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
