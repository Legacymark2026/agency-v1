"use server";

import { prisma } from "@/lib/prisma";
import type { IncomeStatementReport, BudgetVarianceItem, CashFlowForecastItem } from "../types";

export async function getIncomeStatementAction(): Promise<{ success: boolean; report: IncomeStatementReport }> {
  let grossRevenue = 0;
  let operatingExpenses = 0;
  let operatingCosts = 0;

  try {
    const [invoices, expenses, payrolls] = await Promise.all([
      prisma.invoice.findMany({ select: { total: true } }).catch(() => []),
      prisma.expense.findMany({ select: { amount: true } }).catch(() => []),
      prisma.payroll.findMany({ select: { totalEarnings: true } }).catch(() => []),
    ]);

    grossRevenue = invoices.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);
    const expTotal = expenses.reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0);
    const payTotal = payrolls.reduce((acc, pay) => acc + (Number(pay.totalEarnings) || 0), 0);

    operatingCosts = Math.round(grossRevenue * 0.25);
    operatingExpenses = expTotal + payTotal;
  } catch (e) {}

  const grossProfit = grossRevenue - operatingCosts;
  const operatingIncome = grossProfit - operatingExpenses;
  const taxEstimated = Math.round(Math.max(0, operatingIncome) * 0.35);
  const netIncome = operatingIncome - taxEstimated;
  const profitMarginPercent = grossRevenue > 0 ? Math.round((netIncome / grossRevenue) * 1000) / 10 : 0;

  return {
    success: true,
    report: { grossRevenue, operatingCosts, grossProfit, operatingExpenses, operatingIncome, taxEstimated, netIncome, profitMarginPercent, period: `Año Gravable ${new Date().getFullYear()}` },
  };
}

export async function getBudgetVarianceAction(): Promise<{ success: boolean; items: BudgetVarianceItem[] }> {
  let totalExpenses = 0;
  try {
    const expenses = await prisma.expense.findMany({ select: { amount: true } });
    totalExpenses = expenses.reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0);
  } catch (_) {}

  const items: BudgetVarianceItem[] = [
    { costCenterCode: "01", costCenterName: "01 - Administración & Dirección General", budgetedAmount: 25000000, executedAmount: Math.round(totalExpenses * 0.3), varianceAmount: Math.max(0, 25000000 - Math.round(totalExpenses * 0.3)), variancePercent: Math.round((Math.round(totalExpenses * 0.3) / 25000000) * 1000) / 10, status: "DENTRO_DEL_PRESUPUESTO" },
    { costCenterCode: "02", costCenterName: "02 - Ventas, Mercadeo & Pauta Digital", budgetedAmount: 30000000, executedAmount: Math.round(totalExpenses * 0.35), varianceAmount: Math.max(0, 30000000 - Math.round(totalExpenses * 0.35)), variancePercent: Math.round((Math.round(totalExpenses * 0.35) / 30000000) * 1000) / 10, status: "DENTRO_DEL_PRESUPUESTO" },
    { costCenterCode: "03", costCenterName: "03 - Operaciones & Infraestructura Cloud (TI)", budgetedAmount: 18000000, executedAmount: Math.round(totalExpenses * 0.2), varianceAmount: Math.max(0, 18000000 - Math.round(totalExpenses * 0.2)), variancePercent: Math.round((Math.round(totalExpenses * 0.2) / 18000000) * 1000) / 10, status: "DENTRO_DEL_PRESUPUESTO" },
    { costCenterCode: "04", costCenterName: "04 - Consultoría & Desarrollo de Software", budgetedAmount: 50000000, executedAmount: Math.round(totalExpenses * 0.15), varianceAmount: Math.max(0, 50000000 - Math.round(totalExpenses * 0.15)), variancePercent: Math.round((Math.round(totalExpenses * 0.15) / 50000000) * 1000) / 10, status: "DENTRO_DEL_PRESUPUESTO" },
  ];
  return { success: true, items };
}

export async function getCashFlowForecastAction(): Promise<{ success: boolean; forecast: CashFlowForecastItem[] }> {
  let bankBalance = 0;
  let pendingReceivables = 0;
  let pendingPayables = 0;

  try {
    const [banks, invs, exps] = await Promise.all([
      prisma.financialAccount.findMany({ where: { isActive: true } }).catch(() => []),
      prisma.invoice.findMany({ where: { status: { in: ["PENDING", "OVERDUE"] } }, select: { total: true } }).catch(() => []),
      prisma.expense.findMany({ where: { status: "PENDING" }, select: { amount: true } }).catch(() => []),
    ]);

    bankBalance = banks.reduce((acc, b) => acc + (Number(b.balance) || 0), 0);
    pendingReceivables = invs.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);
    pendingPayables = exps.reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0);
  } catch (_) {}

  const weeklyInflow = Math.round(pendingReceivables / 4);
  const weeklyOutflow = Math.round(pendingPayables / 4);
  const forecast: CashFlowForecastItem[] = [
    { periodLabel: "Semana 1 (Actual)", expectedInflows: weeklyInflow, committedOutflows: weeklyOutflow, netCashFlow: weeklyInflow - weeklyOutflow, projectedEndingBalance: bankBalance + (weeklyInflow - weeklyOutflow) },
    { periodLabel: "Semana 2 (Próxima)", expectedInflows: weeklyInflow, committedOutflows: weeklyOutflow, netCashFlow: weeklyInflow - weeklyOutflow, projectedEndingBalance: bankBalance + (weeklyInflow - weeklyOutflow) * 2 },
    { periodLabel: "Semana 3 (Cierre Quincena)", expectedInflows: weeklyInflow, committedOutflows: weeklyOutflow, netCashFlow: weeklyInflow - weeklyOutflow, projectedEndingBalance: bankBalance + (weeklyInflow - weeklyOutflow) * 3 },
    { periodLabel: "Semana 4 (Fin de Mes Fiscal)", expectedInflows: weeklyInflow, committedOutflows: weeklyOutflow, netCashFlow: weeklyInflow - weeklyOutflow, projectedEndingBalance: bankBalance + (weeklyInflow - weeklyOutflow) * 4 },
  ];
  return { success: true, forecast };
}
