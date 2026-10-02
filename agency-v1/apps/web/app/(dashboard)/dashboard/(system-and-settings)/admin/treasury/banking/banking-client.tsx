"use client";

import React, { useState } from "react";
import { 
    Landmark, Plus, RefreshCw, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, 
    Search, Filter, ShieldCheck, Zap
} from "lucide-react";
import { connectBankAction, runAutoReconciliationAction } from "@/actions/banking.actions";
import { format } from "date-fns";

export default function BankingDashboardClient({ initialConnections, initialTransactions }: any) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isReconciling, setIsReconciling] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            await connectBankAction("BELVO", "Bancolombia", "CHECKING");
            setShowModal(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleReconcile = async () => {
        setIsReconciling(true);
        try {
            const count = await runAutoReconciliationAction();
            alert(`¡Conciliación completada! Se auto-conciliaron ${count} transacciones exactas mediante el motor algorítmico.`);
        } catch (e) {
            console.error(e);
        } finally {
            setIsReconciling(false);
        }
    };

    const pendingTx = initialTransactions.filter((t: any) => t.status === "PENDING");
    const reconciledTx = initialTransactions.filter((t: any) => t.status === "RECONCILED");

    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-200 animate-in fade-in duration-500">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-800/60 bg-slate-900/40 sticky top-0 z-10 backdrop-blur-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                            <span>Finanzas</span> <span className="text-slate-700">/</span> <span className="text-emerald-500">Tesorería</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                            Open Banking & Conciliación
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20 flex items-center gap-1">
                                <ShieldCheck size={12}/> Zero-Touch
                            </span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleReconcile}
                            disabled={isReconciling || pendingTx.length === 0}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 rounded-xl transition-all font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            <Zap size={16} className={isReconciling ? "animate-pulse" : ""} />
                            {isReconciling ? "Conciliando..." : "Auto-Conciliar"}
                        </button>
                        <button 
                            onClick={() => setShowModal(true)}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                        >
                            <Landmark size={18} /> Conectar Banco
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8 space-y-8">
                {/* Connected Banks Grid */}
                <div>
                    <h2 className="text-lg font-bold text-white mb-4">Cuentas Bancarias Conectadas</h2>
                    {initialConnections.length === 0 ? (
                        <div className="p-8 border border-slate-800 border-dashed rounded-2xl text-center bg-slate-900/30">
                            <Landmark className="mx-auto text-slate-500 mb-3" size={32} />
                            <p className="text-slate-400">No tienes cuentas conectadas por API.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {initialConnections.map((conn: any) => (
                                <div key={conn.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-10 -mt-10" />
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{conn.bankName}</h3>
                                            <p className="text-xs text-slate-500 font-mono mt-1">{conn.accountId}</p>
                                        </div>
                                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                            <Landmark size={20} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-1">Saldo Sincronizado</p>
                                    <p className="text-3xl font-bold text-white mb-4">${conn.balance.toLocaleString('es-CO')}</p>
                                    <div className="flex items-center text-xs text-emerald-400 gap-1 bg-emerald-500/10 px-2 py-1 rounded-md w-max">
                                        <RefreshCw size={12} /> Sincronizado hoy
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Transactions Table */}
                <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/80">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            Movimientos Bancarios
                            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-xs">{initialTransactions.length}</span>
                        </h3>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/30 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800/60">
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Descripción Banco</th>
                                <th className="px-6 py-4">ID Ref</th>
                                <th className="px-6 py-4 text-right">Monto</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-800/40">
                            {initialTransactions.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hay movimientos importados.</td></tr>
                            )}
                            {initialTransactions.map((tx: any) => (
                                <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">{format(new Date(tx.date), 'yyyy-MM-dd HH:mm')}</td>
                                    <td className="px-6 py-4 font-medium text-slate-200">{tx.description}</td>
                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{tx.providerTxId}</td>
                                    <td className={`px-6 py-4 text-right font-mono font-medium ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                                        <div className="flex items-center justify-end gap-2">
                                            {tx.amount > 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14} className="text-rose-400"/>}
                                            ${Math.abs(tx.amount).toLocaleString("es-CO")}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {tx.status === 'RECONCILED' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <CheckCircle2 size={10} /> CONCILIADO
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                <AlertCircle size={10} /> PENDIENTE
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Connect Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden p-8 text-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Conexión Segura Open Banking</h2>
                        <p className="text-sm text-slate-400 mb-8">Utilizamos protocolos cifrados de grado bancario (API Belvo/Plaid) para sincronizar tus extractos en tiempo real. Solo lectura, sin acceso a fondos.</p>
                        
                        <button 
                            onClick={handleConnect} 
                            disabled={isConnecting}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {isConnecting ? <RefreshCw className="animate-spin" size={18} /> : <Landmark size={18} />}
                            {isConnecting ? "Estableciendo conexión encriptada..." : "Vincular Bancolombia (Demo)"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
