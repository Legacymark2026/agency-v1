"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

// Helper: Safely resolve companyId for any logged-in user (including SUPER_ADMIN / ADMIN)
async function resolveCompanyId(session: any): Promise<string | null> {
    if (session?.user?.companyId) return session.user.companyId;
    if (!session?.user?.id) return null;

    try {
        const membership = await (prisma as any).companyUser.findFirst({
            where: { userId: session.user.id },
            select: { companyId: true }
        });
        if (membership?.companyId) return membership.companyId;

        const company = await (prisma as any).company.findFirst({ select: { id: true } });
        if (company?.id) return company.id;
    } catch {
        // Fallback
    }

    return null;
}

// ─── Get Employees ────────────────────────────────────────────────────────────
export async function getEmployees(includeInactive = false) {
    try {
        const session = await auth();
        if (!session?.user) return { success: false, data: [] };

        const companyId = await resolveCompanyId(session);
        if (!companyId) return { success: false, data: [] };

        // Attempt API Gateway first
        try {
            const response = await fetch(
                `${GATEWAY_URL}/api/employees?companyId=${companyId}${includeInactive ? "" : "&isActive=true"}&limit=1000`
            );
            if (response.ok) {
                const resData = await response.json();
                return { success: true, data: resData.employees || [] };
            }
        } catch {
            // Gateway fallback
        }

        // Direct Prisma DB Fallback
        const employees = await prisma.employee.findMany({
            where: {
                companyId,
                ...(includeInactive ? {} : { isActive: true })
            },
            orderBy: { createdAt: "desc" }
        });

        return { success: true, data: employees || [] };
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
        if (!session?.user) return { success: false, error: "No autenticado. Inicie sesión nuevamente." };

        const companyId = await resolveCompanyId(session);
        if (!companyId) return { success: false, error: "No se encontró una empresa activa configurada en el sistema." };

        // Attempt API Gateway
        try {
            const response = await fetch(`${GATEWAY_URL}/api/employees`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    companyId,
                    baseSalary: Number(data.baseSalary),
                    joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString() : null,
                    birthDate: data.birthDate ? new Date(data.birthDate).toISOString() : null,
                    ptoDays: data.ptoDays || 15,
                    riskLevel: data.riskLevel || 1,
                    isActive: true,
                }),
            });

            if (response.ok) {
                const resData = await response.json();
                revalidatePath("/dashboard/admin/payroll");
                revalidatePath("/dashboard/admin/payroll/employees");
                return { success: true, employee: resData.employee };
            }
        } catch {
            // Gateway fallback
        }

        // Direct Prisma DB Fallback
        const employee = await prisma.employee.create({
            data: {
                companyId,
                firstName: data.firstName,
                lastName: data.lastName,
                documentType: data.documentType,
                documentNumber: data.documentNumber,
                email: data.email || null,
                phone: data.phone || null,
                contractType: data.contractType,
                position: data.position,
                department: data.department || null,
                baseSalary: Number(data.baseSalary),
                joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
                birthDate: data.birthDate ? new Date(data.birthDate) : null,
                ptoDays: data.ptoDays || 15,
                riskLevel: data.riskLevel || 1,
                isActive: true,
                bankName: data.bankName || null,
                bankAccount: data.bankAccount || null,
                bankAccountType: data.bankAccountType || null,
                epsName: data.epsName || null,
                epsNumber: data.epsNumber || null,
                afpName: data.afpName || null,
                afpNumber: data.afpNumber || null,
                arlName: data.arlName || null,
                compensationBox: data.compensationBox || null,
                emergencyContactName: data.emergencyContactName || null,
                emergencyContactPhone: data.emergencyContactPhone || null,
                emergencyContactRel: data.emergencyContactRel || null,
                address: data.address || null,
                city: data.city || null,
            }
        });

        revalidatePath("/dashboard/admin/payroll");
        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true, employee };
    } catch (error: any) {
        console.error("[CREATE_EMPLOYEE]", error);
        return { success: false, error: error?.message || "Error al registrar el empleado" };
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
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const companyId = await resolveCompanyId(session);
        if (!companyId) return { success: false, error: "Empresa no válida" };

        const { joiningDate, birthDate, ...rest } = data;

        try {
            const response = await fetch(`${GATEWAY_URL}/api/employees/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...rest,
                    ...(joiningDate ? { joiningDate: new Date(joiningDate).toISOString() } : {}),
                    ...(birthDate ? { birthDate: new Date(birthDate).toISOString() } : {}),
                }),
            });

            if (response.ok) {
                const resData = await response.json();
                revalidatePath("/dashboard/admin/payroll");
                revalidatePath("/dashboard/admin/payroll/employees");
                return { success: true, employee: resData.employee };
            }
        } catch {
            // Gateway fallback
        }

        // Direct Prisma DB Fallback
        const employee = await prisma.employee.update({
            where: { id },
            data: {
                ...rest,
                ...(joiningDate ? { joiningDate: new Date(joiningDate) } : {}),
                ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
            }
        });

        revalidatePath("/dashboard/admin/payroll");
        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true, employee };
    } catch (error: any) {
        console.error("[UPDATE_EMPLOYEE]", error);
        return { success: false, error: error.message };
    }
}

// ─── Delete (Soft) Employee ───────────────────────────────────────────────────
export async function deactivateEmployee(id: string) {
    try {
        const session = await auth();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const companyId = await resolveCompanyId(session);
        if (!companyId) return { success: false, error: "Empresa no válida" };

        const pending = await prisma.payroll.count({
            where: { employeeId: id, companyId, status: "PENDING" },
        });
        if (pending > 0) return { success: false, error: "El empleado tiene nóminas pendientes de pago." };

        try {
            const response = await fetch(`${GATEWAY_URL}/api/employees/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: false }),
            });
            if (response.ok) {
                revalidatePath("/dashboard/admin/payroll/employees");
                return { success: true };
            }
        } catch {
            // Gateway fallback
        }

        await prisma.employee.update({
            where: { id },
            data: { isActive: false }
        });

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
        if (!session?.user) return { success: false, error: "Unauthorized" };

        try {
            const response = await fetch(`${GATEWAY_URL}/api/employees/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: true }),
            });
            if (response.ok) {
                revalidatePath("/dashboard/admin/payroll/employees");
                return { success: true };
            }
        } catch {
            // Gateway fallback
        }

        await prisma.employee.update({
            where: { id },
            data: { isActive: true }
        });

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
        if (!session?.user) return { success: false, data: null };

        const companyId = await resolveCompanyId(session);
        if (!companyId) return { success: false, data: null };

        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                payrolls: { orderBy: { createdAt: "desc" } },
                benefits: { where: { isActive: true } }
            }
        });

        if (!employee) return { success: false, data: null };

        const payrollHistory = employee.payrolls || [];
        const benefits = employee.benefits || [];

        const totalPaidYTD = payrollHistory.filter((p: any) => p.status === "PAID").reduce((s: number, p: any) => s + (p.netPay || 0), 0);
        const monthlyBenefits = benefits.filter((b: any) => b.frequency === "MONTHLY").reduce((s: number, b: any) => s + (b.amount || 0), 0);

        const employerContribRate = 0.30;
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
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const companyId = await resolveCompanyId(session);
        if (!companyId) return { success: false, error: "Empresa no válida" };

        const benefit = await prisma.employeeBenefit.create({
            data: {
                employeeId: data.employeeId,
                companyId,
                name: data.name,
                amount: Number(data.amount),
                frequency: data.frequency,
                description: data.description || null,
                startDate: data.startDate ? new Date(data.startDate) : new Date(),
                endDate: data.endDate ? new Date(data.endDate) : null,
                isActive: true,
            }
        });

        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true, data: benefit };
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
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const benefit = await prisma.employeeBenefit.update({
            where: { id },
            data: {
                ...data,
                ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
            }
        });

        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true, data: benefit };
    } catch (error: any) {
        console.error("[UPDATE_BENEFIT]", error);
        return { success: false, error: error.message };
    }
}

export async function deleteBenefit(id: string) {
    try {
        const session = await auth();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        await prisma.employeeBenefit.delete({ where: { id } });

        revalidatePath("/dashboard/admin/payroll/employees");
        return { success: true };
    } catch (error: any) {
        console.error("[DELETE_BENEFIT]", error);
        return { success: false, error: error.message };
    }
}
