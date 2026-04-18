"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ─── Get Employees ────────────────────────────────────────────────────────────
export async function getEmployees(includeInactive = false) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        const employees = await prisma.employee.findMany({
            where: {
                companyId: session.user.companyId,
                ...(includeInactive ? {} : { isActive: true }),
            },
            include: {
                benefits: { where: { isActive: true } },
                _count: { select: { payrolls: true } },
            },
            orderBy: [{ department: "asc" }, { firstName: "asc" }],
        });

        return { success: true, data: employees };
    } catch (error) {
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

        const employee = await prisma.employee.create({
            data: {
                ...data,
                companyId: session.user.companyId,
                baseSalary: Number(data.baseSalary),
                joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
                birthDate: data.birthDate ? new Date(data.birthDate) : null,
                ptoDays: data.ptoDays || 15,
                riskLevel: data.riskLevel || 1,
                isActive: true,
            },
        });

        revalidatePath("/dashboard/admin/payroll");
        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true, employee };
    } catch (error: any) {
        console.error("[CREATE_EMPLOYEE]", error);
        if (error.code === "P2002") return { success: false, error: "Ya existe un empleado con ese documento." };
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
        const updated = await prisma.employee.update({
            where: { id, companyId: session.user.companyId },
            data: {
                ...rest,
                ...(joiningDate ? { joiningDate: new Date(joiningDate) } : {}),
                ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
            },
        });

        revalidatePath("/dashboard/admin/payroll");
        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true, employee: updated };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ─── Delete (Soft) Employee ───────────────────────────────────────────────────
export async function deactivateEmployee(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        // Check for pending payrolls
        const pending = await prisma.payroll.count({
            where: { employeeId: id, companyId: session.user.companyId, status: "PENDING" },
        });
        if (pending > 0) return { success: false, error: "El empleado tiene nóminas pendientes de pago." };

        await prisma.employee.update({
            where: { id, companyId: session.user.companyId },
            data: { isActive: false },
        });

        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function reactivateEmployee(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        await prisma.employee.update({
            where: { id, companyId: session.user.companyId },
            data: { isActive: true },
        });

        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ─── Employee Summary ─────────────────────────────────────────────────────────
export async function getEmployeeSummary(employeeId: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: null };

        const [employee, payrollHistory, benefits] = await Promise.all([
            prisma.employee.findUnique({ where: { id: employeeId, companyId: session.user.companyId } }),
            prisma.payroll.findMany({
                where: { employeeId, companyId: session.user.companyId },
                orderBy: { periodStart: "desc" },
                take: 12,
                select: { netPay: true, status: true, periodStart: true, periodEnd: true, id: true },
            }),
            prisma.employeeBenefit.findMany({
                where: { employeeId, companyId: session.user.companyId!, isActive: true },
            }),
        ]);

        if (!employee) return { success: false, data: null };

        const totalPaidYTD = payrollHistory.filter(p => p.status === "PAID").reduce((s, p) => s + p.netPay, 0);
        const monthlyBenefits = benefits.filter(b => b.frequency === "MONTHLY").reduce((s, b) => s + b.amount, 0);

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

        const benefit = await prisma.employeeBenefit.create({
            data: {
                ...data,
                companyId: session.user.companyId,
                startDate: data.startDate ? new Date(data.startDate) : new Date(),
                endDate: data.endDate ? new Date(data.endDate) : null,
            },
        });

        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true, data: benefit };
    } catch (error: any) {
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

        const { endDate, ...rest } = data;
        const benefit = await prisma.employeeBenefit.update({
            where: { id },
            data: { ...rest, ...(endDate ? { endDate: new Date(endDate) } : {}) },
        });

        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true, data: benefit };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteBenefit(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        await prisma.employeeBenefit.update({ where: { id }, data: { isActive: false } });

        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
