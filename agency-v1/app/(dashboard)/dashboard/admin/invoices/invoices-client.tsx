"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
    CreditCard, Plus, ExternalLink, Trash2, 
    MoreHorizontal, Send, RefreshCcw, Search, Filter, 
    CheckCircle2, XCircle, AlertCircle, FileText
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateInvoiceStatus, deleteInvoice, sendInvoiceEmail } from "@/actions/invoices";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Invoice {
    id: string;
    clientName: string;
    finalAmount: number;
    totalAmount: number;
    currency: string;
    status: string;
    dueDate: Date | null;
    createdAt: Date;
    paymentUrl: string | null;
    token: string | null;
}

interface InvoicesClientProps {
    invoices: Invoice[];
    stats: {
        billed: number;
        outstanding: number;
        overdue: number;
        successRate: number;
    };
}

export function InvoicesClient({ invoices, stats }: InvoicesClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isActioning, setIsActioning] = useState<string | null>(null);

    const statusMap: Record<string, { label: string, color: string, icon: any }> = {
        "DRAFT_AWAITING_PAYMENT": { label: "Por Pagar", color: "bg-amber-500/10 text-amber-400 ring-amber-500/20", icon: AlertCircle },
        "SENT": { label: "Enviado", color: "bg-blue-500/10 text-blue-400 ring-blue-500/20", icon: Send },
        "PAID": { label: "Pagado", color: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20", icon: CheckCircle2 },
        "CANCELLED": { label: "Cancelado", color: "bg-red-500/10 text-red-500 ring-red-500/20", icon: XCircle }
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || inv.id.includes(searchQuery);
        const matchesStatus = statusFilter === "ALL" ? true : inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleAction = async (action: 'send' | 'paid' | 'cancel' | 'delete', invoiceId: string) => {
        try {
            setIsActioning(invoiceId);
            if (action === 'send') {
                const res = await sendInvoiceEmail(invoiceId);
                if (res.success) toast.success("Factura y enlace de pago enviados al cliente.");
                else toast.error("Error al enviar la factura.");
            } else if (action === 'paid') {
                const res = await updateInvoiceStatus(invoiceId, 'PAID');
                if (res.success) toast.success("Factura marcada como pagada.");
                else toast.error("Error al actualizar estado.");
            } else if (action === 'cancel') {
                const res = await updateInvoiceStatus(invoiceId, 'CANCELLED');
                if (res.success) toast.success("Factura anulada.");
                else toast.error("Error al anular.");
            } else if (action === 'delete') {
                if (confirm("¿Estás seguro de eliminar esta factura?")) {
                    const res = await deleteInvoice(invoiceId);
                    if (res.success) toast.success("Factura eliminada del sistema.");
                    else toast.error("Error al eliminar.");
                }
            }
            router.refresh();
        } catch (error) {
            toast.error("Error ejecutando la acción");
        } finally {
            setIsActioning(null);
        }
    };

    const copyPaymentLink = (token: string | null) => {
        if (!token) return toast.error("El enlace de pago no está disponible.");
        const url = `${window.location.origin}/es/invoice/${token}`;
        navigator.clipboard.writeText(url);
        toast.success("Enlace de pago copiado al portapapeles");
    };

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] p-6 md:p-8 bg-slate-950 text-slate-200 overflow-y-auto w-full max-w-[1600px] mx-auto">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-teal-400" />
                        Finanzas y Cobranza (B2B)
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Centro de mando de facturación. Emite, envía y rastrea pagos con PayU.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/dashboard/admin/invoices/new"
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-700 disabled:pointer-events-none disabled:opacity-50 bg-teal-600 text-white shadow hover:bg-teal-500 h-9 px-4 py-2"
                    >
                        <Plus className="h-4 w-4" />
                        Emitir Factura
                    </Link>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="text-slate-400 text-sm font-medium mb-1">Monto Cobrado (Pagado)</div>
                    <div className="text-2xl font-bold text-white">${stats.billed.toLocaleString()} USD</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="text-slate-400 text-sm font-medium mb-1">Total Pendiente</div>
                    <div className="text-2xl font-bold text-amber-400">${stats.outstanding.toLocaleString()} USD</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="text-slate-400 text-sm font-medium mb-1">Total Vencido</div>
                    <div className="text-2xl font-bold text-rose-500">${stats.overdue.toLocaleString()} USD</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="text-slate-400 text-sm font-medium mb-1">Tasa de Pago</div>
                    <div className="text-2xl font-bold text-emerald-400">{stats.successRate}%</div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o ID..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select 
                    className="bg-slate-900 border border-slate-800 rounded-md px-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="ALL">Todos los estados</option>
                    <option value="DRAFT_AWAITING_PAYMENT">Por Pagar</option>
                    <option value="SENT">Enviado</option>
                    <option value="PAID">Pagado</option>
                    <option value="CANCELLED">Cancelado</option>
                </select>
            </div>

            {/* Data Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex-1">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 bg-slate-950/50 border-b border-slate-800 uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-medium">Cliente / Empresa</th>
                                <th scope="col" className="px-6 py-4 font-medium">Monto (A cobrar)</th>
                                <th scope="col" className="px-6 py-4 font-medium">Estado</th>
                                <th scope="col" className="px-6 py-4 font-medium">Fechas</th>
                                <th scope="col" className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No se encontraron facturas con los filtros aplicados.
                                    </td>
                                </tr>
                            ) : filteredInvoices.map((invoice) => {
                                const statusInfo = statusMap[invoice.status] || { label: invoice.status, color: 'bg-slate-800 text-slate-300 ring-slate-700', icon: CreditCard };
                                const StatusIcon = statusInfo.icon;
                                
                                return (
                                <tr key={invoice.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-slate-200">{invoice.clientName}</div>
                                        <div className="text-xs text-slate-500 font-mono">#{invoice.id.split('-')[0].toUpperCase()}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono">
                                        <div className="text-slate-200 text-base font-medium">${invoice.finalAmount.toLocaleString()} {invoice.currency}</div>
                                        <div className="text-xs text-slate-500">Total: ${invoice.totalAmount.toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusInfo.color}`}>
                                            <StatusIcon className="h-3.5 w-3.5" />
                                            {statusInfo.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                                        <div className="text-slate-300 mb-1">Emitida: {format(new Date(invoice.createdAt), "dd MMM yy", { locale: es })}</div>
                                        {invoice.dueDate && (
                                            <div className="text-slate-500">Vence: {format(new Date(invoice.dueDate), "dd MMM yy", { locale: es })}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-400">
                                        <div className="flex items-center justify-end gap-2">
                                            {invoice.paymentUrl && (
                                                <a href={invoice.paymentUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:text-teal-400 hover:bg-teal-500/10 rounded border border-transparent hover:border-teal-500/20 transition-colors" title="Ver Checkout de PayU">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                            
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="p-2 hover:bg-slate-800 rounded focus:outline-none">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800 text-slate-300">
                                                    <DropdownMenuItem onSelect={() => { if(invoice.token) router.push(`/es/invoice/${invoice.token}`); }} className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer flex items-center gap-2">
                                                        <FileText className="h-4 w-4" /> Ver Portal del Cliente
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => copyPaymentLink(invoice.token)} className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer flex items-center gap-2">
                                                        <ExternalLink className="h-4 w-4" /> Copiar Link de Pago
                                                    </DropdownMenuItem>
                                                    
                                                    {invoice.status !== 'PAID' && (
                                                        <>
                                                            <DropdownMenuItem onSelect={() => handleAction('send', invoice.id)} disabled={isActioning === invoice.id} className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer flex items-center gap-2">
                                                                <Send className="h-4 w-4" /> Re-enviar por Email
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => handleAction('paid', invoice.id)} disabled={isActioning === invoice.id} className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer flex items-center gap-2 text-emerald-400 focus:text-emerald-400">
                                                                <CheckCircle2 className="h-4 w-4" /> Marcar como Pagado
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => handleAction('cancel', invoice.id)} disabled={isActioning === invoice.id} className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer flex items-center gap-2 text-amber-400 focus:text-amber-400">
                                                                <XCircle className="h-4 w-4" /> Anular Factura
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    
                                                    <DropdownMenuItem onSelect={() => handleAction('delete', invoice.id)} disabled={isActioning === invoice.id} className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer flex items-center gap-2 text-red-400 focus:text-red-400 border-t border-slate-800">
                                                        <Trash2 className="h-4 w-4" /> Eliminar Factura
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
