"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    ArrowLeft, Plus, Receipt, DollarSign, TrendingUp, TrendingDown,
    Filter, Search, CheckCircle2, XCircle, Loader2, Download, Trash2,
    Edit2, MoreHorizontal, Tag
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
    getExpenses, getExpenseStats, getExpenseCategories,
    createExpense, approveExpense, rejectExpense, markExpensePaid,
    deleteExpense, exportExpensesCSV
} from "@/actions/expenses";
import { getFinancialAccounts } from "@/actions/treasury";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "PENDIENTE", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    APPROVED: { label: "APROBADO", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    PAID: { label: "PAGADO", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    REJECTED: { label: "RECHAZADO", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({
        title: "", amount: 0, date: new Date().toISOString().split("T")[0],
        categoryId: "", vendor: "", description: "", reference: "",
        paymentMethod: "TRANSFER", accountId: "", notes: "",
    });

    const load = useCallback(async () => {
        setIsLoading(true);
        const [eRes, cRes, aRes, sRes] = await Promise.all([
            getExpenses(),
            getExpenseCategories(),
            getFinancialAccounts(),
            getExpenseStats(),
        ]);
        if (eRes.success) setExpenses(eRes.data);
        if (cRes.success) setCategories(cRes.data);
        if (aRes.success) setAccounts(aRes.data);
        if (sRes.success) setStats(sRes.data);
        setIsLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const resetForm = () => setForm({
        title: "", amount: 0, date: new Date().toISOString().split("T")[0],
        categoryId: "", vendor: "", description: "", reference: "",
        paymentMethod: "TRANSFER", accountId: "", notes: "",
    });

    const openCreate = () => { setEditingExpense(null); resetForm(); setShowModal(true); };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || form.amount <= 0) {
            toast.error("Completa título y monto");
            return;
        }
        setIsSaving(true);
        const res = await createExpense({
            ...form,
            categoryId: form.categoryId || undefined,
            accountId: form.accountId || undefined,
        });
        if (res.success) {
            toast.success("Egreso registrado correctamente");
            setShowModal(false);
            load();
        } else {
            toast.error(res.error || "Error al guardar");
        }
        setIsSaving(false);
    };

    const handleApprove = async (id: string) => {
        const res = await approveExpense(id);
        if (res.success) { toast.success("Aprobado"); load(); }
        else toast.error(res.error || "Error");
    };

    const handleReject = async (id: string) => {
        const res = await rejectExpense(id);
        if (res.success) { toast.success("Rechazado"); load(); }
        else toast.error(res.error || "Error");
    };

    const handleMarkPaid = async (id: string) => {
        const res = await markExpensePaid(id);
        if (res.success) { toast.success("Marcado como pagado"); load(); }
        else toast.error(res.error || "Error");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este egreso?")) return;
        const res = await deleteExpense(id);
        if (res.success) { toast.success("Egreso eliminado"); load(); }
        else toast.error(res.error || "Error");
    };

    const handleExport = async () => {
        const res = await exportExpensesCSV();
        if (res.success && res.csv) {
            const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `egresos_${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
        }
    };

    const filtered = expenses.filter(e => {
        const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.vendor?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "ALL" || e.status === statusFilter;
        const matchCat = categoryFilter === "ALL" || e.categoryId === categoryFilter;
        return matchSearch && matchStatus && matchCat;
    });

    const pieData = stats?.byCategory?.slice(0, 6) || [];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/payroll" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono mb-1">
                            <Receipt className="w-3.5 h-3.5" /> EGRESOS OPERATIVOS
                        </div>
                        <h1 className="text-2xl font-bold text-white">Gastos y Egresos</h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExport} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors">
                        <Download className="w-4 h-4" /> CSV
                    </button>
                    <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-md shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-colors">
                        <Plus className="w-4 h-4" /> Nuevo Egreso
                    </button>
                </div>
            </div>

            {/* KPI + Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="grid grid-cols-2 gap-4 lg:col-span-2">
                    {[
                        { label: "Total Acumulado", value: stats ? fmt(stats.totalAmount) : "—", sub: "Todos los egresos", color: "text-white" },
                        { label: "Mes Actual", value: stats ? fmt(stats.currentMonthTotal) : "—", sub: `${stats?.currentMonthCount || 0} egresos`, color: "text-teal-400" },
                        { label: "Pendientes", value: stats ? fmt(stats.pendingAmount) : "—", sub: "Por aprobar", color: "text-amber-400" },
                        { label: "Pagados", value: stats ? fmt(stats.paidAmount) : "—", sub: "Efectuados", color: "text-emerald-400" },
                    ].map((card, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                            <p className="text-slate-500 text-xs mb-1">{card.label}</p>
                            <p className={`text-lg font-bold tabular-nums ${card.color}`}>{card.value}</p>
                            <p className="text-slate-600 text-xs mt-1">{card.sub}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-violet-400" /> Por Categoría
                    </h3>
                    {pieData.length === 0 ? (
                        <div className="h-32 flex items-center justify-center text-slate-600 text-sm">Sin datos</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={150}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} dataKey="total" nameKey="categoryName">
                                    {pieData.map((entry: any, i: number) => (
                                        <Cell key={i} fill={entry.categoryColor || "#6366f1"} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 11 }}
                                    formatter={(v: any) => [fmt(v), "Total"]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                    <ul className="space-y-1 mt-2">
                        {pieData.slice(0, 4).map((c: any) => (
                            <li key={c.categoryId} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 text-slate-400">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.categoryColor }} />
                                    {c.categoryName}
                                </span>
                                <span className="text-slate-300 tabular-nums">{fmt(c.total)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800 flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[160px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                            type="text" placeholder="Buscar egreso..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                        />
                    </div>
                    <select
                        value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                    >
                        <option value="ALL">Todos los estados</option>
                        {Object.entries(STATUS_MAP).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                    </select>
                    <select
                        value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                    >
                        <option value="ALL">Todas las categorías</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
                            <tr>
                                <th className="px-5 py-4 font-semibold">Egreso</th>
                                <th className="px-5 py-4 font-semibold">Categoría</th>
                                <th className="px-5 py-4 font-semibold">Proveedor</th>
                                <th className="px-5 py-4 font-semibold">Fecha</th>
                                <th className="px-5 py-4 font-semibold text-right">Monto</th>
                                <th className="px-5 py-4 font-semibold text-center">Estado</th>
                                <th className="px-5 py-4 font-semibold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-teal-500 mx-auto" /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No hay egresos registrados.</td></tr>
                            ) : filtered.map((exp: any) => (
                                <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-5 py-4">
                                        <div className="font-medium text-slate-200">{exp.title}</div>
                                        {exp.reference && <div className="text-xs text-slate-600">Ref: {exp.reference}</div>}
                                        {exp.description && <div className="text-xs text-slate-500 truncate max-w-[200px]">{exp.description}</div>}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs" style={{ background: `${exp.category?.color}18`, color: exp.category?.color || "#94a3b8" }}>
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: exp.category?.color || "#94a3b8" }} />
                                            {exp.category?.name || "Sin cat."}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-slate-400 text-sm">{exp.vendor || "—"}</td>
                                    <td className="px-5 py-4 text-slate-400 text-xs">{exp.date ? format(new Date(exp.date), "d MMM yyyy", { locale: es }) : "—"}</td>
                                    <td className="px-5 py-4 text-right tabular-nums font-medium text-white">{fmt(exp.amount)}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-bold tracking-widest uppercase ${STATUS_MAP[exp.status]?.cls || STATUS_MAP.PENDING.cls}`}>
                                            {STATUS_MAP[exp.status]?.label || exp.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {exp.status === "PENDING" && (
                                                <>
                                                    <button onClick={() => handleApprove(exp.id)} title="Aprobar" className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleReject(exp.id)} title="Rechazar" className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors">
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {exp.status === "APPROVED" && (
                                                <button onClick={() => handleMarkPaid(exp.id)} title="Marcar Pagado" className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded transition-colors text-xs">
                                                    Pagar
                                                </button>
                                            )}
                                            {(exp.status === "PENDING" || exp.status === "REJECTED") && (
                                                <button onClick={() => handleDelete(exp.id)} title="Eliminar" className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Expense Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-500/10 rounded-lg"><Receipt className="w-5 h-5 text-teal-400" /></div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Nuevo Egreso</h3>
                                    <p className="text-xs text-slate-500">Registra un gasto operativo</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white p-1 rounded transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400">Descripción / Título *</label>
                                    <input
                                        required type="text" placeholder="Ej: Suscripción Adobe CC"
                                        value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400">Monto (COP) *</label>
                                    <input
                                        required type="number" min="0" step="1000"
                                        value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-teal-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400">Fecha *</label>
                                    <input
                                        required type="date"
                                        value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400">Categoría</label>
                                    <select
                                        value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                                    >
                                        <option value="">Sin categoría</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400">Proveedor / Beneficiario</label>
                                    <input
                                        type="text" placeholder="Ej: Google LLC"
                                        value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400">N° Factura / Referencia</label>
                                    <input
                                        type="text" placeholder="Ej: FAC-2024-001"
                                        value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400">Método de Pago</label>
                                    <select
                                        value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                                    >
                                        <option value="TRANSFER">Transferencia</option>
                                        <option value="CASH">Efectivo</option>
                                        <option value="CARD">Tarjeta</option>
                                        <option value="CHECK">Cheque</option>
                                    </select>
                                </div>
                                {accounts.length > 0 && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400">Cuenta de Débito</label>
                                        <select
                                            value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                                        >
                                            <option value="">Seleccionar cuenta...</option>
                                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} — {fmt(a.balance)}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400">Notas internas</label>
                                    <textarea
                                        placeholder="Notas adicionales..."
                                        value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                        rows={2}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors">
                                    Cancelar
                                </button>
                                <button
                                    type="submit" disabled={isSaving}
                                    className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-md transition-colors disabled:opacity-50 min-w-[120px] justify-center"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
