"use client";

import { useState, useEffect } from "react";
import {
    CreditCard, Wallet, QrCode, Building2, ShieldCheck, CheckCircle2,
    Copy, Check, Download, Printer, ExternalLink, Lock, RefreshCw,
    AlertCircle, ArrowRight, Sparkles, DollarSign, Globe, Layers, Zap
} from "lucide-react";

interface PaymentPortalClientProps {
    invoice: {
        id: string;
        token: string;
        clientName: string;
        clientNit?: string | null;
        clientAddress?: string | null;
        clientCity?: string | null;
        clientPhone?: string | null;
        subtotalAmount: number;
        taxAmount: number;
        discountAmount: number;
        totalAmount: number;
        advanceAmount: number;
        finalAmount: number;
        status: string;
        currency: string;
        isElectronic: boolean;
        paymentUrl?: string | null;
        createdAt: string;
        dueDate?: string | null;
        company?: {
            name: string;
            logoUrl?: string | null;
            nit?: string | null;
            email?: string | null;
            phone?: string | null;
        } | null;
        items: Array<{
            id: string;
            title: string;
            description?: string | null;
            quantity: number;
            unitPrice: number;
            totalAmount: number;
        }>;
    };
    payuConfig?: {
        merchantId: string;
        accountId: string;
        checkoutUrl: string;
        test: string;
        signature: string;
    } | null;
}

export default function PaymentPortalClient({ invoice: initialInvoice, payuConfig }: PaymentPortalClientProps) {
    const [invoice, setInvoice] = useState(initialInvoice);
    const [selectedGateway, setSelectedGateway] = useState<"wompi" | "stripe" | "payu" | "paypal" | "transfer">(initialInvoice.currency === "USD" ? "stripe" : "wompi");
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [loadingPayment, setLoadingPayment] = useState(false);
    const [wompiSignatureData, setWompiSignatureData] = useState<{ signature: string; reference: string; amountInCents: number; currency: string } | null>(null);
    const [wompiError, setWompiError] = useState(false);

    const isPaid = invoice.status === "PAID";
    const isCancelled = invoice.status === "CANCELLED";

    // Auto-polling status every 6 seconds to detect live payments
    useEffect(() => {
        if (isPaid || isCancelled) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/invoices/${invoice.token || invoice.id}/status`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.status && data.status !== invoice.status) {
                        setInvoice((prev) => ({ ...prev, status: data.status }));
                    }
                }
            } catch (err) {
                // Silent catch for background polling
            }
        }, 6000);

        return () => clearInterval(interval);
    }, [invoice.token, invoice.status, isPaid, isCancelled]);

    // Fetch Wompi signature if COP currency
    useEffect(() => {
        const amount = invoice.finalAmount || invoice.totalAmount || 0;
        if (amount <= 0) {
            setWompiError(true);
            return;
        }

        const fetchSignature = async () => {
            try {
                const amountInCents = Math.round(amount * 100);
                const res = await fetch("/api/payments/wompi/signature", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        reference: invoice.id,
                        amountInCents,
                        currency: invoice.currency || "COP",
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.signature) {
                        setWompiSignatureData(data);
                        setWompiError(false);
                        return;
                    }
                }
                setWompiError(true);
            } catch (err) {
                console.error("Wompi signature fetch error:", err);
                setWompiError(true);
            }
        };

        fetchSignature();
    }, [invoice.id, invoice.finalAmount, invoice.totalAmount, invoice.currency]);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleStripeCheckout = async () => {
        setLoadingPayment(true);
        try {
            const res = await fetch("/api/payments/checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invoiceId: invoice.id,
                    amount: invoice.finalAmount || invoice.totalAmount,
                    currency: invoice.currency || "USD",
                    customerEmail: invoice.clientPhone || "cliente@legacymark.com",
                    title: `Factura #${invoice.id.split("-")[0].toUpperCase()} - ${invoice.clientName}`,
                }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Error generando la sesión de pago de Stripe.");
            }
        } catch (err) {
            alert("Error de conexión al procesar la pasarela de pago.");
        } finally {
            setLoadingPayment(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount: number, currency = "USD") => {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: currency === "COP" ? "COP" : "USD",
            maximumFractionDigits: currency === "COP" ? 0 : 2,
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500/30">
            {/* TOP HEADER & NAVBAR */}
            <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 print:hidden">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {invoice.company?.logoUrl ? (
                            <img src={invoice.company.logoUrl} alt={invoice.company.name} className="h-8 object-contain" />
                        ) : (
                            <div className="h-9 w-9 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-teal-500/20">
                                {invoice.company?.name?.charAt(0) || "L"}
                            </div>
                        )}
                        <div>
                            <span className="font-bold text-slate-100 tracking-tight text-base block leading-none">{invoice.company?.name || "LegacyMark S.A.S."}</span>
                            <span className="text-[10px] text-teal-400 font-mono tracking-wider">PORTAL OFICIAL DE PAGOS DE SEGURIDAD ALTA</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                        >
                            <Printer className="w-3.5 h-3.5 text-teal-400" />
                            Imprimir / PDF
                        </button>
                        {isPaid ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg shadow-emerald-500/10">
                                <CheckCircle2 className="w-4 h-4" /> Pagada
                            </span>
                        ) : isCancelled ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                                Anulada
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold animate-pulse">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Pendiente de Pago
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* MAIN PORTAL BODY */}
            <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
                {/* PAID BANNER */}
                {isPaid && (
                    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-teal-950/40 border border-emerald-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-emerald-300">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/40 text-emerald-400">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white">¡Factura Pagada Exitosamente!</h3>
                                <p className="text-sm text-emerald-200/80">El pago ha sido acreditado en el sistema. Los servicios correspondientes han sido activados.</p>
                            </div>
                        </div>
                        <button
                            onClick={handlePrint}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Comprobante en PDF
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT COLUMN: INVOICE DETAILS & LINE ITEMS */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* INVOICE SUMMARY CARD */}
                        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                <Sparkles className="w-48 h-48 text-teal-400" />
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-6 mb-6 gap-4">
                                <div>
                                    <span className="text-xs font-mono text-teal-400 font-semibold uppercase tracking-wider block mb-1">FACTURA ELECTRÓNICA</span>
                                    <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                                        N° {invoice.id.split("-")[0].toUpperCase()}
                                    </h1>
                                    <p className="text-xs text-slate-400 font-mono mt-0.5">Token: {invoice.token}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-400 block uppercase font-medium">TOTAL A PAGAR</span>
                                    <span className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">
                                        {formatCurrency(invoice.finalAmount || invoice.totalAmount, invoice.currency)}
                                    </span>
                                </div>
                            </div>

                            {/* CLIENT & EMITTER METADATA */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-300 mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                                <div>
                                    <span className="text-slate-500 uppercase font-semibold text-[10px] block mb-1">CLIENTE / FACTURADO A:</span>
                                    <p className="font-bold text-white text-sm">{invoice.clientName}</p>
                                    {invoice.clientNit && <p className="font-mono text-slate-400">NIT/CC: {invoice.clientNit}</p>}
                                    {invoice.clientCity && <p className="text-slate-400">{invoice.clientCity}</p>}
                                    {invoice.clientPhone && <p className="text-slate-400">Tel: {invoice.clientPhone}</p>}
                                </div>

                                <div className="sm:border-l sm:border-slate-800 sm:pl-6">
                                    <span className="text-slate-500 uppercase font-semibold text-[10px] block mb-1">EMISOR DEL SERVICIO:</span>
                                    <p className="font-bold text-white text-sm">{invoice.company?.name || "LegacyMark S.A.S."}</p>
                                    <p className="font-mono text-slate-400">NIT: {invoice.company?.nit || "901.456.789-0"}</p>
                                    <p className="text-slate-400">Facturación Electrónica DIAN</p>
                                    <p className="text-slate-400">{invoice.company?.email || "pagos@legacymark.com"}</p>
                                </div>
                            </div>

                            {/* LINE ITEMS TABLE */}
                            <div className="space-y-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">DETALLE DE CONCEPTOS</span>
                                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                                    {invoice.items && invoice.items.length > 0 ? (
                                        invoice.items.map((item) => (
                                            <div key={item.id} className="p-3.5 flex items-center justify-between text-xs sm:text-sm">
                                                <div>
                                                    <p className="font-semibold text-slate-100">{item.title}</p>
                                                    {item.description && <p className="text-slate-400 text-xs mt-0.5">{item.description}</p>}
                                                    <span className="text-[11px] text-slate-500 font-mono">Cant: {item.quantity} x {formatCurrency(item.unitPrice, invoice.currency)}</span>
                                                </div>
                                                <span className="font-bold text-slate-200 font-mono">{formatCurrency(item.totalAmount, invoice.currency)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-xs text-slate-500">Sin desglose de conceptos específicos.</div>
                                    )}
                                </div>
                            </div>

                            {/* TOTALS BREAKDOWN */}
                            <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1.5">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-mono text-slate-300">{formatCurrency(invoice.subtotalAmount || invoice.totalAmount, invoice.currency)}</span>
                                </div>
                                {invoice.taxAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span>IVA / Impuestos</span>
                                        <span className="font-mono text-slate-300">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                                    </div>
                                )}
                                {invoice.discountAmount > 0 && (
                                    <div className="flex justify-between text-emerald-400">
                                        <span>Descuento aplicado</span>
                                        <span className="font-mono">-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800/80">
                                    <span>Total Facturado</span>
                                    <span className="font-mono text-teal-400">{formatCurrency(invoice.finalAmount || invoice.totalAmount, invoice.currency)}</span>
                                </div>
                            </div>
                        </div>

                        {/* SECURITY TRUST BADGES */}
                        <div className="grid grid-cols-3 gap-3 text-center text-[11px] text-slate-400 font-medium">
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center gap-1">
                                <Lock className="w-4 h-4 text-teal-400" />
                                <span>Cifrado SSL 256-bit</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center gap-1">
                                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                                <span>Cumplimiento PCI-DSS</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center gap-1">
                                <Globe className="w-4 h-4 text-emerald-400" />
                                <span>Acreditación Instantánea</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: MULTI-GATEWAY INTERACTIVE PAYMENT SELECTION */}
                    <div className="lg:col-span-5 space-y-6 print:hidden">
                        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 md:p-8 shadow-2xl sticky top-24">
                            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-teal-400" />
                                Selecciona Método de Pago
                            </h2>
                            <p className="text-xs text-slate-400 mb-6">Transacción cifrada y procesada directamente por pasarelas certificadas.</p>

                            {(invoice.finalAmount || invoice.totalAmount || 0) <= 0 ? (
                                <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                                    <h3 className="text-base font-bold text-white">Factura de Valor $0.00</h3>
                                    <p className="text-xs text-slate-400">Esta factura no requiere procesamiento de pago a través de pasarelas de comercio electrónico.</p>
                                </div>
                            ) : !isPaid && !isCancelled ? (
                                <div className="space-y-4">
                                    {/* GATEWAY TABS */}
                                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                                        <button
                                            onClick={() => setSelectedGateway("wompi")}
                                            className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                                selectedGateway === "wompi"
                                                    ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20"
                                                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                                            }`}
                                        >
                                            <QrCode className="w-3.5 h-3.5" /> PSE / Nequi / COP
                                        </button>
                                        <button
                                            onClick={() => setSelectedGateway("stripe")}
                                            className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                                selectedGateway === "stripe"
                                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                                            }`}
                                        >
                                            <CreditCard className="w-3.5 h-3.5" /> Tarjeta / USD
                                        </button>
                                        <button
                                            onClick={() => setSelectedGateway("transfer")}
                                            className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                                selectedGateway === "transfer"
                                                    ? "bg-slate-800 text-white border border-slate-700"
                                                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                                            }`}
                                        >
                                            <Building2 className="w-3.5 h-3.5" /> Transferencia
                                        </button>
                                        <button
                                            onClick={() => setSelectedGateway("payu")}
                                            className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                                selectedGateway === "payu"
                                                    ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                                                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                                            }`}
                                        >
                                            <Globe className="w-3.5 h-3.5" /> PayU Web
                                        </button>
                                    </div>

                                    {/* TAB CONTENT: WOMPI (PSE / NEQUI) */}
                                    {selectedGateway === "wompi" && (
                                        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="p-2 bg-teal-500/10 text-teal-400 rounded-lg"><QrCode className="w-5 h-5" /></span>
                                                    <div>
                                                        <h4 className="font-bold text-white text-sm">Wompi Colombia</h4>
                                                        <p className="text-[11px] text-slate-400">PSE, Nequi, Bancolombia & Tarjetas COP</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded uppercase">Sin comisión extra</span>
                                            </div>

                                            {wompiSignatureData ? (
                                                <form action="https://checkout.wompi.co/p/" method="GET" target="_blank" className="space-y-3">
                                                    <input type="hidden" name="public-key" value={process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || "pub_prod_wompi_key_stub"} />
                                                    <input type="hidden" name="currency" value={wompiSignatureData.currency} />
                                                    <input type="hidden" name="amount-in-cents" value={wompiSignatureData.amountInCents} />
                                                    <input type="hidden" name="reference" value={wompiSignatureData.reference} />
                                                    <input type="hidden" name="signature:integrity" value={wompiSignatureData.signature} />
                                                    <input type="hidden" name="redirect-url" value={`${typeof window !== "undefined" ? window.location.href : ""}`} />

                                                    <button
                                                        type="submit"
                                                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-2 group"
                                                    >
                                                        Pagar {formatCurrency(invoice.finalAmount || invoice.totalAmount, "COP")} con Wompi
                                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                    </button>
                                                </form>
                                            ) : wompiError ? (
                                                <div className="p-4 bg-slate-900 rounded-lg text-center space-y-3">
                                                    <p className="text-xs text-amber-400 font-medium">No se pudo generar la firma de Wompi de forma automática.</p>
                                                    <button
                                                        onClick={() => setSelectedGateway("stripe")}
                                                        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                                                    >
                                                        Pagar con Tarjeta (Stripe Checkout)
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-slate-900 rounded-lg text-center text-xs text-slate-400 animate-pulse">
                                                    Generando firma segura de Wompi...
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB CONTENT: STRIPE / CREDIT CARD */}
                                    {selectedGateway === "stripe" && (
                                        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><CreditCard className="w-5 h-5" /></span>
                                                <div>
                                                    <h4 className="font-bold text-white text-sm">Stripe International</h4>
                                                    <p className="text-[11px] text-slate-400">Tarjetas de Crédito / Débito Globales (USD)</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleStripeCheckout}
                                                disabled={loadingPayment}
                                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                            >
                                                {loadingPayment ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        Pagar con Tarjeta (Stripe Checkout)
                                                        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* TAB CONTENT: BANK TRANSFER (BANCOLOMBIA / NEQUI) */}
                                    {selectedGateway === "transfer" && (
                                        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4 text-xs">
                                            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                                                <Building2 className="w-4 h-4 text-teal-400" />
                                                <span className="font-bold text-white">Transferencia Bancaria Directa</span>
                                            </div>

                                            <div className="space-y-3">
                                                {/* BANCOLOMBIA */}
                                                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-slate-200">Bancolombia — Cuenta de Ahorros</span>
                                                        <button
                                                            onClick={() => handleCopy("85400012399", "bancolombia")}
                                                            className="text-teal-400 hover:text-teal-300 p-1 flex items-center gap-1"
                                                        >
                                                            {copiedField === "bancolombia" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </div>
                                                    <p className="font-mono text-slate-300">N° 854-000123-99</p>
                                                    <p className="text-[11px] text-slate-400">Titular: LegacyMark S.A.S. (NIT 901.456.789)</p>
                                                </div>

                                                {/* NEQUI */}
                                                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-slate-200">Nequi / Daviplata</span>
                                                        <button
                                                            onClick={() => handleCopy("3001234567", "nequi")}
                                                            className="text-teal-400 hover:text-teal-300 p-1 flex items-center gap-1"
                                                        >
                                                            {copiedField === "nequi" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </div>
                                                    <p className="font-mono text-slate-300">300 123 4567</p>
                                                </div>

                                                <p className="text-[11px] text-slate-400 italic">
                                                    Envía el comprobante de transferencia con la referencia <strong className="text-slate-200 font-mono">#{invoice.id.split("-")[0]}</strong> a <a href="mailto:facturacion@legacymark.com" className="text-teal-400 underline">facturacion@legacymark.com</a>.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB CONTENT: PAYU WEBCHECKOUT */}
                                    {selectedGateway === "payu" && (
                                        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                                            {payuConfig ? (
                                                <form method="post" action={payuConfig.checkoutUrl}>
                                                    <input name="merchantId" type="hidden" value={payuConfig.merchantId} />
                                                    <input name="accountId" type="hidden" value={payuConfig.accountId} />
                                                    <input name="description" type="hidden" value={`Factura #${invoice.id.split("-")[0].toUpperCase()} - ${invoice.clientName}`} />
                                                    <input name="referenceCode" type="hidden" value={invoice.id} />
                                                    <input name="amount" type="hidden" value={invoice.finalAmount || invoice.totalAmount} />
                                                    <input name="tax" type="hidden" value={invoice.taxAmount || 0} />
                                                    <input name="taxReturnBase" type="hidden" value={invoice.subtotalAmount || 0} />
                                                    <input name="currency" type="hidden" value={invoice.currency || "COP"} />
                                                    <input name="signature" type="hidden" value={payuConfig.signature} />
                                                    <input name="test" type="hidden" value={payuConfig.test} />

                                                    <button
                                                        type="submit"
                                                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        Pagar con PayU Latam
                                                    </button>
                                                </form>
                                            ) : (
                                                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                                                    Utiliza las pasarelas activas Wompi o Stripe para pago inmediato.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                                    <h4 className="font-bold text-white text-base">Esta factura ha sido liquidada</h4>
                                    <p className="text-xs text-slate-300">No se requieren pagos adicionales. Puedes guardar o imprimir este recibo oficial.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
