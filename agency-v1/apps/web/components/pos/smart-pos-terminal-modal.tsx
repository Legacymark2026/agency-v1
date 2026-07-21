"use client";

import { useState, useEffect } from "react";
import { CreditCard, Wifi, CheckCircle2, RefreshCw, AlertTriangle, ShieldCheck, Zap, Smartphone } from "lucide-react";

interface SmartPosTerminalModalProps {
    amount: number;
    customerName: string;
    onClose: () => void;
    onPaymentApproved: (approvalCode: string, cardType: string) => void;
}

export function SmartPosTerminalModal({ amount, customerName, onClose, onPaymentApproved }: SmartPosTerminalModalProps) {
    const [status, setStatus] = useState<"PAIRING" | "WAITING_CARD" | "PROCESSING" | "APPROVED" | "FAILED">("PAIRING");
    const [selectedProvider, setSelectedProvider] = useState<"BOLD" | "REDEBAN" | "WOMPI" | "CREDIBANCO">("BOLD");
    const [progress, setProgress] = useState(0);

    const fmtCOP = (n: number) => `$ ${n.toLocaleString("es-CO")}`;

    useEffect(() => {
        // Step 1: Pair with datáfono (1.5s)
        const t1 = setTimeout(() => {
            setStatus("WAITING_CARD");
        }, 1500);

        // Step 2: Simulate card insertion / contactless tap (4.5s)
        const t2 = setTimeout(() => {
            setStatus("PROCESSING");
        }, 4500);

        // Step 3: Bank Approval (7.0s)
        const t3 = setTimeout(() => {
            setStatus("APPROVED");
        }, 7000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, []);

    const handleConfirm = () => {
        onPaymentApproved("APROB-883921", "VISA Crédito (**** 4892)");
    };

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-6 text-white shadow-2xl relative">
                {/* HEADER */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Datáfono Smart POS — Cobro Directo</h3>
                            <p className="text-xs text-slate-400">Transmisión automática del monto por Bluetooth/WiFi.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
                </div>

                {/* PROVIDER SELECTOR */}
                <div className="grid grid-cols-4 gap-2">
                    {(["BOLD", "REDEBAN", "WOMPI", "CREDIBANCO"] as const).map((prov) => (
                        <button
                            key={prov}
                            onClick={() => setSelectedProvider(prov)}
                            className={`py-1.5 rounded-xl text-[11px] font-extrabold border transition-all ${
                                selectedProvider === prov
                                    ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20"
                                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                        >
                            {prov}
                        </button>
                    ))}
                </div>

                {/* AMOUNT DISPLAY */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                    <span className="text-xs text-slate-400">Monto Transmitido a Datáfono {selectedProvider}:</span>
                    <div className="text-2xl font-black text-teal-400 font-mono">{fmtCOP(amount)}</div>
                    <span className="text-[11px] text-slate-400">Cliente: {customerName || "Consumidor Final"}</span>
                </div>

                {/* LIVE STATUS CARD */}
                <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3 text-center min-h-[160px]">
                    {status === "PAIRING" && (
                        <>
                            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                            <span className="font-bold text-xs text-indigo-300">Conectando con Datáfono {selectedProvider}...</span>
                            <span className="text-[11px] text-slate-500">Enviando comando de cobro por \$ {amount.toLocaleString("es-CO")} COP</span>
                        </>
                    )}

                    {status === "WAITING_CARD" && (
                        <>
                            <Smartphone className="w-8 h-8 text-amber-400 animate-bounce" />
                            <span className="font-bold text-xs text-amber-300">Acerque, Inserte o Deslice la Tarjeta</span>
                            <span className="text-[11px] text-slate-400">Esperando respuesta del cliente en la pantalla del Datáfono...</span>
                        </>
                    )}

                    {status === "PROCESSING" && (
                        <>
                            <Zap className="w-8 h-8 text-teal-400 animate-pulse" />
                            <span className="font-bold text-xs text-teal-300">Procesando Transacción con Banco Emisor...</span>
                            <span className="text-[11px] text-slate-400">Validando clave PIN y saldo de la tarjeta...</span>
                        </>
                    )}

                    {status === "APPROVED" && (
                        <>
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            <div>
                                <span className="font-extrabold text-sm text-emerald-300 block">TRANSACCIÓN APROBADA #883921</span>
                                <span className="text-xs text-slate-400 font-mono">VISA Crédito (**** 4892) — franquicia aprobada</span>
                            </div>
                        </>
                    )}
                </div>

                {/* FOOTER */}
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={status !== "APPROVED"}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                        <ShieldCheck className="w-4 h-4" /> Vincular a la Factura
                    </button>
                </div>
            </div>
        </div>
    );
}
