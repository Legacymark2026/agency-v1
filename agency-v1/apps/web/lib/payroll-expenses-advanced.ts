/**
 * MOTOR DE GESTIÓN AVANZADA DE EGRESOS & CENTROS DE COSTOS (COLOMBIA)
 */

export interface ExpenseCostCenter {
    id: string;
    code: string; // ej: CC-101
    name: string; // ej: Operaciones Bucaramanga, Ventas Bogotá, Marketing Digital
    budget: number;
    spent: number;
    manager: string;
}

export interface RecurringExpenseItem {
    id: string;
    title: string;
    vendor: string;
    category: string;
    amount: number;
    frequency: "MONTHLY" | "BIMONTHLY" | "ANNUAL";
    costCenterCode: string;
    nextDueDate: string;
    autoApprove: boolean;
}

export function calculateCostCenterMetrics(centers: ExpenseCostCenter[]) {
    const totalBudget = centers.reduce((sum, c) => sum + c.budget, 0);
    const totalSpent = centers.reduce((sum, c) => sum + c.spent, 0);
    const remaining = totalBudget - totalSpent;
    const executionPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
        totalBudget,
        totalSpent,
        remaining,
        executionPercentage: Number(executionPercentage.toFixed(1)),
    };
}
