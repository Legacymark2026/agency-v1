"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

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
    try {
        const response = await fetch(`${GATEWAY_URL}/api/hr/time-off?companyId=${companyId}`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error("[GET_TIME_OFF_REQUESTS]", error);
        return [];
    }
}

export async function updateTimeOffStatus(id: string, status: "APPROVED" | "REJECTED") {
    const session = await getSession();
    
    try {
        const response = await fetch(`${GATEWAY_URL}/api/hr/time-off/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status,
                approvedById: session.user.id
            })
        });

        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || "Failed to update time off status");

        revalidatePath(REVALIDATE_TIMEOFF);
        return { success: true, request: resData.request };
    } catch (error: any) {
        console.error("[UPDATE_TIME_OFF_STATUS]", error);
        return { success: false, error: error.message };
    }
}

export async function createTimeOffRequest(data: {
    employeeId: string;
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
}) {
    await getSession();
    
    try {
        const response = await fetch(`${GATEWAY_URL}/api/hr/time-off`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || "Failed to create time off request");

        revalidatePath(REVALIDATE_TIMEOFF);
        return { success: true, request: resData.request };
    } catch (error: any) {
        console.error("[CREATE_TIME_OFF_REQUEST]", error);
        return { success: false, error: error.message };
    }
}

// ══════════════════════════════════════════════════════════════
// TIMESHEETS
// ══════════════════════════════════════════════════════════════

export async function getTimesheets(companyId: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/hr/timesheets?companyId=${companyId}`);
        if (!response.ok) return [];
        const resData = await response.json();
        return resData.timesheets || [];
    } catch (error) {
        console.error("[GET_TIMESHEETS]", error);
        return [];
    }
}

export async function updateTimesheetStatus(id: string, status: "APPROVED" | "REJECTED" | "SUBMITTED") {
    const session = await getSession();
    
    const body: any = { status };
    if (status === "APPROVED" || status === "REJECTED") {
        body.approvedById = session.user.id;
    }
    
    try {
        const response = await fetch(`${GATEWAY_URL}/api/hr/timesheets/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || "Failed to update timesheet status");

        revalidatePath(REVALIDATE_TIMESHEETS);
        return { success: true, sheet: resData.sheet };
    } catch (error: any) {
        console.error("[UPDATE_TIMESHEET_STATUS]", error);
        return { success: false, error: error.message };
    }
}
