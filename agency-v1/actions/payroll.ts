"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types/auth";
import { revalidatePath } from "next/cache";
import { CreatePayrollRequest, calculatePayroll, generatePILARows, generatePILACSV } from "@/lib/payroll";
import { getFinancialAccounts } from "@/actions/treasury";

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function requireAdminSession() {
    const session = await auth();
    if (!session?.user?.companyId) return null;
    const role = session.user.role as UserRole;
    if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) return null;
    return session;
}

async function logPayrollAction(payrollId: string, userId: string, action: string, details?: object) {
    try {
        await prisma.payrollAuditLog.create({
            data: { payrollId, userId, action, details },
        });
    } catch {
        // Non-blocking
    }
}

// ─── Generar Nómina Individual ────────────────────────────────────────────────
export async function generatePayroll(data: CreatePayrollRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };
        const role = session.user.role as UserRole;
        if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) {
            return { success: false, error: "Forbidden" };
        }

        const employee = await prisma.employee.findUnique({
            where: { id: data.employeeId, companyId: session.user.companyId },
        });
        if (!employee) return { success: false, error: "Empleado no encontrado" };

        const workedDays = data.workedDays ?? 30;
        const calculation = calculatePayroll(
            employee.baseSalary,
            employee.contractType,
            data.manualItems,
            workedDays
        );

        const payroll = await prisma.$transaction(async (tx) => {
            const newPayroll = await tx.payroll.create({
                data: {
                    companyId: session.user!.companyId!,
                    employeeId: employee.id,
                    periodStart: new Date(data.periodStart),
                    periodEnd: new Date(data.periodEnd),
                    paymentMethod: data.paymentMethod,
                    isElectronic: data.isElectronic,
                    notes: data.notes,
                    totalEarnings: calculation.totalEarnings,
                    totalDeductions: calculation.totalDeductions,
                    netPay: calculation.netPay,
                    status: "PENDING",
                },
            });

            await tx.payrollItem.createMany({
                data: calculation.items.map((item) => ({
                    payrollId: newPayroll.id,
                    type: item.type,
                    concept: item.concept,
                    description: item.description,
                    amount: item.amount,
                })),
            });

            return newPayroll;
        });

        await logPayrollAction(payroll.id, session.user!.id!, "GENERATED", {
            employeeId: employee.id,
            netPay: calculation.netPay,
        });

        revalidatePath("/dashboard/admin/payroll");
        return { success: true, payrollId: payroll.id };
    } catch (error: any) {
        console.error("[GENERATE_PAYROLL]", error);
        return { success: false, error: error.message || "Failed to generate payroll" };
    }
}

// ─── Generar Nómina Masiva (Bulk) ─────────────────────────────────────────────
export async function bulkGeneratePayroll(
    employeeIds: string[],
    periodStart: string,
    periodEnd: string,
    paymentMethod: string = "TRANSFER",
    isElectronic: boolean = true
) {
    try {
        const session = await requireAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const employees = await prisma.employee.findMany({
            where: { id: { in: employeeIds }, companyId: session.user.companyId!, isActive: true },
        });

        const results = await Promise.allSettled(
            employees.map(async (emp) => {
                const calculation = calculatePayroll(emp.baseSalary, emp.contractType, [], 30);
                return prisma.$transaction(async (tx) => {
                    const payroll = await tx.payroll.create({
                        data: {
                            companyId: session.user!.companyId!,
                            employeeId: emp.id,
                            periodStart: new Date(periodStart),
                            periodEnd: new Date(periodEnd),
                            paymentMethod,
                            isElectronic,
                            totalEarnings: calculation.totalEarnings,
                            totalDeductions: calculation.totalDeductions,
                            netPay: calculation.netPay,
                            status: "PENDING",
                        },
                    });
                    await tx.payrollItem.createMany({
                        data: calculation.items.map((item) => ({
                            payrollId: payroll.id,
                            type: item.type,
                            concept: item.concept,
                            description: item.description,
                            amount: item.amount,
                        })),
                    });
                    return payroll;
                });
            })
        );

        const succeeded = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;

        revalidatePath("/dashboard/admin/payroll");
        return { success: true, succeeded, failed, total: employees.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ─── Listar Nóminas ──────────────────────────────────────────────────────────
export async function getPayrolls(filters?: { status?: string; department?: string; search?: string }) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        const where: any = { companyId: session.user.companyId };
        if (filters?.status) where.status = filters.status;

        const payrolls = await prisma.payroll.findMany({
            where,
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        documentNumber: true,
                        department: true,
                        position: true,
                        contractType: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 500,
        });

        let mapped = payrolls.map((p) => ({
            id: p.id,
            employeeName: `${p.employee.firstName} ${p.employee.lastName}`,
            documentNumber: p.employee.documentNumber,
            department: p.employee.department,
            position: p.employee.position,
            contractType: p.employee.contractType,
            periodStart: p.periodStart.toISOString(),
            periodEnd: p.periodEnd.toISOString(),
            issueDate: p.issueDate.toISOString(),
            status: p.status,
            dianStatus: p.dianStatus,
            totalEarnings: p.totalEarnings,
            totalDeductions: p.totalDeductions,
            netPay: p.netPay,
            paymentMethod: p.paymentMethod,
        }));

        if (filters?.search) {
            const s = filters.search.toLowerCase();
            mapped = mapped.filter(
                (p) =>
                    p.employeeName.toLowerCase().includes(s) ||
                    p.documentNumber.includes(s) ||
                    (p.department && p.department.toLowerCase().includes(s))
            );
        }
        if (filters?.department) {
            mapped = mapped.filter((p) => p.department === filters.department);
        }

        return { success: true, data: mapped };
    } catch (error) {
        return { success: false, data: [] };
    }
}

// ─── Detalle de Nómina ────────────────────────────────────────────────────────
export async function getPayrollById(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: null };

        const payroll = await prisma.payroll.findUnique({
            where: { id, companyId: session.user.companyId },
            include: {
                employee: true,
                items: true,
                auditLogs: {
                    include: { user: { select: { name: true, firstName: true } } },
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        return { success: true, data: payroll };
    } catch (error) {
        return { success: false, data: null };
    }
}

// ─── Actualizar Estado ────────────────────────────────────────────────────────
export async function updatePayrollStatus(id: string, status: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const payroll = await prisma.payroll.update({
            where: { id, companyId: session.user.companyId },
            data: { status },
        });

        await logPayrollAction(id, session.user!.id!, status === "PAID" ? "PAID" : "STATUS_CHANGED", { status });

        revalidatePath("/dashboard/admin/payroll");
        return { success: true, payrollId: payroll.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ─── Cancelar Nómina ─────────────────────────────────────────────────────────
export async function cancelPayroll(id: string, reason?: string) {
    try {
        const session = await requireAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const existing = await prisma.payroll.findUnique({
            where: { id, companyId: session.user.companyId! },
            include: { transaction: true },
        });
        if (!existing) return { success: false, error: "Nómina no encontrada" };
        if (existing.status === "CANCELLED") return { success: false, error: "Ya está cancelada" };

        // If paid, we must reverse the financial transaction (create a credit)
        if (existing.status === "PAID" && existing.transaction) {
            // Reverse: add back the amount to the account
            await prisma.financialAccount.update({
                where: { id: existing.transaction.accountId },
                data: { balance: { increment: existing.netPay } },
            });
        }

        await prisma.payroll.update({
            where: { id },
            data: { status: "CANCELLED", notes: reason ? `CANCELADA: ${reason}` : existing.notes },
        });

        await logPayrollAction(id, session.user!.id!, "CANCELLED", { reason });

        revalidatePath("/dashboard/admin/payroll");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ─── Clonar Nómina ────────────────────────────────────────────────────────────
export async function clonePayroll(id: string, newPeriodStart: string, newPeriodEnd: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const original = await prisma.payroll.findUnique({
            where: { id, companyId: session.user.companyId },
            include: { items: true, employee: true },
        });
        if (!original) return { success: false, error: "Nómina original no encontrada" };

        // Recalculate with current salary (in case it changed)
        const calculation = calculatePayroll(
            original.employee.baseSalary,
            original.employee.contractType,
            [],
            30
        );

        const cloned = await prisma.$transaction(async (tx) => {
            const newPayroll = await tx.payroll.create({
                data: {
                    companyId: session.user!.companyId!,
                    employeeId: original.employeeId,
                    periodStart: new Date(newPeriodStart),
                    periodEnd: new Date(newPeriodEnd),
                    paymentMethod: original.paymentMethod,
                    isElectronic: original.isElectronic,
                    notes: `Clonada de período anterior`,
                    totalEarnings: calculation.totalEarnings,
                    totalDeductions: calculation.totalDeductions,
                    netPay: calculation.netPay,
                    status: "PENDING",
                },
            });

            await tx.payrollItem.createMany({
                data: calculation.items.map((item) => ({
                    payrollId: newPayroll.id,
                    type: item.type,
                    concept: item.concept,
                    description: item.description,
                    amount: item.amount,
                })),
            });

            return newPayroll;
        });

        await logPayrollAction(cloned.id, session.user!.id!, "CLONED", { originalId: id });

        revalidatePath("/dashboard/admin/payroll");
        return { success: true, payrollId: cloned.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ─── Historial por Empleado ───────────────────────────────────────────────────
export async function getEmployeePayrollHistory(employeeId: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        const payrolls = await prisma.payroll.findMany({
            where: { employeeId, companyId: session.user.companyId },
            include: { items: true },
            orderBy: { periodStart: "desc" },
            take: 24, // Last 24 periods
        });

        return { success: true, data: payrolls };
    } catch (error) {
        return { success: false, data: [] };
    }
}

// ─── Analytics KPIs ──────────────────────────────────────────────────────────
export async function getPayrollAnalytics() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: null };

        const now = new Date();
        const year = now.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const startOfMonth = new Date(year, now.getMonth(), 1);
        const endOfLastMonth = new Date(year, now.getMonth(), 0);
        const startOfLastMonth = new Date(year, now.getMonth() - 1, 1);

        const [allPaid, currentMonthPayrolls, lastMonthPayrolls, byStatus, employeeCount, monthlyTotals] =
            await Promise.all([
                prisma.payroll.aggregate({
                    where: { companyId: session.user.companyId, status: "PAID" },
                    _sum: { netPay: true },
                    _count: true,
                }),
                prisma.payroll.aggregate({
                    where: {
                        companyId: session.user.companyId,
                        createdAt: { gte: startOfMonth },
                    },
                    _sum: { netPay: true },
                    _count: true,
                }),
                prisma.payroll.aggregate({
                    where: {
                        companyId: session.user.companyId,
                        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
                        status: "PAID",
                    },
                    _sum: { netPay: true },
                }),
                prisma.payroll.groupBy({
                    by: ["status"],
                    where: { companyId: session.user.companyId },
                    _count: true,
                    _sum: { netPay: true },
                }),
                prisma.employee.count({
                    where: { companyId: session.user.companyId, isActive: true },
                }),
                // Monthly breakdown for chart (last 12 months)
                prisma.payroll.findMany({
                    where: {
                        companyId: session.user.companyId,
                        status: "PAID",
                        createdAt: { gte: new Date(year - 1, now.getMonth() + 1, 1) },
                    },
                    select: { netPay: true, createdAt: true },
                }),
            ]);

        // Build monthly chart data
        const monthlyMap: Record<string, number> = {};
        monthlyTotals.forEach((p) => {
            const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
            monthlyMap[key] = (monthlyMap[key] || 0) + p.netPay;
        });

        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const chartData = Array.from({ length: 12 }, (_, i) => {
            const d = new Date(year, now.getMonth() - 11 + i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            return {
                month: monthNames[d.getMonth()],
                year: d.getFullYear(),
                total: monthlyMap[key] || 0,
            };
        });

        const monthlyChange =
            lastMonthPayrolls._sum.netPay && lastMonthPayrolls._sum.netPay > 0
                ? (((currentMonthPayrolls._sum.netPay || 0) - lastMonthPayrolls._sum.netPay) /
                      lastMonthPayrolls._sum.netPay) *
                  100
                : 0;

        const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, { count: s._count, total: s._sum.netPay || 0 }]));

        return {
            success: true,
            data: {
                ytdTotal: allPaid._sum.netPay || 0,
                ytdCount: allPaid._count,
                currentMonthTotal: currentMonthPayrolls._sum.netPay || 0,
                currentMonthCount: currentMonthPayrolls._count,
                lastMonthTotal: lastMonthPayrolls._sum.netPay || 0,
                monthlyChange,
                activeEmployees: employeeCount,
                pendingCount: statusMap.PENDING?.count || 0,
                pendingTotal: statusMap.PENDING?.total || 0,
                chartData,
                byStatus: statusMap,
            },
        };
    } catch (error) {
        console.error("[GET_PAYROLL_ANALYTICS]", error);
        return { success: false, data: null };
    }
}

// ─── Próximos Pagos (upcoming en 30 días) ─────────────────────────────────────
export async function getUpcomingPayrolls() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        const now = new Date();
        const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const payrolls = await prisma.payroll.findMany({
            where: {
                companyId: session.user.companyId,
                status: "PENDING",
                periodEnd: { lte: in30 },
            },
            include: {
                employee: { select: { firstName: true, lastName: true, position: true } },
            },
            orderBy: { periodEnd: "asc" },
            take: 10,
        });

        return { success: true, data: payrolls };
    } catch (error) {
        return { success: false, data: [] };
    }
}

// ─── Exportar CSV de Nóminas ──────────────────────────────────────────────────
export async function exportPayrollsCSV() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, csv: "" };

        const payrolls = await prisma.payroll.findMany({
            where: { companyId: session.user.companyId },
            include: {
                employee: {
                    select: { firstName: true, lastName: true, documentNumber: true, documentType: true, department: true, position: true },
                },
                items: true,
            },
            orderBy: { createdAt: "desc" },
        });

        const headers = [
            "ID", "Empleado", "Documento", "Departamento", "Cargo",
            "Inicio Período", "Fin Período", "Emisión", "Método Pago",
            "Total Devengos", "Total Deducciones", "Neto Pagar", "Estado", "Estado DIAN"
        ];

        const rows = payrolls.map((p) => [
            p.id,
            `"${p.employee.firstName} ${p.employee.lastName}"`,
            `${p.employee.documentType} ${p.employee.documentNumber}`,
            `"${p.employee.department || ""}"`,
            `"${p.employee.position}"`,
            p.periodStart.toISOString().split("T")[0],
            p.periodEnd.toISOString().split("T")[0],
            p.issueDate.toISOString().split("T")[0],
            p.paymentMethod,
            p.totalEarnings,
            p.totalDeductions,
            p.netPay,
            p.status,
            p.dianStatus || "N/A",
        ]);

        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        return { success: true, csv };
    } catch (error) {
        return { success: false, csv: "" };
    }
}

// ─── Reporte PILA ─────────────────────────────────────────────────────────────
export async function generatePILAReport(workedDays: number = 30) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, csv: "", rows: [] };

        const employees = await prisma.employee.findMany({
            where: { companyId: session.user.companyId, isActive: true, contractType: "LABORAL" },
            select: {
                documentType: true,
                documentNumber: true,
                firstName: true,
                lastName: true,
                epsName: true,
                afpName: true,
                arlName: true,
                compensationBox: true,
                baseSalary: true,
            },
        });

        const now = new Date();
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const rows = generatePILARows(employees, workedDays);
        const csv = generatePILACSV(rows, period);

        return { success: true, csv, rows, period };
    } catch (error) {
        console.error("[GENERATE_PILA]", error);
        return { success: false, csv: "", rows: [] };
    }
}

// ─── Analytics por Departamento ───────────────────────────────────────────────
export async function getPayrollByDepartment() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        const payrolls = await prisma.payroll.findMany({
            where: { companyId: session.user.companyId, status: "PAID" },
            include: { employee: { select: { department: true } } },
        });

        const deptMap: Record<string, { total: number; count: number }> = {};
        payrolls.forEach((p) => {
            const dept = p.employee.department || "Sin Departamento";
            deptMap[dept] = {
                total: (deptMap[dept]?.total || 0) + p.netPay,
                count: (deptMap[dept]?.count || 0) + 1,
            };
        });

        return {
            success: true,
            data: Object.entries(deptMap)
                .map(([dept, v]) => ({ department: dept, total: v.total, count: v.count }))
                .sort((a, b) => b.total - a.total),
        };
    } catch (error) {
        return { success: false, data: [] };
    }
}
