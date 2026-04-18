"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getOperationsDashboardData() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Get the user's company
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companies: { select: { companyId: true } } }
    });

    // Fallback logic
    let companyId = user?.companies[0]?.companyId;
    if (!companyId) {
      const firstCompany = await prisma.company.findFirst();
      if (!firstCompany) return { success: false, error: "No company found" };
      companyId = firstCompany.id;
    }

    // 1. Projects Data
    const projects = await prisma.kanbanProject.findMany({
      where: { companyId, status: "ACTIVE" },
      include: {
        kanbanTasks: {
          select: { id: true, status: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    const activeProjectCount = projects.length;
    let projectsAtRiskCount = 0;

    const formattedProjects = projects.map(p => {
      if (p.healthScore < 50) projectsAtRiskCount++;
      
      const totalTasks = p.kanbanTasks.length;
      const doneTasks = p.kanbanTasks.filter(t => t.status === "DONE").length;
      const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

      return {
        id: p.id,
        name: p.name,
        healthScore: p.healthScore, // <50 At Risk, 50-80 Monitor, >80 Healthy
        progress,
        spentAmount: p.spentAmount,
      };
    });

    // 2. Team Active Time (Live Attendance Mock / Or query from TimeEntries)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const activeTimeEntries = await prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        startedAt: { gte: startOfDay },
        endedAt: null
      }
    });
    
    const isClockedIn = activeTimeEntries.length > 0;
    const currentSession = isClockedIn ? activeTimeEntries[0] : null;

    // Optional: Query overall Team Status if necessary
    // For now we pass basic counts
    const activeUsersCount = await prisma.user.count({
      where: {
        timeEntries: {
          some: {
            endedAt: null
          }
        }
      }
    });

    return {
      success: true,
      data: {
        kpis: {
          activeProjects: activeProjectCount,
          projectsAtRisk: projectsAtRiskCount,
          avgVelocity: "4.2", // Mocked for now
          teamUtilization: "82", // Mocked for now
        },
        projects: formattedProjects,
        attendance: {
          isClockedIn,
          currentSessionId: currentSession?.id || null,
          startTime: currentSession?.startedAt || null,
          activeUsersCount,
        }
      }
    };

  } catch (error) {
    console.error("Ops Dashboard Fetch Error:", error);
    return { success: false, error: "Internal Fetch Error" };
  }
}
