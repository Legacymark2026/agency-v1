"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, FileText, CheckCircle2, Copy, Download, Loader2, Landmark,
    RefreshCw, GitBranch, AlertCircle, Clock, Activity, Building2, Info
} from "lucide-react";
import { getPayrollById, updatePayrollStatus, cancelPayroll, clonePayroll } from "@/actions/payroll";
import { getFinancialAccounts, recordTransaction } from "@/actions/treasury";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { calculatePayroll } from "@/lib/payroll";

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount);

const DIAN_STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
    PENDING: { label: "Pendiente DIAN", cls: "text-amber-400", dot: "bg-amber-400" },
    SENT: { label: "Enviado a DIAN", cls: "text-blue-400", dot: "bg-blue-400" },
    ACCEPTED: { label: "Aceptado DIAN", cls: "text-emerald-400", dot: "bg-emerald-400" },
    REJECTED: { label: "Rechazado DIAN", cls: "text-red-400", dot: "bg-red-400" },
};

export default function PayrollDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [payroll, setPayroll] = useState<any>(null);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState("");
    const [cancelReason, setCancelReason] = useState("");
    const [clonePeriodStart, setClonePeriodStart] = useState("");
    const [clonePeriodEnd, setClonePeriodEnd] = useState("");

    useEffect(() => {
        async function fetchDocs() {
            const [payRes, accRes] = await Promise.all([
                getPayrollById(params.id),
                getFinancialAccounts(),
            ]);
            if (payRes.success) setPayroll(payRes.data);
            if (accRes.success) {
                setAccounts(accRes.data);
                if (accRes.data.length > 0) setSelectedAccountId(accRes.data[0].id);
            }

            // Pre-fill clone dates (next period)
            if (payRes.data) {
                const end = new Date(payRes.data.periodEnd);
                const nextStart = new Date(end);
                nextStart.setDate(nextStart.getDate() + 1);
                const nextEnd = new Date(nextStart);
                nextEnd.setDate(nextEnd.getDate() + 29);
                setClonePeriodStart(nextStart.toISOString().split("T")[0]);
                setClonePeriodEnd(nextEnd.toISOString().split("T")[0]);
            }

            setIsLoading(false);
        }
        fetchDocs();
    }, [params.id]);

    const confirmPayment = async () => {
        if (!selectedAccountId) { toast.error("Debes seleccionar una cuenta de origen"); return; }
        setIsUpdating(true);
        const txRes = await recordTransaction({
            accountId: selectedAccountId,
            type: "EXPENSE",
            amount: payroll.netPay,
            category: "PAYROLL",
            description: `Pago Nómina: ${payroll.employee.firstName} ${payroll.employee.lastName}`,
            date: new Date().toISOString().split("T")[0],
            payrollId: payroll.id,
        });
        if (!txRes.success) { toast.error(txRes.error || "Error al descontar de tesorería"); setIsUpdating(false); return; }
        const res = await updatePayrollStatus(params.id, "PAID");
        if (res.success) {
            toast.success("Nómina pagada y deducida de la cuenta");
            setPayroll({ ...payroll, status: "PAID" });
            setShowPaymentModal(false);
            router.refresh();
        } else toast.error(res.error || "Error al actualizar el estado");
        setIsUpdating(false);
    };

    const confirmCancel = async () => {
        setIsUpdating(true);
        const res = await cancelPayroll(params.id, cancelReason);
        if (res.success) {
            toast.success("Nómina cancelada");
            setPayroll({ ...payroll, status: "CANCELLED" });
            setShowCancelModal(false);
        } else toast.error(res.error || "Error al cancelar");
        setIsUpdating(false);
    };

    const confirmClone = async () => {
        if (!clonePeriodStart || !clonePeriodEnd) { toast.error("Ingresa las fechas del nuevo período"); return; }
        setIsUpdating(true);
        const res = await clonePayroll(params.id, clonePeriodStart, clonePeriodEnd);
        if (res.success) {
            toast.success("Período clonado correctamente");
            setShowCloneModal(false);
            router.push(`/dashboard/admin/payroll/${res.payrollId}`);
        } else toast.error(res.error || "Error al clonar");
        setIsUpdating(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => toast.success("Copiado al portapapeles"));
    };

    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>;
    if (!payroll) return <div className="p-10 text-center text-slate-400">Nómina no encontrada.</div>;

    const earnings = payroll.items.filter((i: any) => i.type === "EARNING");
    const deductions = payroll.items.filter((i: any) => i.type === "DEDUCTION");
    const dianCfg = DIAN_STATUS_CFG[payroll.dianStatus || "PENDING"] || DIAN_STATUS_CFG.PENDING;

    // Employer contributions calculation (for display)
    const empCalc = calculatePayroll(payroll.employee.baseSalary, payroll.employee.contractType);
    const employerContribs = empCalc.employerContributions;

    const auditLogs = payroll.auditLogs || [];

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 flex-wrap">
                <Link href="/dashboard/admin/payroll" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Liquidación — {payroll.employee.firstName} {payroll.employee.lastName}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Periodo: {format(new Date(payroll.periodStart), "d MMM yyyy", { locale: es })} — {format(new Date(payroll.periodEnd), "d MMM yyyy", { locale: es })}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {payroll.status === "PENDING" && (
                        <>
                            <button onClick={() => setShowCloneModal(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors">
                                <GitBranch className="w-4 h-4" /> Clonar Período
                            </button>
                            <button onClick={() => setShowCancelModal(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md border border-red-500/20 transition-colors">
                                <AlertCircle className="w-4 h-4" /> Cancelar
                            </button>
                            <button onClick={() => setShowPaymentModal(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-md transition-colors">
                                <CheckCircle2 className="w-4 h-4" /> Marcar como Pagada
                            </button>
                        </>
                    )}
                    {payroll.status === "PAID" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ✅ PAGADA
                        </span>
                    )}
                    {payroll.status === "CANCELLED" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold tracking-widest uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                            CANCELADA
                        </span>
                    )}
                </div>
            </div>

            {/* Employee + DIAN Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Datos del Empleado</h3>
                    <div className="space-y-2.5">
                        {[
                            ["Nombre", `${payroll.employee.firstName} ${payroll.employee.lastName}`],
                            ["Documento", `${payroll.employee.documentType} ${payroll.employee.documentNumber}`],
                            ["Cargo", payroll.employee.position],
                            ["Departamento", payroll.employee.department || "—"],
                            ["Contrato", payroll.employee.contractType],
                            ["Salario Base", formatCurrency(payroll.employee.baseSalary)],
                        ].map(([label, val]) => (
                            <div key={label} className="flex justify-between items-start border-b border-slate-800/40 pb-2 last:border-0 last:pb-0">
                                <span className="text-slate-500 text-sm">{label}</span>
                                <span className="text-slate-200 text-sm font-medium text-right">{val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Estado DIAN</h3>
                    <div className="space-y-2.5">
                        <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
                            <span className="text-slate-500 text-sm">Electrónica</span>
                            <span className="text-slate-200 text-sm font-medium">{payroll.isElectronic ? "SÍ" : "NO"}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
                            <span className="text-slate-500 text-sm">Estado</span>
                            <span className={`flex items-center gap-1.5 text-sm font-mono font-medium ${dianCfg.cls}`}>
                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dianCfg.dot}`} />
                                {dianCfg.label}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
                            <span className="text-slate-500 text-sm flex items-center gap-1">
                                CUNE
                                {payroll.cune && (
                                    <button onClick={() => copyToClipboard(payroll.cune)} className="hover:text-white">
                                        <Copy className="w-3 h-3" />
                                    </button>
                                )}
                            </span>
                            <span className="text-slate-500 text-xs font-mono">{payroll.cune || "No generado"}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
                            <span className="text-slate-500 text-sm">Método de Pago</span>
                            <span className="text-slate-200 text-sm">{payroll.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-sm">Fecha Emisión</span>
                            <span className="text-slate-200 text-sm">{format(new Date(payroll.issueDate), "d MMM yyyy", { locale: es })}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desglose */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-slate-800">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teal-500" /> Desglose de Liquidación
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                    {/* Devengos */}
                    <div className="p-5 space-y-3">
                        <h4 className="text-xs font-bold text-emerald-400 tracking-widest uppercase border-b border-slate-800/60 pb-2">Ingresos (Devengos)</h4>
                        {earnings.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-start">
                                <div>
                                    <div className="text-sm text-slate-200">{item.description}</div>
                                    <div className="text-xs text-slate-500 font-mono">{item.concept}</div>
                                </div>
                                <span className="text-sm font-medium text-emerald-400">{formatCurrency(item.amount)}</span>
                            </div>
                        ))}
                        <div className="pt-3 mt-3 border-t border-slate-800 flex justify-between">
                            <span className="text-slate-400 font-medium text-sm">Total Devengos</span>
                            <span className="text-lg font-bold text-emerald-400">{formatCurrency(payroll.totalEarnings)}</span>
                        </div>
                    </div>

                    {/* Deducciones */}
                    <div className="p-5 space-y-3">
                        <h4 className="text-xs font-bold text-red-400 tracking-widest uppercase border-b border-slate-800/60 pb-2">Deducciones (Empleado)</h4>
                        {deductions.length === 0 ? (
                            <div className="text-sm text-slate-500 italic">Sin deducciones.</div>
                        ) : deductions.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-start">
                                <div>
                                    <div className="text-sm text-slate-200">{item.description}</div>
                                    <div className="text-xs text-slate-500 font-mono">{item.concept}</div>
                                </div>
                                <span className="text-sm font-medium text-red-400">-{formatCurrency(item.amount)}</span>
                            </div>
                        ))}
                        <div className="pt-3 mt-3 border-t border-slate-800 flex justify-between">
                            <span className="text-slate-400 font-medium text-sm">Total Deducciones</span>
                            <span className="text-lg font-bold text-red-400">-{formatCurrency(payroll.totalDeductions)}</span>
                        </div>
                    </div>
                </div>

                {/* Net Pay */}
                <div className="p-6 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-slate-400 font-medium">NETO A PAGAR</p>
                        <p className="text-xs text-slate-500 mt-0.5">La transferencia debe hacerse por este monto exacto.</p>
                    </div>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
                        {formatCurrency(payroll.netPay)}
                    </span>
                </div>
            </div>

            {/* Employer Contributions (Parafiscales) — Read-only display */}
            {payroll.employee.contractType === "LABORAL" && employerContribs.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-slate-800">
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-400" /> Parafiscales del Empleador
                            <span className="text-xs text-slate-500 font-normal ml-2">(No se descuentan al empleado)</span>
                        </h3>
                    </div>
                    <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
                        {employerContribs.map((c, i) => (
                            <div key={i} className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/60">
                                <div className="text-xs text-slate-500">{c.description}</div>
                                <div className="text-base font-bold text-blue-400 tabular-nums mt-1">{formatCurrency(c.amount)}</div>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 pb-5 flex justify-between items-center">
                        <span className="text-slate-500 text-sm">Costo Total Empresa (empleado + parafiscales)</span>
                        <span className="text-xl font-bold text-white tabular-nums">{formatCurrency(payroll.netPay + employerContribs.reduce((s, c) => s + c.amount, 0))}</span>
                    </div>
                </div>
            )}

            {/* Audit Timeline */}
            {auditLogs.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-slate-400" /> Historial de Acciones
                    </h3>
                    <div className="space-y-3">
                        {auditLogs.map((log: any, i: number) => (
                            <div key={log.id} className="flex items-start gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                                    {i < auditLogs.length - 1 && <div className="w-px h-full bg-slate-800 mt-1" />}
                                </div>
                                <div className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-teal-400 uppercase tracking-wider">{log.action}</span>
                                        <span className="text-slate-600 text-xs">•</span>
                                        <span className="text-slate-500 text-xs">{log.user?.name || log.user?.firstName || "Sistema"}</span>
                                    </div>
                                    <div className="text-slate-600 text-xs mt-0.5">{format(new Date(log.createdAt), "d MMM yyyy, HH:mm", { locale: es })}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Notes */}
            {payroll.notes && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" /> Notas Internas
                    </h3>
                    <p className="text-slate-300 text-sm">{payroll.notes}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end">
                <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-md transition-colors border border-slate-700">
                    <Download className="w-4 h-4" /> Generar Desprendible PDF
                </button>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg"><Landmark className="w-5 h-5 text-emerald-500" /></div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Efectuar Pago</h3>
                                <p className="text-xs text-slate-400">Selecciona la cuenta de origen.</p>
                            </div>
                        </div>
                        <div className="space-y-4 my-6">
                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                                <span className="text-sm text-slate-400">Total a debitar:</span>
                                <span className="text-xl font-bold text-white">{formatCurrency(payroll.netPay)}</span>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold tracking-wide uppercase text-slate-400">Cuenta de Origen</label>
                                {accounts.length === 0 ? (
                                    <div className="text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                        No tienes cuentas financieras. Ve al módulo de Tesorería.
                                    </div>
                                ) : (
                                    <select
                                        value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name} — {formatCurrency(acc.balance)}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors">Cancelar</button>
                            <button onClick={confirmPayment} disabled={isUpdating || accounts.length === 0} className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors disabled:opacity-50 min-w-[140px] justify-center">
                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar y Pagar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clone Modal */}
            {showCloneModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg"><GitBranch className="w-5 h-5 text-blue-400" /></div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Clonar Período</h3>
                                <p className="text-xs text-slate-400">Genera una nueva liquidación para el siguiente período.</p>
                            </div>
                        </div>
                        <div className="space-y-4 my-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold tracking-wide uppercase text-slate-400">Inicio del Nuevo Período</label>
                                <input type="date" value={clonePeriodStart} onChange={e => setClonePeriodStart(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold tracking-wide uppercase text-slate-400">Fin del Nuevo Período</label>
                                <input type="date" value={clonePeriodEnd} onChange={e => setClonePeriodEnd(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowCloneModal(false)} className="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors">Cancelar</button>
                            <button onClick={confirmClone} disabled={isUpdating} className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors disabled:opacity-50 min-w-[120px] justify-center">
                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><GitBranch className="w-4 h-4" /> Clonar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/10 rounded-lg"><AlertCircle className="w-5 h-5 text-red-400" /></div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Cancelar Nómina</h3>
                                <p className="text-xs text-slate-400">Esta acción es irreversible.</p>
                            </div>
                        </div>
                        <div className="my-5 space-y-2">
                            <label className="text-xs font-bold tracking-wide uppercase text-slate-400">Motivo (opcional)</label>
                            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} placeholder="Ej: Error en los datos del empleado..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500 resize-none" />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowCancelModal(false)} className="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors">Volver</button>
                            <button onClick={confirmCancel} disabled={isUpdating} className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors disabled:opacity-50 min-w-[120px] justify-center">
                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sí, Cancelar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
