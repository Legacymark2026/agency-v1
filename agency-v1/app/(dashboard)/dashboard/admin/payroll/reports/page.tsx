"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    ArrowLeft, BarChart3, FileText, Download, Users, DollarSign,
    TrendingUp, Building2, Loader2, CheckCircle, Activity
} from "lucide-react";
import { getPayrollAnalytics, getPayrollByDepartment, exportPayrollsCSV, generatePILAReport } from "@/actions/payroll";
import { getExpenseStats } from "@/actions/expenses";
import { toast } from "sonner";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from "recharts";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

export default function PayrollReportsPage() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [deptData, setDeptData] = useState<any[]>([]);
    const [expenseStats, setExpenseStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingPILA, setIsGeneratingPILA] = useState(false);
    const [pilaRows, setPilaRows] = useState<any[]>([]);
    const [pilaPeriod, setPilaPeriod] = useState("");
    const [workedDays, setWorkedDays] = useState(30);

    const load = useCallback(async () => {
        setIsLoading(true);
        const [aRes, dRes, esRes] = await Promise.all([
            getPayrollAnalytics(),
            getPayrollByDepartment(),
            getExpenseStats(),
        ]);
        if (aRes.success) setAnalytics(aRes.data);
        if (dRes.success) setDeptData(dRes.data);
        if (esRes.success) setExpenseStats(esRes.data);
        setIsLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleGeneratePILA = async () => {
        setIsGeneratingPILA(true);
        const res = await generatePILAReport(workedDays);
        if (res.success) {
            setPilaRows(res.rows);
            setPilaPeriod(res.period || "");
            toast.success(`PILA generada: ${res.rows.length} empleados`);
        } else {
            toast.error("Error al generar el reporte PILA");
        }
        setIsGeneratingPILA(false);
    };

    const handleDownloadPILA = async () => {
        const res = await generatePILAReport(workedDays);
        if (res.success && res.csv) {
            const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url;
            a.download = `PILA_${res.period || new Date().toISOString().split("T")[0]}.csv`;
            a.click();
            toast.success("Descarga iniciada");
        }
    };

    const handleExportNomina = async () => {
        const res = await exportPayrollsCSV();
        if (res.success && res.csv) {
            const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url;
            a.download = `nominas_${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
        }
    };

    const CHART_COLORS = ["#14b8a6", "#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#a855f7", "#64748b"];
    const donutData = [
        { name: "Nómina", value: analytics?.currentMonthTotal || 0, color: "#14b8a6" },
        { name: "Egresos Operativos", value: expenseStats?.currentMonthTotal || 0, color: "#6366f1" },
    ].filter(d => d.value > 0);

    const totalCost = analytics ? analytics.currentMonthTotal * 1.30 : 0; // Approx with employer contributions

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/payroll" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-1">
                            <BarChart3 className="w-3.5 h-3.5" /> INFORMES Y ANALYTICS
                        </div>
                        <h1 className="text-2xl font-bold text-white">Reportes de Nómina</h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExportNomina} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors">
                        <Download className="w-4 h-4" /> Exportar Nóminas
                    </button>
                </div>
            </div>

            {/* Executive Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Pagado YTD", value: analytics ? fmt(analytics.ytdTotal) : "—", sub: `${analytics?.ytdCount || 0} liquidaciones`, color: "text-teal-400", icon: <DollarSign className="w-4 h-4" /> },
                    { label: "Mes Actual (Nómina)", value: analytics ? fmt(analytics.currentMonthTotal) : "—", sub: "Empleados y contratistas", color: "text-blue-400", icon: <TrendingUp className="w-4 h-4" /> },
                    { label: "Costo Empleador Est.", value: analytics ? fmt(totalCost) : "—", sub: "Incluye parafiscales ~30%", color: "text-amber-400", icon: <Building2 className="w-4 h-4" /> },
                    { label: "Empleados Activos", value: analytics ? String(analytics.activeEmployees) : "—", sub: "Personal registrado", color: "text-violet-400", icon: <Users className="w-4 h-4" /> },
                ].map((card, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <div className={`p-2 inline-flex rounded-lg mb-3 ${i === 0 ? "bg-teal-500/10 text-teal-400" : i === 1 ? "bg-blue-500/10 text-blue-400" : i === 2 ? "bg-amber-500/10 text-amber-400" : "bg-violet-500/10 text-violet-400"}`}>
                            {card.icon}
                        </div>
                        <p className="text-slate-500 text-xs">{card.label}</p>
                        <p className={`text-xl font-bold tabular-nums mt-1 ${card.color}`}>{card.value}</p>
                        <p className="text-slate-600 text-xs mt-1">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Monthly Chart */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-teal-500" /> Nómina Pagada — Últimos 12 Meses
                    </h3>
                    {isLoading ? (
                        <div className="h-48 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={192}>
                            <BarChart data={analytics?.chartData || []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false}
                                    tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
                                <Tooltip
                                    contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                                    labelStyle={{ color: "#94a3b8" }}
                                    formatter={(v: any) => [fmt(v), "Nómina Pagada"]}
                                />
                                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                    {(analytics?.chartData || []).map((_: any, index: number, arr: any[]) => (
                                        <Cell key={index} fill={index === arr.length - 1 ? "#14b8a6" : "#1e293b"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Cost Distribution Donut */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Distribución de Costos (Mes)</h3>
                    {donutData.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-slate-600 text-sm">Sin datos este mes</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={192}>
                            <PieChart>
                                <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                                    {donutData.map((d: any, i: number) => <Cell key={i} fill={d.color} />)}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                                    formatter={(v: any) => [fmt(v)]}
                                />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Department Breakdown */}
            {deptData.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-400" /> Nómina Acumulada por Departamento
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={deptData} layout="vertical" margin={{ left: 30 }}>
                                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false}
                                    tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
                                <YAxis type="category" dataKey="department" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                                    formatter={(v: any) => [fmt(v), "Total"]}
                                />
                                <Bar dataKey="total" radius={[0, 4, 4, 0]} fill="#6366f1" />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="space-y-3">
                            {deptData.map((d, i) => (
                                <div key={d.department} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800/60">
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400 text-xs font-mono w-4">{i + 1}.</span>
                                        <div>
                                            <div className="text-slate-200 text-sm font-medium">{d.department}</div>
                                            <div className="text-slate-500 text-xs">{d.count} pagos</div>
                                        </div>
                                    </div>
                                    <span className="text-white font-bold tabular-nums text-sm">{fmt(d.total)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* PILA Report Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-400" /> Planilla PILA — Aportes Seguridad Social
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">Genera el reporte de aportes a EPS, AFP, ARL, SENA, ICBF y Caja para todos los empleados con contrato laboral.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-400">Días trabajados:</label>
                            <input
                                type="number" min={1} max={30}
                                value={workedDays} onChange={e => setWorkedDays(Number(e.target.value))}
                                className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-teal-500"
                            />
                        </div>
                        <button
                            onClick={handleGeneratePILA}
                            disabled={isGeneratingPILA}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors disabled:opacity-50"
                        >
                            {isGeneratingPILA ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Vista Previa
                        </button>
                        <button
                            onClick={handleDownloadPILA}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
                        >
                            <Download className="w-4 h-4" /> Descargar CSV
                        </button>
                    </div>
                </div>

                {pilaRows.length > 0 ? (
                    <div className="overflow-x-auto">
                        <div className="p-3 bg-emerald-500/5 border-b border-emerald-500/20">
                            <p className="text-xs text-emerald-400 font-mono">PERÍODO: {pilaPeriod} · {pilaRows.length} empleados · ${pilaRows.reduce((s, r) => s + r.totalContribution, 0).toLocaleString("es-CO")} total aportes</p>
                        </div>
                        <table className="w-full text-xs text-left min-w-[900px]">
                            <thead className="text-[10px] text-slate-500 uppercase bg-slate-900/50 border-b border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Empleado</th>
                                    <th className="px-4 py-3">Documento</th>
                                    <th className="px-4 py-3">EPS</th>
                                    <th className="px-4 py-3">AFP</th>
                                    <th className="px-4 py-3 text-right">IBC</th>
                                    <th className="px-4 py-3 text-right">Días</th>
                                    <th className="px-4 py-3 text-right">Salud (Emp.)</th>
                                    <th className="px-4 py-3 text-right">Pensión (Emp.)</th>
                                    <th className="px-4 py-3 text-right">SENA</th>
                                    <th className="px-4 py-3 text-right">ICBF</th>
                                    <th className="px-4 py-3 text-right">Caja</th>
                                    <th className="px-4 py-3 text-right font-bold text-emerald-400">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {pilaRows.map((row: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="px-4 py-3 text-slate-200 font-medium">{row.firstName} {row.lastName}</td>
                                        <td className="px-4 py-3 text-slate-400">{row.documentType} {row.documentNumber}</td>
                                        <td className="px-4 py-3 text-slate-400">{row.eps}</td>
                                        <td className="px-4 py-3 text-slate-400">{row.pension}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-300">${row.ibc.toLocaleString("es-CO")}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-400">{row.days}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-blue-400">${row.healthEmployer.toLocaleString("es-CO")}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-blue-400">${row.pensionEmployer.toLocaleString("es-CO")}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-400">${row.sena.toLocaleString("es-CO")}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-400">${row.icbf.toLocaleString("es-CO")}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-400">${row.caja.toLocaleString("es-CO")}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-emerald-400 font-bold">${row.totalContribution.toLocaleString("es-CO")}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t border-slate-700 bg-slate-950/60">
                                <tr>
                                    <td colSpan={4} className="px-4 py-3 text-slate-400 font-semibold text-xs uppercase">TOTALES</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-white font-bold">${pilaRows.reduce((s: number, r: any) => s + r.ibc, 0).toLocaleString("es-CO")}</td>
                                    <td className="px-4 py-3"></td>
                                    <td className="px-4 py-3 text-right tabular-nums text-blue-300 font-bold">${pilaRows.reduce((s: number, r: any) => s + r.healthEmployer, 0).toLocaleString("es-CO")}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-blue-300 font-bold">${pilaRows.reduce((s: number, r: any) => s + r.pensionEmployer, 0).toLocaleString("es-CO")}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-300 font-bold">${pilaRows.reduce((s: number, r: any) => s + r.sena, 0).toLocaleString("es-CO")}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-300 font-bold">${pilaRows.reduce((s: number, r: any) => s + r.icbf, 0).toLocaleString("es-CO")}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-300 font-bold">${pilaRows.reduce((s: number, r: any) => s + r.caja, 0).toLocaleString("es-CO")}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-emerald-300 font-bold">${pilaRows.reduce((s: number, r: any) => s + r.totalContribution, 0).toLocaleString("es-CO")}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-500">Haz clic en "Vista Previa" para calcular los aportes PILA del período actual.</p>
                        <p className="text-slate-600 text-xs mt-1">Solo aplica para empleados con contrato laboral activo.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
