"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

// ─── Get Employees ────────────────────────────────────────────────────────────
export async function getEmployees(includeInactive = false) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        const response = await fetch(
            `${GATEWAY_URL}/api/employees?companyId=${session.user.companyId}${includeInactive ? "" : "&isActive=true"}&limit=1000`
        );
        const resData = await response.json();
        if (!response.ok) return { success: false, data: [] };

        return { success: true, data: resData.employees || [] };
    } catch (error) {
        console.error("[GET_EMPLOYEES]", error);
        return { success: false, data: [] };
    }
}

// ─── Create Employee (enhanced) ───────────────────────────────────────────────
export async function createEmployee(data: {
    firstName: string; lastName: string; documentType: string; documentNumber: string;
    email?: string; phone?: string; contractType: string; position: string;
    department?: string; baseSalary: number; joiningDate?: string;
    ptoDays?: number; riskLevel?: number;
    bankName?: string; bankAccount?: string; bankAccountType?: string;
    epsName?: string; epsNumber?: string; afpName?: string; afpNumber?: string;
    arlName?: string; compensationBox?: string;
    emergencyContactName?: string; emergencyContactPhone?: string; emergencyContactRel?: string;
    address?: string; city?: string; birthDate?: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/employees`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...data,
                companyId: session.user.companyId,
                baseSalary: Number(data.baseSalary),
                joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString() : null,
                birthDate: data.birthDate ? new Date(data.birthDate).toISOString() : null,
                ptoDays: data.ptoDays || 15,
                riskLevel: data.riskLevel || 1,
                isActive: true,
            }),
        });

        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to create employee" };

        revalidatePath("/dashboard/admin/payroll");
        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true, employee: resData.employee };
    } catch (error: any) {
        console.error("[CREATE_EMPLOYEE]", error);
        return { success: false, error: error.message };
    }
}

// ─── Update Employee ─────────────────────────────────────────────────────────
export async function updateEmployee(id: string, data: Partial<{
    firstName: string; lastName: string; documentType: string; documentNumber: string;
    email: string; phone: string; contractType: string; position: string;
    department: string; baseSalary: number; joiningDate: string; ptoDays: number;
    riskLevel: number; isActive: boolean;
    bankName: string; bankAccount: string; bankAccountType: string;
    epsName: string; epsNumber: string; afpName: string; afpNumber: string;
    arlName: string; compensationBox: string;
    emergencyContactName: string; emergencyContactPhone: string; emergencyContactRel: string;
    address: string; city: string; birthDate: string;
}>) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const { joiningDate, birthDate, ...rest } = data;
        const response = await fetch(`${GATEWAY_URL}/api/employees/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...rest,
                ...(joiningDate ? { joiningDate: new Date(joiningDate).toISOString() } : {}),
                ...(birthDate ? { birthDate: new Date(birthDate).toISOString() } : {}),
            }),
        });

        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to update employee" };

        revalidatePath("/dashboard/admin/payroll");
        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true, employee: resData.employee };
    } catch (error: any) {
        console.error("[UPDATE_EMPLOYEE]", error);
        return { success: false, error: error.message };
    }
}

// ─── Delete (Soft) Employee ───────────────────────────────────────────────────
export async function deactivateEmployee(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        // Check for pending payrolls locally (validation check)
        const pending = await prisma.payroll.count({
            where: { employeeId: id, companyId: session.user.companyId, status: "PENDING" },
        });
        if (pending > 0) return { success: false, error: "El empleado tiene nóminas pendientes de pago." };

        const response = await fetch(`${GATEWAY_URL}/api/employees/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: false }),
        });

        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to deactivate employee" };

        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true };
    } catch (error: any) {
        console.error("[DEACTIVATE_EMPLOYEE]", error);
        return { success: false, error: error.message };
    }
}

export async function reactivateEmployee(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/employees/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: true }),
        });

        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to reactivate employee" };

        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true };
    } catch (error: any) {
        console.error("[REACTIVATE_EMPLOYEE]", error);
        return { success: false, error: error.message };
    }
}

// ─── Employee Summary ─────────────────────────────────────────────────────────
export async function getEmployeeSummary(employeeId: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: null };

        const response = await fetch(`${GATEWAY_URL}/api/employees/${employeeId}/summary?companyId=${session.user.companyId}`);
        if (!response.ok) return { success: false, data: null };

        const resData = await response.json();
        const { employee, payrollHistory, benefits } = resData;

        if (!employee) return { success: false, data: null };

        const totalPaidYTD = payrollHistory.filter((p: any) => p.status === "PAID").reduce((s: number, p: any) => s + p.netPay, 0);
        const monthlyBenefits = benefits.filter((b: any) => b.frequency === "MONTHLY").reduce((s: number, b: any) => s + b.amount, 0);

        // Approximate employer cost
        const employerContribRate = 0.30; // ~30% for all parafiscales
        const employerMonthlyExtraCost = employee.baseSalary * employerContribRate;

        return {
            success: true,
            data: {
                employee,
                payrollHistory,
                benefits,
                totalPaidYTD,
                monthlyBenefits,
                totalEmployerCost: employee.baseSalary + employerMonthlyExtraCost + monthlyBenefits,
                employerContribEstimate: employerMonthlyExtraCost,
            },
        };
    } catch (error) {
        console.error("[GET_EMPLOYEE_SUMMARY]", error);
        return { success: false, data: null };
    }
}

// ─── Employee Benefits CRUD ───────────────────────────────────────────────────
export async function createBenefit(data: {
    employeeId: string;
    name: string;
    amount: number;
    frequency: string;
    description?: string;
    startDate?: string;
    endDate?: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/hr/benefits`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...data,
                companyId: session.user.companyId,
            }),
        });

        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to create benefit" };

        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true, data: resData.data };
    } catch (error: any) {
        console.error("[CREATE_BENEFIT]", error);
        return { success: false, error: error.message };
    }
}

export async function updateBenefit(id: string, data: Partial<{
    name: string; amount: number; frequency: string; description: string;
    isActive: boolean; endDate: string;
}>) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/hr/benefits/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to update benefit" };

        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true, data: resData.data };
    } catch (error: any) {
        console.error("[UPDATE_BENEFIT]", error);
        return { success: false, error: error.message };
    }
}

export async function deleteBenefit(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/hr/benefits/${id}`, {
            method: "DELETE",
        });

        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to delete benefit" };

        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true };
    } catch (error: any) {
        console.error("[DELETE_BENEFIT]", error);
        return { success: false, error: error.message };
    }
}
