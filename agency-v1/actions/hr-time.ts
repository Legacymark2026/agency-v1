"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REVALIDATE_TIMEOFF = "/dashboard/admin/payroll/time-off";
const REVALIDATE_TIMESHEETS = "/dashboard/admin/payroll/timesheets";

async function getSession() {
    const session = await auth();
    if (!session?.user?.companyId) throw new Error("No autenticado.");
    return session;
}

// ══════════════════════════════════════════════════════════════
// TIME OFF REQUESTS
// ══════════════════════════════════════════════════════════════

export async function getTimeOffRequests(companyId: string) {
    return prisma.timeOffRequest.findMany({
        where: { employee: { companyId } },
        include: { 
            employee: { select: { id: true, firstName: true, lastName: true, position: true } },
            approvedBy: { select: { id: true, firstName: true, lastName: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function updateTimeOffStatus(id: string, status: "APPROVED" | "REJECTED") {
    const session = await getSession();
    
    const request = await prisma.timeOffRequest.update({
        where: { id },
        data: { 
            status,
            approvedById: session.user.id
        }
    });

    revalidatePath(REVALIDATE_TIMEOFF);
    return { success: true, request };
}

export async function createTimeOffRequest(data: {
    employeeId: string;
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
}) {
    await getSession();
    
    const request = await prisma.timeOffRequest.create({
        data: {
            employeeId: data.employeeId,
            type: data.type,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            reason: data.reason,
            status: "PENDING"
        }
    });

    revalidatePath(REVALIDATE_TIMEOFF);
    return { success: true, request };
}

// ══════════════════════════════════════════════════════════════
// TIMESHEETS
// ══════════════════════════════════════════════════════════════

export async function getTimesheets(companyId: string) {
    return prisma.timesheet.findMany({
        where: { employee: { companyId } },
        include: { 
            employee: { select: { id: true, firstName: true, lastName: true, position: true } },
            approvedBy: { select: { id: true, firstName: true, lastName: true, name: true } },
            _count: { select: { timeEntries: true } }
        },
        orderBy: { periodStart: "desc" },
    });
}

export async function updateTimesheetStatus(id: string, status: "APPROVED" | "REJECTED" | "SUBMITTED") {
    const session = await getSession();
    
    const data: any = { status };
    if (status === "APPROVED" || status === "REJECTED") {
        data.approvedById = session.user.id;
    }
    
    const sheet = await prisma.timesheet.update({
        where: { id },
        data
    });

    revalidatePath(REVALIDATE_TIMESHEETS);
    return { success: true, sheet };
}
