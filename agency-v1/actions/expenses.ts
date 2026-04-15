"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CreateExpenseInput {
    title: string;
    amount: number;
    date: string;
    categoryId?: string;
    vendor?: string;
    description?: string;
    reference?: string;
    paymentMethod?: string;
    accountId?: string;
    notes?: string;
}

// ─── Default Categories seed ─────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
    { name: "Software y Suscripciones", code: "SOFT", color: "#6366f1" },
    { name: "Publicidad y Pauta", code: "ADS", color: "#f59e0b" },
    { name: "Viáticos y Transporte", code: "VIA", color: "#10b981" },
    { name: "Servicios Públicos", code: "SERV", color: "#3b82f6" },
    { name: "Equipos y Hardware", code: "EQUIP", color: "#8b5cf6" },
    { name: "Arrendamiento", code: "ARREND", color: "#ec4899" },
    { name: "Personal Externo", code: "EXT", color: "#14b8a6" },
    { name: "Impuestos y Tasas", code: "IMP", color: "#ef4444" },
    { name: "Gastos Bancarios", code: "BANK", color: "#64748b" },
    { name: "Otros", code: "OTR", color: "#a3a3a3" },
];

// ─── Expense Categories ───────────────────────────────────────────────────────

export async function getExpenseCategories() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        let categories = await prisma.expenseCategory.findMany({
            where: { companyId: session.user.companyId, isActive: true },
            orderBy: { name: "asc" },
        });

        // Auto-seed default categories for new companies
        if (categories.length === 0) {
            await prisma.expenseCategory.createMany({
                data: DEFAULT_CATEGORIES.map((c) => ({
                    ...c,
                    companyId: session.user!.companyId!,
                })),
                skipDuplicates: true,
            });
            categories = await prisma.expenseCategory.findMany({
                where: { companyId: session.user.companyId, isActive: true },
                orderBy: { name: "asc" },
            });
        }

        return { success: true, data: categories };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function createExpenseCategory(data: { name: string; code?: string; color?: string }) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const category = await prisma.expenseCategory.create({
            data: { ...data, companyId: session.user.companyId },
        });

        revalidatePath("/dashboard/admin/payroll");
        return { success: true, data: category };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ─── Expenses CRUD ────────────────────────────────────────────────────────────

export async function createExpense(input: CreateExpenseInput) {
    try {
        const session = await auth();
        if (!session?.user?.companyId || !session?.user?.id) return { success: false, error: "Unauthorized" };

        const expense = await prisma.expense.create({
            data: {
                companyId: session.user.companyId,
                createdById: session.user.id,
                title: input.title,
                amount: input.amount,
                date: new Date(input.date),
                categoryId: input.categoryId || null,
                vendor: input.vendor || null,
                description: input.description || null,
                reference: input.reference || null,
                paymentMethod: input.paymentMethod || "TRANSFER",
                accountId: input.accountId || null,
                notes: input.notes || null,
                status: "PENDING",
            },
            include: { category: true },
        });

        revalidatePath("/dashboard/admin/payroll");
        return { success: true, data: expense };
    } catch (error: any) {
        console.error("[CREATE_EXPENSE]", error);
        return { success: false, error: error.message };
    }
}

export interface GetExpensesFilter {
    status?: string;
    categoryId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}

export async function getExpenses(filter?: GetExpensesFilter) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        const where: any = { companyId: session.user.companyId };

        if (filter?.status) where.status = filter.status;
        if (filter?.categoryId) where.categoryId = filter.categoryId;
        if (filter?.dateFrom || filter?.dateTo) {
            where.date = {};
            if (filter.dateFrom) where.date.gte = new Date(filter.dateFrom);
            if (filter.dateTo) where.date.lte = new Date(filter.dateTo);
        }
        if (filter?.search) {
            where.OR = [
                { title: { contains: filter.search, mode: "insensitive" } },
                { vendor: { contains: filter.search, mode: "insensitive" } },
            ];
        }

        const expenses = await prisma.expense.findMany({
            where,
            include: {
                category: { select: { name: true, color: true, code: true } },
                createdBy: { select: { name: true, firstName: true } },
                approvedBy: { select: { name: true, firstName: true } },
            },
            orderBy: { date: "desc" },
            take: 200,
        });

        return { success: true, data: expenses };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function updateExpense(id: string, data: Partial<CreateExpenseInput>) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const expense = await prisma.expense.update({
            where: { id, companyId: session.user.companyId },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.amount !== undefined && { amount: data.amount }),
                ...(data.date && { date: new Date(data.date) }),
                ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
                ...(data.vendor !== undefined && { vendor: data.vendor }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.reference !== undefined && { reference: data.reference }),
                ...(data.accountId !== undefined && { accountId: data.accountId }),
                ...(data.notes !== undefined && { notes: data.notes }),
            },
        });

        revalidatePath("/dashboard/admin/payroll");
        return { success: true, data: expense };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function approveExpense(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId || !session?.user?.id) return { success: false, error: "Unauthorized" };

        const expense = await prisma.expense.update({
            where: { id, companyId: session.user.companyId },
            data: {
                status: "APPROVED",
                approvedById: session.user.id,
                approvedAt: new Date(),
            },
        });

        revalidatePath("/dashboard/admin/payroll");
        return { success: true, data: expense };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function rejectExpense(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const expense = await prisma.expense.update({
            where: { id, companyId: session.user.companyId },
            data: { status: "REJECTED" },
        });

        revalidatePath("/dashboard/admin/payroll");
        return { success: true, data: expense };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function markExpensePaid(id: string, accountId?: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const expense = await prisma.expense.update({
            where: { id, companyId: session.user.companyId },
            data: {
                status: "PAID",
                paidAt: new Date(),
                ...(accountId && { accountId }),
            },
        });

        revalidatePath("/dashboard/admin/payroll");
        return { success: true, data: expense };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteExpense(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        // Only allow deleting PENDING or REJECTED expenses
        const expense = await prisma.expense.findUnique({ where: { id, companyId: session.user.companyId } });
        if (!expense) return { success: false, error: "Gasto no encontrado" };
        if (expense.status === "PAID") return { success: false, error: "No se puede eliminar un gasto pagado" };

        await prisma.expense.delete({ where: { id, companyId: session.user.companyId } });

        revalidatePath("/dashboard/admin/payroll");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ─── Analytics / Stats ────────────────────────────────────────────────────────

export async function getExpenseStats() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: null };

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const [allExpenses, currentMonthExpenses, lastMonthExpenses, byCategory] = await Promise.all([
            prisma.expense.findMany({
                where: { companyId: session.user.companyId },
                select: { amount: true, status: true, categoryId: true },
            }),
            prisma.expense.aggregate({
                where: { companyId: session.user.companyId, date: { gte: startOfMonth } },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.expense.aggregate({
                where: {
                    companyId: session.user.companyId,
                    date: { gte: startOfLastMonth, lte: endOfLastMonth },
                },
                _sum: { amount: true },
            }),
            prisma.expense.groupBy({
                by: ["categoryId"],
                where: { companyId: session.user.companyId },
                _sum: { amount: true },
                _count: true,
            }),
        ]);

        // Fetch category names
        const categoryIds = byCategory.map((c) => c.categoryId).filter(Boolean) as string[];
        const categories = await prisma.expenseCategory.findMany({
            where: { id: { in: categoryIds } },
        });
        const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

        const totalAmount = allExpenses.reduce((sum, e) => sum + e.amount, 0);
        const pendingAmount = allExpenses.filter((e) => e.status === "PENDING").reduce((sum, e) => sum + e.amount, 0);
        const paidAmount = allExpenses.filter((e) => e.status === "PAID").reduce((sum, e) => sum + e.amount, 0);

        const monthlyChange =
            lastMonthExpenses._sum.amount && lastMonthExpenses._sum.amount > 0
                ? (((currentMonthExpenses._sum.amount || 0) - lastMonthExpenses._sum.amount) /
                      lastMonthExpenses._sum.amount) *
                  100
                : 0;

        const byCategoryFormatted = byCategory.map((c) => ({
            categoryId: c.categoryId,
            categoryName: c.categoryId ? categoryMap[c.categoryId]?.name || "Sin categoría" : "Sin categoría",
            categoryColor: c.categoryId ? categoryMap[c.categoryId]?.color || "#a3a3a3" : "#a3a3a3",
            total: c._sum.amount || 0,
            count: c._count,
        }));

        return {
            success: true,
            data: {
                totalAmount,
                pendingAmount,
                paidAmount,
                currentMonthTotal: currentMonthExpenses._sum.amount || 0,
                currentMonthCount: currentMonthExpenses._count,
                lastMonthTotal: lastMonthExpenses._sum.amount || 0,
                monthlyChange,
                byCategory: byCategoryFormatted.sort((a, b) => b.total - a.total),
            },
        };
    } catch (error) {
        console.error("[GET_EXPENSE_STATS]", error);
        return { success: false, data: null };
    }
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export async function exportExpensesCSV() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, csv: "" };

        const expenses = await prisma.expense.findMany({
            where: { companyId: session.user.companyId },
            include: {
                category: { select: { name: true } },
                createdBy: { select: { name: true } },
            },
            orderBy: { date: "desc" },
        });

        const headers = ["Fecha", "Título", "Categoría", "Proveedor", "Referencia", "Monto", "Estado", "Método Pago", "Creado Por"];
        const rows = expenses.map((e) => [
            e.date.toISOString().split("T")[0],
            `"${e.title}"`,
            `"${e.category?.name || "Sin categoría"}"`,
            `"${e.vendor || ""}"`,
            `"${e.reference || ""}"`,
            e.amount.toFixed(2),
            e.status,
            e.paymentMethod || "TRANSFER",
            `"${e.createdBy?.name || ""}"`,
        ]);

        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        return { success: true, csv };
    } catch (error) {
        return { success: false, csv: "" };
    }
}
