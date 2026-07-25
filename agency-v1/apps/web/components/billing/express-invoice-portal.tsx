"use client";

import React, { useState } from "react";
import { QrCode, ShieldCheck, CheckCircle2, Building2, FileText, Send, RefreshCw, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function ExpressInvoicePortal() {
    const [ticketNumber, setTicketNumber] = useState("");
    const [ticketAmount, setTicketAmount] = useState("");
    
    // Customer Form
    const [buyerName, setBuyerName] = useState("");
    const [buyerDocumentType, setBuyerDocumentType] = useState("NIT");
    const [buyerDocumentNumber, setBuyerDocumentNumber] = useState("");
    const [buyerEmail, setBuyerEmail] = useState("");
    const [buyerAddress, setBuyerAddress] = useState("");
    const [buyerPhone, setBuyerPhone] = useState("");

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedInvoice, setGeneratedInvoice] = useState<{ number: string; cufe: string; issueDate: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!ticketNumber || !ticketAmount || !buyerName || !buyerDocumentNumber || !buyerEmail) {
            toast.error("Por favor complete todos los campos obligatorios (*).");
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading("Transmitiendo Factura Electrónica a los servidores de la DIAN...");

        // Simulate real-time DIAN transmission
        setTimeout(() => {
            setIsGenerating(false);
            const mockInvoice = {
                number: `FE-${Math.floor(100000 + Math.random() * 900000)}`,
                cufe: `d9060ca6ea4d0aa1936164f14127093e1caab207fee3a14452da33717788e155917390392881c13c1c37e947fd888aea${Date.now()}`,
                issueDate: new Date().toLocaleDateString("es-CO") + " " + new Date().toLocaleTimeString("es-CO"),
            };
            setGeneratedInvoice(mockInvoice);
            toast.success("¡Factura Electrónica enviada exitosamente a la DIAN y a su correo!", { id: toastId });
        }, 1800);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 md:p-10 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-8 text-slate-100">
            {/* BRANDING HEADER */}
            <div className="text-center space-y-2 border-b border-slate-800 pb-6">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/10 mb-3">
                    <QrCode className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                    Portal Autoservicio de Facturación Electrónica DIAN ⚡
                </h1>
                <p className="text-xs text-slate-400 max-w-lg mx-auto">
                    Ingrese el número de su tiquete POS o escanee el código QR de su recibo para expedir su Factura Electrónica legal de venta UBL 2.1 al instante.
                </p>
            </div>

            {generatedInvoice ? (
                <div className="bg-slate-950 p-6 md:p-8 rounded-3xl border border-emerald-500/40 space-y-6 text-center animate-in zoom-in-95 duration-200">
                    <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-white">¡Factura Electrónica DIAN Expedida!</h2>
                        <p className="text-xs text-slate-400 font-mono">Factura No. <span className="font-extrabold text-emerald-400">{generatedInvoice.number}</span></p>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-left text-xs font-mono space-y-2 text-slate-300">
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span>Estado DIAN:</span>
                            <span className="font-bold text-emerald-400">ACEPTADO (Código 00)</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span>Fecha Emisión:</span>
                            <span className="font-bold text-white">{generatedInvoice.issueDate}</span>
                        </div>
                        <div className="space-y-1 pt-1">
                            <span className="text-[10px] text-slate-500 uppercase block">CUFE SHA-384:</span>
                            <span className="break-all text-[10.5px] text-teal-300 block">{generatedInvoice.cufe}</span>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400">
                        Se ha enviado una copia de la representación gráfica PDF A4 y el archivo XML UBL 2.1 al correo <span className="font-bold text-white">{buyerEmail}</span>.
                    </p>

                    <button
                        onClick={() => {
                            setGeneratedInvoice(null);
                            setTicketNumber("");
                            setTicketAmount("");
                        }}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl transition-all border border-slate-700"
                    >
                        Expedir Otra Factura
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6 text-xs">
                    {/* PASO 1: DATOS DEL TIQUETE DE COMPRA */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                        <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                            <QrCode className="w-4 h-4" /> 1. Datos de su Tiquete de Compra POS
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-300">Número de Tiquete / Recibo *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: POS-8BE74B42"
                                    value={ticketNumber}
                                    onChange={(e) => setTicketNumber(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono outline-none focus:border-teal-500 font-bold"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-300">Monto Total Pagado ($ COP) *</label>
                                <input
                                    type="number"
                                    required
                                    placeholder="Ej: 892500"
                                    value={ticketAmount}
                                    onChange={(e) => setTicketAmount(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono outline-none focus:border-teal-500 font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* PASO 2: DATOS DEL ADQUIRENTE / COMPRADOR */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> 2. Datos Fiscales para su Factura (RUT)
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="font-bold text-slate-300">Razón Social o Nombre Completo *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: CONSULTORIA DE COLOMBIA S.A.S"
                                    value={buyerName}
                                    onChange={(e) => setBuyerName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-semibold"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-300">Tipo de Documento *</label>
                                <select
                                    value={buyerDocumentType}
                                    onChange={(e) => setBuyerDocumentType(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-semibold"
                                >
                                    <option value="NIT">NIT (Empresas)</option>
                                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                                    <option value="PASAPORTE">Pasaporte / Cédula Extranjería</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-300">Número de Identificación (Sin DV) *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: 804017909"
                                    value={buyerDocumentNumber}
                                    onChange={(e) => setBuyerDocumentNumber(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono outline-none focus:border-indigo-500 font-bold"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-300">Correo Electrónico (Para recibir PDF y XML) *</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="gerencia@neogestion.co"
                                    value={buyerEmail}
                                    onChange={(e) => setBuyerEmail(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-300">Teléfono / Celular</label>
                                <input
                                    type="text"
                                    placeholder="3173720384"
                                    value={buyerPhone}
                                    onChange={(e) => setBuyerPhone(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <label className="font-bold text-slate-300">Dirección Fiscal Completa</label>
                                <input
                                    type="text"
                                    placeholder="CRR1A 55A 30 IN ED CENTAURIO BUCARAMANGA"
                                    value={buyerAddress}
                                    onChange={(e) => setBuyerAddress(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isGenerating}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 tracking-wide uppercase"
                    >
                        {isGenerating ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" /> Procesando con la DIAN...
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-5 h-5" /> Expedir Mi Factura Electrónica DIAN <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}
