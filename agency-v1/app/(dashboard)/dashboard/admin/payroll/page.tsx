"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus, Users, DollarSign, FileText, CheckCircle2, ChevronRight,
    Activity, Calendar, TrendingUp, TrendingDown, AlertTriangle, Download,
    Receipt, BarChart3, RefreshCw, Clock, Filter, Search, X, CheckSquare, Square, Layers
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getPayrolls, getPayrollAnalytics, getUpcomingPayrolls, bulkGeneratePayroll, exportPayrollsCSV } from "@/actions/payroll";
import { getExpenses, getExpenseStats } from "@/actions/expenses";
import { toast } from "sonner";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from "recharts";

const fmt = (n: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

const fmt2 = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "PENDIENTE", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    PAID: { label: "PAGADO", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    CANCELLED: { label: "CANCELADO", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function PayrollDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"payrolls" | "expenses">("payrolls");
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [expenseStats, setExpenseStats] = useState<any>(null);
    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkPaying, setIsBulkPaying] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const [pRes, aRes, uRes, eRes, esRes] = await Promise.all([
            getPayrolls(),
            getPayrollAnalytics(),
            getUpcomingPayrolls(),
            getExpenses(),
            getExpenseStats(),
        ]);
        if (pRes.success) setPayrolls(pRes.data);
        if (aRes.success) setAnalytics(aRes.data);
        if (uRes.success) setUpcoming(uRes.data);
        if (eRes.success) setExpenses(eRes.data);
        if (esRes.success) setExpenseStats(esRes.data);
        setIsLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const filtered = payrolls.filter(p => {
        const matchSearch = !search || p.employeeName.toLowerCase().includes(search.toLowerCase()) || p.documentNumber.includes(search);
        const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleExportCSV = async () => {
        const res = await exportPayrollsCSV();
        if (res.success && res.csv) {
            const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `nominas_${new Date().toISOString().split("T")[0]}.csv`;
            a.click(); URL.revokeObjectURL(url);
        }
    };

    const CHART_COLORS = ["#14b8a6", "#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#ec4899"];
    const deptData = analytics?.chartData || [];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-mono mb-3">
                        <Activity className="w-3.5 h-3.5" />
                        <span>MÓDULO NÓMINA & EGRESOS (DIAN)</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Nómina y Egresos</h1>
                    <p className="text-slate-400 text-sm mt-1">Gestión de personal, contratistas, liquidación y gastos operativos.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <Download className="h-4 w-4" /> CSV
                    </button>
                    <Link href="/dashboard/admin/payroll/employees" className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors">
                        <Users className="h-4 w-4 text-teal-500" /> Personal
                    </Link>
                    <Link href="/dashboard/admin/payroll/timesheets" className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors">
                        <Clock className="h-4 w-4 text-emerald-500" /> Tiempos
                    </Link>
                    <Link href="/dashboard/admin/payroll/time-off" className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors">
                        <Calendar className="h-4 w-4 text-pink-500" /> Vacaciones
                    </Link>
                    <Link href="/dashboard/admin/payroll/reports" className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors">
                        <BarChart3 className="h-4 w-4 text-blue-400" /> Informes
                    </Link>
                    <Link href="/dashboard/admin/payroll/new" className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                        <Plus className="h-4 w-4" /> Generar Pago
                    </Link>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    {
                        icon: <DollarSign className="w-4 h-4 text-teal-400" />,
                        iconBg: "bg-teal-500/10",
                        label: "Nómina Pagada (YTD)",
                        value: analytics ? fmt(analytics.ytdTotal) : "—",
                        sub: analytics ? `${analytics.ytdCount} pagos` : "",
                        trend: null,
                        glow: "shadow-teal-900/20",
                    },
                    {
                        icon: <TrendingUp className="w-4 h-4 text-blue-400" />,
                        iconBg: "bg-blue-500/10",
                        label: "Nómina Mes Actual",
                        value: analytics ? fmt(analytics.currentMonthTotal) : "—",
                        sub: analytics ? `${analytics.currentMonthCount} liquidaciones` : "",
                        trend: analytics?.monthlyChange,
                        glow: "shadow-blue-900/20",
                    },
                    {
                        icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
                        iconBg: "bg-amber-500/10",
                        label: "Pagos Pendientes",
                        value: analytics ? String(analytics.pendingCount) : "—",
                        sub: analytics ? fmt(analytics.pendingTotal) : "",
                        trend: null,
                        glow: "shadow-amber-900/20",
                    },
                    {
                        icon: <Users className="w-4 h-4 text-violet-400" />,
                        iconBg: "bg-violet-500/10",
                        label: "Empleados Activos",
                        value: analytics ? String(analytics.activeEmployees) : "—",
                        sub: "Personal y contratistas",
                        trend: null,
                        glow: "shadow-violet-900/20",
                    },
                ].map((card, i) => (
                    <div key={i} className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm ${card.glow} relative overflow-hidden group`}>
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <div className="w-16 h-16">{card.icon}</div>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 ${card.iconBg} rounded-lg`}>{card.icon}</div>
                            <h3 className="text-slate-400 text-xs font-medium">{card.label}</h3>
                        </div>
                        <p className="text-xl font-bold text-white tabular-nums">{card.value}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-slate-500">{card.sub}</p>
                            {card.trend !== null && card.trend !== undefined && (
                                <span className={`text-xs font-mono font-bold ${card.trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {fmt2(card.trend)}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Bar Chart — 12 months */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-teal-500" /> Nómina Pagada — Últimos 12 Meses
                    </h3>
                    {isLoading ? (
                        <div className="h-44 flex items-center justify-center text-slate-600">Cargando...</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={176}>
                            <BarChart data={deptData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false}
                                    tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
                                <Tooltip
                                    contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                                    labelStyle={{ color: "#94a3b8" }}
                                    formatter={(v: any) => [fmt(v), "Total"]}
                                />
                                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                    {deptData.map((_: any, index: number) => (
                                        <Cell key={index} fill={index === deptData.length - 1 ? "#14b8a6" : "#1e293b"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Upcoming Payments */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" /> Próximos Vencimientos
                    </h3>
                    {upcoming.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">Sin pagos próximos</div>
                    ) : (
                        <ul className="space-y-3 flex-1 overflow-y-auto">
                            {upcoming.map((u) => (
                                <li key={u.id} className="flex items-center justify-between gap-2 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-slate-200 font-medium truncate max-w-[140px]">{u.employee?.firstName} {u.employee?.lastName}</span>
                                        <span className="text-slate-500 text-xs">{u.employee?.position}</span>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-amber-400 text-xs font-mono">{format(new Date(u.periodEnd), "dd MMM", { locale: es })}</div>
                                        <div className="text-slate-300 text-xs tabular-nums">{fmt(u.netPay)}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Link href="/dashboard/admin/payroll/new" className="mt-4 text-xs text-teal-400 hover:text-teal-300 text-center block">
                        Ver todos los pendientes →
                    </Link>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-800">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-1 bg-slate-950/60 rounded-lg p-1">
                            {[
                                { id: "payrolls", label: "Nóminas", icon: <FileText className="w-3.5 h-3.5" /> },
                                { id: "expenses", label: "Egresos Operativos", icon: <Receipt className="w-3.5 h-3.5" /> },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                        ? "bg-teal-600 text-white shadow"
                                        : "text-slate-400 hover:text-white"
                                    }`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 w-44"
                                />
                            </div>
                            {activeTab === "payrolls" && (
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-teal-500"
                                >
                                    <option value="ALL">Todos</option>
                                    <option value="PENDING">Pendientes</option>
                                    <option value="PAID">Pagados</option>
                                    <option value="CANCELLED">Cancelados</option>
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Tab: Payrolls ── */}
                {activeTab === "payrolls" && (
                    <>
                        {selectedIds.size > 0 && (
                            <div className="px-5 py-3 bg-teal-500/5 border-b border-teal-500/20 flex items-center justify-between">
                                <span className="text-sm text-teal-400">{selectedIds.size} nómina(s) seleccionada(s)</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedIds(new Set())}
                                        className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-md border border-slate-700 hover:border-slate-600 transition-colors"
                                    >
                                        Deseleccionar
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
                                    <tr>
                                        <th className="px-4 py-4 w-10">
                                            <button onClick={() => {
                                                if (selectedIds.size === filtered.length) setSelectedIds(new Set());
                                                else setSelectedIds(new Set(filtered.map((p: any) => p.id)));
                                            }}>
                                                {selectedIds.size === filtered.length && filtered.length > 0
                                                    ? <CheckSquare className="w-4 h-4 text-teal-400" />
                                                    : <Square className="w-4 h-4 text-slate-600" />
                                                }
                                            </button>
                                        </th>
                                        <th className="px-4 py-4 font-semibold">Empleado</th>
                                        <th className="px-4 py-4 font-semibold hidden md:table-cell">Departamento</th>
                                        <th className="px-4 py-4 font-semibold">Periodo</th>
                                        <th className="px-4 py-4 font-semibold text-right">Devengos</th>
                                        <th className="px-4 py-4 font-semibold text-right hidden lg:table-cell">Deducciones</th>
                                        <th className="px-4 py-4 font-semibold text-right">Neto</th>
                                        <th className="px-4 py-4 font-semibold text-center">Estado</th>
                                        <th className="px-4 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {isLoading ? (
                                        <tr><td colSpan={9} className="px-6 py-8 text-center text-slate-500">Cargando...</td></tr>
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-500">No hay nóminas que coincidan.</td></tr>
                                    ) : filtered.map((row: any) => (
                                        <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 py-4">
                                                <button onClick={() => toggleSelect(row.id)}>
                                                    {selectedIds.has(row.id)
                                                        ? <CheckSquare className="w-4 h-4 text-teal-400" />
                                                        : <Square className="w-4 h-4 text-slate-600" />
                                                    }
                                                </button>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-medium text-slate-200">{row.employeeName}</div>
                                                <div className="text-xs text-slate-500">{row.documentNumber}</div>
                                            </td>
                                            <td className="px-4 py-4 hidden md:table-cell">
                                                <div className="text-slate-400 text-xs">{row.department || "—"}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-slate-300 text-xs tabular-nums">
                                                    {format(parseISO(row.periodStart), "d MMM", { locale: es })} — {format(parseISO(row.periodEnd), "d MMM yyyy", { locale: es })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right tabular-nums text-emerald-400 text-sm">{fmt(row.totalEarnings)}</td>
                                            <td className="px-4 py-4 text-right tabular-nums text-red-400 text-sm hidden lg:table-cell">-{fmt(row.totalDeductions)}</td>
                                            <td className="px-4 py-4 text-right tabular-nums text-white font-medium">{fmt(row.netPay)}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-widest uppercase border ${STATUS_CFG[row.status]?.cls || STATUS_CFG.PENDING.cls}`}>
                                                        {STATUS_CFG[row.status]?.label || row.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <Link href={`/dashboard/admin/payroll/${row.id}`} className="text-slate-400 hover:text-teal-400 transition-colors inline-flex p-1">
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ── Tab: Expenses ── */}
                {activeTab === "expenses" && (
                    <>
                        <div className="p-4 flex items-center justify-between border-b border-slate-800/60">
                            {expenseStats && (
                                <div className="flex items-center gap-4">
                                    <div className="text-sm">
                                        <span className="text-slate-400">Total: </span>
                                        <span className="text-white font-bold">{fmt(expenseStats.currentMonthTotal)}</span>
                                        <span className="text-slate-500 text-xs ml-1">este mes</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-amber-400 font-medium">{expenseStats.currentMonthCount}</span>
                                        <span className="text-slate-500 text-xs ml-1">egresos</span>
                                    </div>
                                </div>
                            )}
                            <Link
                                href="/dashboard/admin/payroll/expenses"
                                className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-500 transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" /> Nuevo Egreso
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold">Descripción</th>
                                        <th className="px-5 py-4 font-semibold">Categoría</th>
                                        <th className="px-5 py-4 font-semibold">Proveedor</th>
                                        <th className="px-5 py-4 font-semibold">Fecha</th>
                                        <th className="px-5 py-4 font-semibold text-right">Monto</th>
                                        <th className="px-5 py-4 font-semibold text-center">Estado</th>
                                        <th className="px-5 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {isLoading ? (
                                        <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Cargando...</td></tr>
                                    ) : expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Receipt className="w-8 h-8 text-slate-600" />
                                                    <p className="text-slate-500">Sin egresos registrados.</p>
                                                    <Link href="/dashboard/admin/payroll/expenses" className="text-teal-400 text-sm hover:text-teal-300">Registrar primer egreso →</Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : expenses.filter(e => !search || e.title?.toLowerCase().includes(search.toLowerCase())).map((exp: any) => (
                                        <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="font-medium text-slate-200">{exp.title}</div>
                                                {exp.reference && <div className="text-xs text-slate-500">Ref: {exp.reference}</div>}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                                                    <span className="w-2 h-2 rounded-full" style={{ background: exp.category?.color || "#6b7280" }} />
                                                    {exp.category?.name || "Sin categoría"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-400 text-sm">{exp.vendor || "—"}</td>
                                            <td className="px-5 py-4 text-slate-400 text-xs">{exp.date ? format(new Date(exp.date), "dd MMM yyyy", { locale: es }) : "—"}</td>
                                            <td className="px-5 py-4 text-right tabular-nums text-white font-medium">{fmt(exp.amount)}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-widest uppercase border ${exp.status === "APPROVED" || exp.status === "PAID"
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                        : exp.status === "REJECTED"
                                                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                                                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                        }`}>
                                                        {exp.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <Link href="/dashboard/admin/payroll/expenses" className="text-slate-400 hover:text-teal-400 transition-colors inline-flex p-1">
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
