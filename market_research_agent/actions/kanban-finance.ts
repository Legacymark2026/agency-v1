"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/** Get financials for a single task: horas × tarifa = costo real vs presupuesto */
export async function getTaskFinancials(taskId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, data: null };

    const task = await prisma.kanbanTask.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        estimatedHours: true,
        costPerHour: true,
        budgetCap: true,
        assignee: {
          select: {
            id: true, name: true,
            // Employee hourly rate from payroll if available
            employees: { select: { baseSalary: true, contractType: true }, take: 1 },
          },
        },
        timeEntries: {
          select: { duration: true, startedAt: true, endedAt: true, userId: true },
        },
      } as any,
    });

    if (!task) return { success: false, data: null };

    // Total logged seconds → hours
    const totalSeconds = (task as any).timeEntries?.reduce((s: number, e: any) => s + (e.duration || 0), 0) || 0;
    const loggedHours = totalSeconds / 3600;

    // Cost per hour: override > assignee salary (monthly÷160) > default 25 USD/h
    let hourlyRate: number = (task as any).costPerHour || 25;
    if (!task.costPerHour && (task as any).assignee?.employees?.[0]) {
      const emp = (task as any).assignee.employees[0];
      hourlyRate = emp.baseSalary / 160; // ~160 working hours/month
    }

    const actualCost = loggedHours * hourlyRate;
    const budgetCap: number = (task as any).budgetCap || (task.estimatedHours || 0) * hourlyRate;
    const burnPct = budgetCap > 0 ? Math.min(150, (actualCost / budgetCap) * 100) : 0;

    let alertLevel: "ok" | "warning" | "danger" = "ok";
    if (burnPct >= 90) alertLevel = "danger";
    else if (burnPct >= 70) alertLevel = "warning";

    return {
      success: true,
      data: {
        loggedHours: Math.round(loggedHours * 100) / 100,
        estimatedHours: task.estimatedHours || 0,
        hourlyRate,
        actualCost: Math.round(actualCost * 100) / 100,
        budgetCap: Math.round(budgetCap * 100) / 100,
        burnPct: Math.round(burnPct),
        alertLevel,
      },
    };
  } catch (err: any) {
    return { success: false, data: null, error: err.message };
  }
}

/** Project-level burn rate overview */
export async function getProjectBurnRate(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, data: null };

    const project = await prisma.kanbanProject.findUnique({
      where: { id: projectId },
      select: {
        id: true, name: true, budget: true, spentAmount: true,
        kanbanTasks: {
          where: { archived: false } as any,
          select: {
            id: true, title: true, estimatedHours: true, costPerHour: true, budgetCap: true, status: true,
            timeEntries: { select: { duration: true } },
          },
        },
      },
    });

    if (!project) return { success: false, data: null };

    const taskSummaries = project.kanbanTasks.map((t: any) => {
      const hrs = t.timeEntries.reduce((s: number, e: any) => s + (e.duration || 0), 0) / 3600;
      const rate = t.costPerHour || 25;
      return { id: t.id, title: t.title, loggedHours: hrs, cost: hrs * rate, status: t.status };
    });

    const totalCost = taskSummaries.reduce((s: number, t: any) => s + t.cost, 0);
    const budget = project.budget || 0;
    const burnPct = budget > 0 ? Math.min(150, (totalCost / budget) * 100) : 0;

    return {
      success: true,
      data: {
        projectName: project.name,
        budget,
        totalCost: Math.round(totalCost * 100) / 100,
        burnPct: Math.round(burnPct),
        alertLevel: burnPct >= 90 ? "danger" : burnPct >= 70 ? "warning" : "ok",
        taskSummaries,
      },
    };
  } catch (err: any) {
    return { success: false, data: null, error: err.message };
  }
}

/** Export timesheets as CSV-formatted string for a project/month */
export async function exportTimesheetReport(projectId: string, year: number, month: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, csv: "" };

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const entries = await prisma.timeEntry.findMany({
      where: {
        kanbanTask: { projectId },
        startedAt: { gte: start, lte: end },
      },
      include: {
        kanbanTask: { select: { title: true, status: true } },
        user: { select: { name: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { startedAt: "asc" },
    });

    const rows = [
      ["Fecha", "Usuario", "Email", "Tarea", "Estado", "Horas", "Duración (min)"].join(","),
      ...entries.map((e) => {
        const hrs = Math.round((e.duration / 3600) * 100) / 100;
        const mins = Math.round(e.duration / 60);
        const userName = (e.user as any).firstName
          ? `${(e.user as any).firstName} ${(e.user as any).lastName}`
          : e.user.name || e.user.email;
        return [
          new Date(e.startedAt).toLocaleDateString("es"),
          userName,
          e.user.email,
          `"${(e.kanbanTask as any).title}"`,
          (e.kanbanTask as any).status,
          hrs,
          mins,
        ].join(",");
      }),
    ];

    return { success: true, csv: rows.join("\n"), filename: `reporte_horas_${year}_${String(month).padStart(2, "0")}.csv` };
  } catch (err: any) {
    return { success: false, csv: "", error: err.message };
  }
}
