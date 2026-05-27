"use server";

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

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

// ─── Expense Categories ───────────────────────────────────────────────────────

export async function getExpenseCategories() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        const response = await fetch(`${GATEWAY_URL}/api/expenses/categories?companyId=${session.user.companyId}`);
        const resData = await response.json();
        if (!response.ok) return { success: false, data: [] };

        return { success: true, data: resData.data };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function createExpenseCategory(data: { name: string; code?: string; color?: string }) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/expenses/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, companyId: session.user.companyId })
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to create category" };

        revalidatePath("/dashboard/admin/payroll");
        return { success: true, data: resData.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ─── Expenses CRUD ────────────────────────────────────────────────────────────

export async function createExpense(input: CreateExpenseInput) {
    try {
        const session = await auth();
        if (!session?.user?.companyId || !session?.user?.id) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...input,
                companyId: session.user.companyId,
                createdById: session.user.id,
            })
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to create expense" };

        revalidatePath("/dashboard/admin/payroll");
        return { success: true, data: resData.data };
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

        const queryParams = new URLSearchParams({
            companyId: session.user.companyId,
            ...(filter?.status && { status: filter.status }),
            ...(filter?.categoryId && { categoryId: filter.categoryId }),
            ...(filter?.dateFrom && { dateFrom: filter.dateFrom }),
            ...(filter?.dateTo && { dateTo: filter.dateTo }),
            ...(filter?.search && { search: filter.search }),
        });

        const response = await fetch(`${GATEWAY_URL}/api/expenses?${queryParams.toString()}`);
        const resData = await response.json();
        if (!response.ok) return { success: false, data: [] };

        return { success: true, data: resData.data };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function updateExpense(id: string, data: Partial<CreateExpenseInput>) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/expenses/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to update expense" };

        revalidatePath("/dashboard/admin/payroll");
        return { success: true, data: resData.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function approveExpense(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId || !session?.user?.id) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/expenses/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: "APPROVED",
                approvedById: session.user.id,
                approvedAt: new Date().toISOString(),
            })
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to approve expense" };

        revalidatePath("/dashboard/admin/payroll");
        return { success: true, data: resData.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function rejectExpense(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/expenses/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: "REJECTED" })
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to reject expense" };

        revalidatePath("/dashboard/admin/payroll");
        return { success: true, data: resData.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function markExpensePaid(id: string, accountId?: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/expenses/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: "PAID",
                paidAt: new Date().toISOString(),
                ...(accountId && { accountId }),
            })
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to mark expense as paid" };

        revalidatePath("/dashboard/admin/payroll");
        return { success: true, data: resData.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteExpense(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/expenses/${id}?companyId=${session.user.companyId}`, {
            method: 'DELETE'
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to delete expense" };

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

        const response = await fetch(`${GATEWAY_URL}/api/expenses/stats?companyId=${session.user.companyId}`);
        const resData = await response.json();
        if (!response.ok) return { success: false, data: null };

        return { success: true, data: resData.data };
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

        const queryParams = new URLSearchParams({
            companyId: session.user.companyId,
        });
        const response = await fetch(`${GATEWAY_URL}/api/expenses?${queryParams.toString()}`);
        const resData = await response.json();
        if (!response.ok) return { success: false, csv: "" };
        const expenses = resData.data || [];

        const headers = ["Fecha", "Título", "Categoría", "Proveedor", "Referencia", "Monto", "Estado", "Método Pago", "Creado Por"];
        const rows = expenses.map((e: any) => [
            new Date(e.date).toISOString().split("T")[0],
            `"${e.title}"`,
            `"${e.category?.name || "Sin categoría"}"`,
            `"${e.vendor || ""}"`,
            `"${e.reference || ""}"`,
            e.amount.toFixed(2),
            e.status,
            e.paymentMethod || "TRANSFER",
            `"${e.createdBy?.name || ""}"`,
        ]);

        const csv = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
        return { success: true, csv };
    } catch (error) {
        return { success: false, csv: "" };
    }
}
