import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreditCard, Download, CheckCircle2, ShieldCheck, Mail, Building, FileText, QrCode, Wallet, AlertCircle } from "lucide-react";
import { getPayuConfig, generatePayuSignature } from "@/lib/payu";

interface InvoicePageProps {
    params: {
        token: string;
        locale: string;
    }
}

export default async function PublicInvoicePage({ params }: InvoicePageProps) {
    const resolvedParams = await params;
    const { token } = resolvedParams;

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { token },
            include: {
                company: true,
                items: true
            }
        });

        if (!invoice) return notFound();

    const isPaid = invoice.status === 'PAID';
    const isCancelled = invoice.status === 'CANCELLED';

    const payuConfig = await getPayuConfig(invoice.companyId);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-teal-500/30">
            {/* Top Navigation Bar */}
            <nav className="w-full bg-slate-900 border-b border-slate-800/60 sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {invoice.company?.logoUrl ? (
                             <img src={invoice.company.logoUrl} alt={invoice.company?.name || "Empresa"} className="h-8 object-contain" />
                        ) : (
                            <div className="h-8 w-8 bg-teal-600 rounded flex items-center justify-center font-bold text-white">
                                {invoice.company?.name?.charAt(0) || "E"}
                            </div>
                        )}
                        <span className="font-semibold text-lg text-white">{invoice.company?.name || "Empresa Sin Nombre"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium">
                        {isPaid && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Pagado</span>}
                        {isCancelled && <span className="text-red-400">Anulada</span>}
                        {(!isPaid && !isCancelled) && <span className="text-amber-400">Pendiente de Pago</span>}
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
                {/* Status Banner */}
                {isPaid && (
                     <div className="mb-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-emerald-400 shadow-lg shadow-emerald-500/5">
                        <CheckCircle2 className="h-6 w-6" />
                        <div>
                            <h3 className="font-semibold text-emerald-300">Pago Recibido</h3>
                            <p className="text-sm opacity-90">Gracias por tu pago. El servicio se encuentra procesado.</p>
                        </div>
                     </div>
                )}

                {/* Main Receipt Card */}
                <div className="bg-slate-900 shadow-2xl rounded-2xl overflow-hidden border border-slate-800 relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <FileText className="w-64 h-64 text-teal-500" />
                    </div>

                    <div className="p-8 md:p-12 relative z-10">
                        {/* Header details DIAN */}
                        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8 border-b border-slate-800/80 pb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight mb-2 uppercase">Factura Electrónica de Venta No. AE2402E3</h1>
                                <p className="text-slate-400 font-mono text-xs mb-4">Ref. Interna #{invoice.id.split('-')[0].toUpperCase()}</p>
                                <div className="space-y-1 text-sm text-slate-300">
                                    <p className="font-semibold text-white">LegacyMark SAS</p>
                                    <p>NIT: 901.456.789-0</p>
                                    <p>Responsable de IVA</p>
                                    <p>Bogotá D.C., Colombia</p>
                                    <p>Tel: +57 300 123 4567</p>
                                </div>
                            </div>
                            <div className="md:text-right flex flex-col items-end">
                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-4 text-left">
                                    <QrCode className="w-16 h-16 text-teal-500" />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">CUFE</p>
                                        <p className="text-xs text-slate-300 font-mono break-all w-48 leading-tight">
                                            3a8b4c9d-1e2f-5g6h-7i8j-9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Entities info DIAN */}
                        <div className="grid md:grid-cols-2 gap-12 mb-8 py-6 border-b border-slate-800/80">
                            <div>
                                <p className="text-xs text-teal-500 font-bold uppercase tracking-wider mb-3">Receptor / Adquiriente</p>
                                <h3 className="text-lg font-semibold text-white mb-2">{invoice.clientName}</h3>
                                <div className="space-y-1 text-sm text-slate-400">
                                    {invoice.clientNit && <p>NIT: {invoice.clientNit}</p>}
                                    {invoice.clientAddress && <p>Dirección: {invoice.clientAddress}</p>}
                                    {invoice.clientCity && <p>Ciudad: {invoice.clientCity}</p>}
                                    {invoice.clientPhone && <p>Teléfono: {invoice.clientPhone}</p>}
                                </div>
                                {invoice.serviceDescription && (
                                     <p className="text-slate-500 text-sm mt-3 pt-3 border-t border-slate-800/50">{invoice.serviceDescription}</p>
                                )}
                            </div>
                            <div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Fecha Emisión</p>
                                        <p className="text-slate-200 text-sm">{format(new Date(invoice.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}</p>
                                     </div>
                                     <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Vencimiento</p>
                                        <p className="text-slate-200 text-sm">{invoice.dueDate ? format(new Date(invoice.dueDate), "dd 'de' MMMM, yyyy", { locale: es }) : format(new Date(invoice.createdAt.getTime() + 30*24*60*60*1000), "dd 'de' MMMM, yyyy", { locale: es })}</p>
                                     </div>
                                </div>
                                <div className="mt-6 p-4 rounded-lg bg-slate-950/50 border border-slate-800/50 text-xs text-slate-400">
                                    <p className="font-semibold text-slate-300 mb-1">Resolución de Facturación DIAN</p>
                                    <p>Resolución No. 18764034567891 de 2024-01-15</p>
                                    <p>Rango autorizado: AE 1 al 5000</p>
                                    <p>Vigencia: 12 meses</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-12">
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-sm font-medium text-slate-500 uppercase tracking-wider">
                                            <th className="pb-3 text-left font-medium">Descripción</th>
                                            <th className="pb-3 text-right font-medium">Cant.</th>
                                            <th className="pb-3 text-right font-medium">Precio Unit.</th>
                                            <th className="pb-3 text-right font-medium">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-slate-300">
                                        {(invoice.items && invoice.items.length > 0) ? invoice.items.map((item, i) => (
                                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                                                <td className="py-4 font-medium text-slate-200">
                                                    {item.title}
                                                    {item.description && <span className="block text-xs text-slate-500 mt-1 font-normal">{item.description}</span>}
                                                </td>
                                                <td className="py-4 text-right tabular-nums">{item.quantity}</td>
                                                <td className="py-4 text-right tabular-nums">${item.unitPrice.toLocaleString()}</td>
                                                <td className="py-4 text-right font-medium text-white tabular-nums">${item.totalAmount.toLocaleString()}</td>
                                            </tr>
                                        )) : (
                                            <tr className="border-b border-slate-800/50">
                                                <td colSpan={4} className="py-4 text-center text-slate-500">Sin items detallados</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Totals Section */}
                            <div className="mt-6 flex flex-col items-end w-full">
                                <div className="w-full md:w-1/2 space-y-3 text-sm">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Subtotal</span>
                                        <span className="tabular-nums">${(invoice.subtotalAmount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>IVA (19%)</span>
                                        <span className="tabular-nums">${(invoice.taxAmount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-semibold text-white pt-4 border-t border-slate-800">
                                        <span>Total</span>
                                        <span className="tabular-nums">${(invoice.totalAmount || 0).toLocaleString()} {invoice.currency}</span>
                                    </div>
                                    {(invoice.advanceAmount || 0) > 0 && (
                                        <div className="flex justify-between text-rose-400/80">
                                            <span>Monto Reservado (no exigible)</span>
                                            <span className="tabular-nums">-${(invoice.advanceAmount || 0).toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xl font-bold text-teal-400 pt-4 border-t border-slate-800 mt-2">
                                        <span>Total a Pagar</span>
                                        <span className="tabular-nums">${(invoice.finalAmount || 0).toLocaleString()} {invoice.currency}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section and Bank Details */}
                        <div className="grid md:grid-cols-2 gap-8 mb-12">
                            <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-800 text-sm">
                                <h4 className="font-semibold text-teal-400 mb-3 uppercase tracking-wider text-xs">Información de Pago Bancario</h4>
                                <div className="space-y-2 text-slate-300">
                                    <p><span className="text-slate-500">Banco:</span> Bancolombia</p>
                                    <p><span className="text-slate-500">Tipo:</span> Cuenta de Ahorros</p>
                                    <p><span className="text-slate-500">Número:</span> 123-456789-00</p>
                                    <p><span className="text-slate-500">Titular:</span> LegacyMark SAS</p>
                                    <p><span className="text-slate-500">NIT:</span> 901.456.789-0</p>
                                </div>
                            </div>
                            
                            {(invoice.notes || invoice.terms) ? (
                                <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-800 text-sm">
                                    {invoice.notes && (
                                        <div className="mb-4">
                                            <h4 className="font-semibold text-slate-300 mb-1">Notas</h4>
                                            <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
                                        </div>
                                    )}
                                    {invoice.terms && (
                                        <div>
                                            <h4 className="font-semibold text-slate-300 mb-1">Términos y Condiciones</h4>
                                            <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">{invoice.terms}</p>
                                        </div>
                                    )}
                                </div>
                            ) : <div></div>}
                        </div>

                        {/* Actions (Pay button) */}
                        <div className="mt-12 flex flex-col items-center gap-6 border-t border-slate-800/80 pt-8">
                             <div className="flex items-center gap-2 text-slate-500 text-xs text-center">
                                <ShieldCheck className="w-5 h-5 mx-auto" />
                                <span>Pagos seguros protegidos local e internacionalmente.</span>
                             </div>
                             
                             {(!isPaid && !isCancelled) ? (
                                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                    {!invoice.paymentUrl && !payuConfig && (
                                        <div className="flex flex-col items-center justify-center p-6 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center max-w-md w-full">
                                            <AlertCircle className="w-8 h-8 text-amber-400 mb-3" />
                                            <h4 className="text-amber-400 font-semibold mb-1">Métodos de pago no configurados</h4>
                                            <p className="text-amber-400/80 text-xs">Para habilitar el pago en línea en esta factura, el administrador debe configurar las credenciales de PayU en el panel de Configuración &gt; Integraciones.</p>
                                        </div>
                                    )}

                                    {/* PayU Form */}
                                    {payuConfig && (
                                        <form method="post" action={payuConfig.checkoutUrl} className="w-full sm:w-auto">
                                            <input name="merchantId" type="hidden" value={payuConfig.merchantId} />
                                            <input name="accountId" type="hidden" value={payuConfig.accountId} />
                                            <input name="description" type="hidden" value={`Factura #${invoice.id.split('-')[0].toUpperCase()} - ${invoice.clientName}`} />
                                            <input name="referenceCode" type="hidden" value={invoice.id} />
                                            <input name="amount" type="hidden" value={invoice.finalAmount || 0} />
                                            <input name="tax" type="hidden" value={invoice.taxAmount || 0} />
                                            <input name="taxReturnBase" type="hidden" value={invoice.subtotalAmount || 0} />
                                            <input name="currency" type="hidden" value={invoice.currency || "COP"} />
                                            <input name="signature" type="hidden" value={generatePayuSignature(payuConfig, invoice.id, invoice.finalAmount || 0, invoice.currency || "COP")} />
                                            <input name="test" type="hidden" value={payuConfig.test} />
                                            <input name="buyerEmail" type="hidden" value="contacto@legacymark.com" />
                                            <input name="responseUrl" type="hidden" value={`${process.env.NEXT_PUBLIC_APP_URL}/es/invoice/${invoice.token}`} />
                                            <input name="confirmationUrl" type="hidden" value={`${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payu`} />
                                            {/* extra1 will hold the specific invoice ID for the webhook to find */}
                                            <input name="extra1" type="hidden" value={invoice.id} />

                                            <button
                                                type="submit"
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-teal-500/20 hover:bg-teal-500 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            >
                                                <Wallet className="w-5 h-5" />
                                                Pagar con PayU (PSE/Tarjetas)
                                            </button>
                                        </form>
                                    )}
                                </div>
                             ) : isPaid ? (
                                <div className="px-6 py-3 rounded-xl bg-slate-800/50 text-emerald-400 border border-emerald-500/20 font-medium flex items-center justify-center gap-2 w-full sm:w-auto">
                                    <CheckCircle2 className="w-5 h-5" /> Módulo Pagado
                                </div>
                             ) : null}
                        </div>
                    </div>
                </div>

                {/* Footer Legal Clause */}
                <div className="text-center mt-12 mb-8">
                    <p className="text-xs text-slate-500 max-w-3xl mx-auto leading-relaxed">
                        Esta factura de venta se asimila en todos sus efectos a una letra de cambio constituyendo título valor de acuerdo con el artículo 774 del código de comercio. El comprador declara haber recibido real y materialmente las mercancías o servicios descritos en este título valor.
                    </p>
                </div>

                {/* System Footer */}
                <div className="text-center opacity-50 text-sm">
                    <p>Powered by LegacyMark Business Operations</p>
                </div>
            </main>
        </div>
    );
    } catch (error) {
        console.error("🔴 ERROR INVOICE PAGE:", error);
        return <div>Internal Server Error in Invoice Portal. Check console logs.</div>;
    }
}
