"use client";

import { useState, useTransition } from "react";
import { createInvoiceFromDeal } from "@/actions/crm-closing";
import { toast } from "sonner";
import { FileCheck2, Plus, ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

interface Invoice {
    id: string; title: string; status: string; total: number;
    dueDate: Date | string | null; createdAt: Date | string;
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Borrador", color: "#64748b" },
    SENT: { label: "Enviada", color: "#0ea5e9" },
    PAID: { label: "Pagada ✓", color: "#10b981" },
    OVERDUE: { label: "Vencida ⚠️", color: "#ef4444" },
    CANCELLED: { label: "Cancelada", color: "#475569" },
};

export function InvoicesPanel({ dealId, initialInvoices }: { dealId: string; initialInvoices: Invoice[] }) {
    const [invoices, setInvoices] = useState(initialInvoices);
    const [isPending, startTransition] = useTransition();

    const handleCreate = () => {
        startTransition(async () => {
            const res = await createInvoiceFromDeal(dealId);
            if (res.success) {
                toast.success("Factura creada exitosamente");
                window.location.reload();
            } else {
                toast.error(res.error ?? "Error al crear factura");
            }
        });
    };

    return (
        <div>
            {invoices.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {invoices.map(inv => {
                        const cfg = STATUS_CFG[inv.status] ?? STATUS_CFG.DRAFT;
                        return (
                            <div key={inv.id} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 14px', borderRadius: 10,
                                background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(30,41,59,0.8)'
                            }}>
                                <FileCheck2 style={{ width: 14, height: 14, color: '#475569', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {inv.title}
                                    </p>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#2dd4bf', fontWeight: 800 }}>
                                            ${inv.total.toLocaleString()}
                                        </span>
                                        {inv.dueDate && (
                                            <span style={{ fontSize: 10, color: '#475569', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <Clock style={{ width: 9, height: 9 }} />
                                                Vence {formatDistanceToNow(new Date(inv.dueDate), { addSuffix: true, locale: es })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}44`, flexShrink: 0 }}>
                                    {cfg.label}
                                </span>
                                <Link href={`/dashboard/admin/invoices/${inv.id}`}
                                    style={{ color: '#475569', display: 'flex' }}
                                    title="Ver factura">
                                    <ExternalLink style={{ width: 12, height: 12 }} />
                                </Link>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '16px 0', marginBottom: 12 }}>
                    <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        &gt; Sin facturas vinculadas_
                    </p>
                </div>
            )}

            <button onClick={handleCreate} disabled={isPending}
                style={{
                    width: '100%', padding: '10px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: 'rgba(139,92,246,0.08)', border: '1px dashed rgba(139,92,246,0.3)', color: '#a78bfa',
                    opacity: isPending ? 0.6 : 1
                }}>
                <Plus style={{ width: 12, height: 12 }} />
                {isPending ? 'Creando...' : 'Crear Factura desde este Deal'}
            </button>
        </div>
    );
}
