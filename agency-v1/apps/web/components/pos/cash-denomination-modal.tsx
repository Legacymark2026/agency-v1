"use client";

import { useState } from "react";
import { DollarSign, Wallet, ArrowDownRight, ArrowUpRight, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

interface DenominationRow {
    label: string;
    value: number;
    count: number;
}

const INITIAL_DENOMINATIONS: DenominationRow[] = [
    { label: "Billete $ 100.000", value: 100000, count: 0 },
    { label: "Billete $ 50.000", value: 50000, count: 0 },
    { label: "Billete $ 20.000", value: 20000, count: 0 },
    { label: "Billete $ 10.000", value: 10000, count: 0 },
    { label: "Billete $ 5.000", value: 5000, count: 0 },
    { label: "Billete $ 2.000", value: 2000, count: 0 },
    { label: "Moneda $ 1.000", value: 1000, count: 0 },
    { label: "Moneda $ 500", value: 500, count: 0 },
    { label: "Moneda $ 200", value: 200, count: 0 },
    { label: "Moneda $ 100", value: 100, count: 0 },
];

interface CashDenominationModalProps {
    expectedCash: number;
    onClose: () => void;
    onConfirmClose: (totalCounted: number, breakdown: any) => void;
}

export function CashDenominationModal({ expectedCash, onClose, onConfirmClose }: CashDenominationModalProps) {
    const [denominations, setDenominations] = useState<DenominationRow[]>(INITIAL_DENOMINATIONS);
    const [activeTab, setActiveTab] = useState<"DENOMINATIONS" | "PAID_OUT">("DENOMINATIONS");
    const [paidOutAmount, setPaidOutAmount] = useState<number>(0);
    const [paidOutReason, setPaidOutReason] = useState<string>("");
    const [paidOutList, setPaidOutList] = useState<Array<{ amount: number; reason: string; time: string }>>([]);

    const handleCountChange = (index: number, count: number) => {
        const updated = [...denominations];
        updated[index].count = Math.max(0, count);
        setDenominations(updated);
    };

    const physicalTotal = denominations.reduce((acc, d) => acc + (d.value * d.count), 0);
    const totalPaidOut = paidOutList.reduce((acc, p) => acc + p.amount, 0);

    const difference = physicalTotal - expectedCash;
    const fmtCOP = (n: number) => `$ ${n.toLocaleString("es-CO")}`;

    const handleAddPaidOut = (e: React.FormEvent) => {
        e.preventDefault();
        if (paidOutAmount <= 0 || !paidOutReason) return;
        setPaidOutList([...paidOutList, {
            amount: paidOutAmount,
            reason: paidOutReason,
            time: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
        }]);
        setPaidOutAmount(0);
        setPaidOutReason("");
        alert("✅ Egreso de dinero (Paid Out) registrado correctamente en el turno.");
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-5 text-white max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* HEADER */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                        <Wallet className="w-5 h-5 text-teal-400" />
                        <div>
                            <h3 className="font-bold text-base">Arqueo Z & Conteo de Billetes por Denominación</h3>
                            <p className="text-xs text-slate-400">Verifica el efectivo físico real antes de cerrar la sesión de caja.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
                </div>

                {/* TABS */}
                <div className="flex border-b border-slate-800 gap-4">
                    <button
                        onClick={() => setActiveTab("DENOMINATIONS")}
                        className={`pb-2.5 font-bold text-xs border-b-2 transition-all ${
                            activeTab === "DENOMINATIONS" ? "border-teal-400 text-teal-300" : "border-transparent text-slate-400"
                        }`}
                    >
                        💵 Conteo de Efectivo por Denominación
                    </button>
                    <button
                        onClick={() => setActiveTab("PAID_OUT")}
                        className={`pb-2.5 font-bold text-xs border-b-2 transition-all ${
                            activeTab === "PAID_OUT" ? "border-amber-400 text-amber-300" : "border-transparent text-slate-400"
                        }`}
                    >
                        📤 Movimientos de Caja (Paid Out / Ingresos)
                    </button>
                </div>

                {activeTab === "DENOMINATIONS" && (
                    <div className="space-y-4">
                        {/* DENOMINATIONS GRID */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                            {denominations.map((d, idx) => (
                                <div key={d.label} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                                    <div>
                                        <span className="font-bold text-xs text-slate-200 block">{d.label}</span>
                                        <span className="text-[11px] text-teal-400 font-semibold">{fmtCOP(d.value * d.count)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => handleCountChange(idx, d.count - 1)}
                                            className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-bold text-xs flex items-center justify-center"
                                        >-</button>
                                        <input
                                            type="number"
                                            value={d.count}
                                            onChange={(e) => handleCountChange(idx, parseInt(e.target.value) || 0)}
                                            className="w-14 bg-slate-900 border border-slate-700 text-center font-bold text-xs rounded-lg py-1 text-white"
                                        />
                                        <button
                                            onClick={() => handleCountChange(idx, d.count + 1)}
                                            className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-bold text-xs flex items-center justify-center"
                                        >+</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* SUMMARY CARD */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-400">
                                <span>Efectivo Esperado en Sistema (Apertura + Ventas):</span>
                                <span className="font-bold text-white">{fmtCOP(expectedCash)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Conteo Físico Real Ingresado:</span>
                                <span className="font-bold text-teal-300">{fmtCOP(physicalTotal)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-sm">
                                <span>Diferencia (Sobrante / Faltante):</span>
                                <span className={difference === 0 ? "text-emerald-400" : difference > 0 ? "text-emerald-300" : "text-rose-400"}>
                                    {difference === 0 ? "✓ Cuadrada $ 0" : difference > 0 ? `+ ${fmtCOP(difference)} (Sobrante)` : `- ${fmtCOP(Math.abs(difference))} (Faltante)`}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "PAID_OUT" && (
                    <div className="space-y-4 text-xs">
                        <form onSubmit={handleAddPaidOut} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                            <h4 className="font-bold text-white flex items-center gap-1.5">
                                <ArrowUpRight className="w-4 h-4 text-amber-400" /> Registrar Salida / Retiro Menor de Efectivo (Paid Out)
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Monto Retirado ($)</label>
                                    <input
                                        type="number"
                                        value={paidOutAmount || ""}
                                        onChange={(e) => setPaidOutAmount(Number(e.target.value))}
                                        placeholder="Ej: 25000"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-bold text-white text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Concepto / Justificación</label>
                                    <input
                                        type="text"
                                        value={paidOutReason}
                                        onChange={(e) => setPaidOutReason(e.target.value)}
                                        placeholder="Ej: Pago taxi domicilio / Transporte"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-bold text-white text-xs"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-all shadow-md shadow-amber-600/20"
                            >
                                Registrar Paid Out
                            </button>
                        </form>

                        {/* LIST OF PAID OUTS */}
                        <div className="space-y-2">
                            <h5 className="font-bold text-slate-300">Historial de Salidas en este Turno ({paidOutList.length})</h5>
                            {paidOutList.length === 0 ? (
                                <p className="text-slate-500 text-center py-4 bg-slate-950 rounded-xl border border-slate-800">No hay egresos menores registrados en este turno.</p>
                            ) : (
                                paidOutList.map((p, idx) => (
                                    <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                                        <div>
                                            <span className="font-bold text-white block">{p.reason}</span>
                                            <span className="text-[10px] text-slate-500">{p.time}</span>
                                        </div>
                                        <span className="font-extrabold text-amber-400">-{fmtCOP(p.amount)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* FOOTER ACTIONS */}
                <div className="flex gap-2 pt-2 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirmClose(physicalTotal, denominations)}
                        className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 flex items-center justify-center gap-1.5"
                    >
                        <ShieldCheck className="w-4 h-4" /> Confirmar Arqueo Z & Cerrar Caja
                    </button>
                </div>
            </div>
        </div>
    );
}
