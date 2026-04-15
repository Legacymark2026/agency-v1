"use client";

import { useState } from "react";
import { createProposal, updateProposalStatus } from "@/actions/crm-closing";
import { toast } from "sonner";
import { Plus, FileText, Send, Check, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

interface LineItem { description: string; quantity: number; unitPrice: number; }

interface Proposal {
    id: string; title: string; status: string; total: number;
    validUntil?: Date | string | null; notes?: string | null;
    lineItems?: LineItem[]; createdAt: Date | string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: { label: "Borrador", color: "#94a3b8", bg: "rgba(100,116,139,0.1)" },
    SENT: { label: "Enviada", color: "#0ea5e9", bg: "rgba(14,165,233,0.1)" },
    ACCEPTED: { label: "Aceptada ✓", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    REJECTED: { label: "Rechazada", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

export function ProposalPanel({ dealId, initialProposals }: { dealId: string; initialProposals: Proposal[] }) {
    const [proposals, setProposals] = useState(initialProposals);
    const [creating, setCreating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);

    const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

    const addItem = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
    const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
    const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
        setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    };

    const handleCreate = async () => {
        if (!title.trim()) return toast.error("El título es requerido");
        if (items.some(i => !i.description)) return toast.error("Completa todos los ítems");
        setLoading(true);
        const res = await createProposal(dealId, { title, validUntil: validUntil || undefined, notes: notes || undefined, lineItems: items });
        if (res.success) {
            toast.success("Propuesta creada exitosamente");
            setCreating(false);
            setTitle(""); setValidUntil(""); setNotes("");
            setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
            // Refresh to get the new proposal — ideally we'd use router.refresh() but let's reload
            window.location.reload();
        } else {
            toast.error(res.error ?? "Error al crear propuesta");
        }
        setLoading(false);
    };

    const handleStatusChange = async (proposalId: string, status: string) => {
        const res = await updateProposalStatus(proposalId, status as any);
        if (res.success) {
            setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status } : p));
            toast.success(`Estado actualizado: ${STATUS_CONFIG[status]?.label}`);
        } else {
            toast.error("Error al actualizar estado");
        }
    };

    const inputStyle = {
        background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.9)',
        borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#cbd5e1',
        outline: 'none', width: '100%', fontFamily: 'inherit'
    };

    return (
        <div>
            {/* Existing Proposals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: proposals.length ? 16 : 0 }}>
                {proposals.map(p => {
                    const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.DRAFT;
                    const isExpanded = expandedId === p.id;
                    return (
                        <div key={p.id} style={{
                            background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(30,41,59,0.8)',
                            borderRadius: 12, overflow: 'hidden'
                        }}>
                            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <FileText style={{ width: 14, height: 14, color: '#475569', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                                    <p style={{ fontSize: 11, color: '#475569', margin: 0, fontFamily: 'monospace' }}>
                                        ${p.total.toLocaleString()} USD
                                    </p>
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>
                                    {cfg.label}
                                </span>
                                <button onClick={() => setExpandedId(isExpanded ? null : p.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2 }}>
                                    {isExpanded ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                                </button>
                            </div>
                            {isExpanded && (
                                <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(30,41,59,0.5)' }}>
                                    {/* Status actions */}
                                    <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                                        {['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'].map(s => (
                                            <button key={s} onClick={() => handleStatusChange(p.id, s)}
                                                disabled={p.status === s}
                                                style={{
                                                    fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                                                    background: p.status === s ? `${STATUS_CONFIG[s].bg}` : 'rgba(30,41,59,0.5)',
                                                    color: p.status === s ? STATUS_CONFIG[s].color : '#475569',
                                                    border: `1px solid ${p.status === s ? (STATUS_CONFIG[s].color + '44') : 'rgba(30,41,59,0.8)'}`,
                                                    opacity: p.status === s ? 1 : 0.7
                                                }}>
                                                {STATUS_CONFIG[s].label}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Line Items */}
                                    {Array.isArray(p.lineItems) && p.lineItems.length > 0 && (
                                        <div style={{ marginTop: 12 }}>
                                            {(p.lineItems as LineItem[]).map((item, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', padding: '3px 0' }}>
                                                    <span>{item.description}</span>
                                                    <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{item.quantity}x ${item.unitPrice} = <b style={{ color: '#2dd4bf' }}>${(item.quantity * item.unitPrice).toLocaleString()}</b></span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Create New Form */}
            {creating ? (
                <div style={{ background: 'rgba(13,148,136,0.05)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 14, padding: 16 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#2dd4bf', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>NUEVA PROPUESTA</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input placeholder="Título de la propuesta *" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
                        <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={inputStyle} />
                        
                        {/* Line Items */}
                        <div>
                            <p style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', marginBottom: 6 }}>ÍTEMS DE LA PROPUESTA</p>
                            {items.map((item, idx) => (
                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px 28px', gap: 6, marginBottom: 6 }}>
                                    <input placeholder="Descripción" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} style={{ ...inputStyle, gridColumn: '1' }} />
                                    <input type="number" placeholder="Cant." value={item.quantity} onChange={e => updateItem(idx, 'quantity', +e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
                                    <input type="number" placeholder="Precio" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', +e.target.value)} style={{ ...inputStyle, textAlign: 'right' }} />
                                    <button onClick={() => removeItem(idx)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Trash2 style={{ width: 10, height: 10, color: '#ef4444' }} />
                                    </button>
                                </div>
                            ))}
                            <button onClick={addItem} style={{ fontSize: 10, color: '#2dd4bf', background: 'none', border: '1px dashed rgba(13,148,136,0.4)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                <Plus style={{ width: 10, height: 10 }} /> Agregar ítem
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid rgba(30,41,59,0.5)' }}>
                            <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>TOTAL</span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: '#2dd4bf', fontFamily: 'monospace' }}>${total.toLocaleString()} USD</span>
                        </div>

                        <textarea placeholder="Notas adicionales (opcional)" value={notes} onChange={e => setNotes(e.target.value)}
                            rows={2} style={{ ...inputStyle, resize: 'vertical' }} />

                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setCreating(false)} style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 11, cursor: 'pointer', background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(30,41,59,0.8)', color: '#475569' }}>
                                Cancelar
                            </button>
                            <button onClick={handleCreate} disabled={loading}
                                style={{ flex: 2, padding: '8px 16px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.4)', color: '#2dd4bf', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <Send style={{ width: 11, height: 11 }} /> {loading ? 'Creando...' : 'Crear Propuesta'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <button onClick={() => setCreating(true)}
                    style={{ width: '100%', padding: '10px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(13,148,136,0.08)', border: '1px dashed rgba(13,148,136,0.3)', color: '#2dd4bf', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Plus style={{ width: 12, height: 12 }} /> Nueva Propuesta
                </button>
            )}
        </div>
    );
}
