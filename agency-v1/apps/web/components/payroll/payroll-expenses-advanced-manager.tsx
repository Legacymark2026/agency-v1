"use client";

import React, { useState } from "react";
import { ExpenseCostCenter, RecurringExpenseItem, calculateCostCenterMetrics } from "@/lib/payroll-expenses-advanced";
import { Building2, PieChart, RefreshCw, Calendar, Plus, CheckCircle2, TrendingUp, AlertCircle, Sparkles, DollarSign } from "lucide-react";
import { toast } from "sonner";

export function PayrollExpensesAdvancedManager() {
    const [activeTab, setActiveTab] = useState<"cost_centers" | "recurring">("cost_centers");

    const costCenters: ExpenseCostCenter[] = [
        { id: "1", code: "CC-101", name: "Operaciones & Logística Bucaramanga", budget: 35000000, spent: 22400000, manager: "Heyber Florez" },
        { id: "2", code: "CC-102", name: "Ventas & Marketing Digital", budget: 20000000, spent: 14800000, manager: "Enrique Bohórquez" },
        { id: "3", code: "CC-103", name: "Administración & Tecnología ERP", budget: 15000000, spent: 8900000, manager: "Administrador General" },
    ];

    const recurringExpenses: RecurringExpenseItem[] = [
        { id: "r1", title: "Arriendo Oficina Principal Bucaramanga", vendor: "Inmobiliaria Bucaramanga S.A.S", category: "Arriendos", amount: 4500000, frequency: "MONTHLY", costCenterCode: "CC-101", nextDueDate: "2026-08-01", autoApprove: true },
        { id: "r2", title: "Servicios de Internet & Servidores Cloud AWS", vendor: "Amazon Web Services / Claro", category: "Tecnología", amount: 2800000, frequency: "MONTHLY", costCenterCode: "CC-103", nextDueDate: "2026-08-05", autoApprove: true },
        { id: "r3", title: "Servicios Públicos (Luz / Agua / Aseo)", vendor: "ESSA / Aqualia", category: "Servicios Públicos", amount: 1200000, frequency: "MONTHLY", costCenterCode: "CC-101", nextDueDate: "2026-08-10", autoApprove: false },
    ];

    const metrics = calculateCostCenterMetrics(costCenters);

    const fmtMoney = (n: number) =>
        new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Gestión Avanzada de Egresos, Centros de Costos & Recurrentes 📊
                        </h3>
                        <p className="text-xs text-slate-400">
                            Presupuestaciones por departamento, flujo de egresos recurrentes y control de ejecución.
                        </p>
                    </div>
                </div>

                <div className="flex gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
                    <button
                        onClick={() => setActiveTab("cost_centers")}
                        className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === "cost_centers" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <PieChart className="w-3.5 h-3.5" /> Centros de Costos ({costCenters.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("recurring")}
                        className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === "recurring" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <Calendar className="w-3.5 h-3.5" /> Egresos Recurrentes ({recurringExpenses.length})
                    </button>
                </div>
            </div>

            {/* TAB 1: CENTROS DE COSTOS */}
            {activeTab === "cost_centers" && (
                <div className="space-y-6 text-xs">
                    {/* Metrics Banner */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block font-sans">Presupuesto Total Aprobado</span>
                            <span className="text-lg font-black text-white">{fmtMoney(metrics.totalBudget)}</span>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block font-sans">Ejecutado (Egresos + Nómina)</span>
                            <span className="text-lg font-black text-amber-400">{fmtMoney(metrics.totalSpent)}</span>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block font-sans">Porcentaje de Ejecución</span>
                            <span className="text-lg font-black text-emerald-400">{metrics.executionPercentage}%</span>
                        </div>
                    </div>

                    {/* Cost Centers Table */}
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                        <table className="w-full text-xs text-left">
                            <thead className="text-slate-400 uppercase bg-slate-900 border-b border-slate-800 text-[10px]">
                                <tr>
                                    <th className="p-3.5 font-bold">Código / Centro de Costos</th>
                                    <th className="p-3.5 font-bold">Responsable</th>
                                    <th className="p-3.5 font-bold text-right">Presupuesto</th>
                                    <th className="p-3.5 font-bold text-right">Ejecutado</th>
                                    <th className="p-3.5 font-bold text-center">% Ejecución</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-medium">
                                {costCenters.map((cc) => {
                                    const pct = Math.round((cc.spent / cc.budget) * 100);
                                    return (
                                        <tr key={cc.id} className="hover:bg-slate-900/50 transition-colors">
                                            <td className="p-3.5">
                                                <div className="font-bold text-white text-sm">{cc.name}</div>
                                                <div className="text-amber-400 font-mono text-[10px]">{cc.code}</div>
                                            </td>
                                            <td className="p-3.5 text-slate-300">{cc.manager}</td>
                                            <td className="p-3.5 text-right font-mono font-bold text-slate-200">{fmtMoney(cc.budget)}</td>
                                            <td className="p-3.5 text-right font-mono font-bold text-amber-400">{fmtMoney(cc.spent)}</td>
                                            <td className="p-3.5 text-center font-mono">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                    {pct}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: EGRESOS RECURRENTES */}
            {activeTab === "recurring" && (
                <div className="space-y-6 text-xs">
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                        <table className="w-full text-xs text-left">
                            <thead className="text-slate-400 uppercase bg-slate-900 border-b border-slate-800 text-[10px]">
                                <tr>
                                    <th className="p-3.5 font-bold">Egreso Programado</th>
                                    <th className="p-3.5 font-bold">Proveedor</th>
                                    <th className="p-3.5 font-bold">Categoría & Centro</th>
                                    <th className="p-3.5 font-bold">Próximo Vencimiento</th>
                                    <th className="p-3.5 font-bold text-right">Monto Estimado</th>
                                    <th className="p-3.5 font-bold text-center">Estado Programación</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-medium">
                                {recurringExpenses.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-slate-900/50 transition-colors">
                                        <td className="p-3.5 font-bold text-white text-sm">{rec.title}</td>
                                        <td className="p-3.5 text-slate-300">{rec.vendor}</td>
                                        <td className="p-3.5">
                                            <div className="text-slate-200">{rec.category}</div>
                                            <div className="text-amber-400 font-mono text-[10px]">{rec.costCenterCode}</div>
                                        </td>
                                        <td className="p-3.5 font-mono text-slate-300">{rec.nextDueDate}</td>
                                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400">{fmtMoney(rec.amount)}</td>
                                        <td className="p-3.5 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <CheckCircle2 className="w-3 h-3" /> Auto-Programado
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
