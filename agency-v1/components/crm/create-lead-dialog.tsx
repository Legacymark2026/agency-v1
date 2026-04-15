"use client";

import { useState } from "react";
import { createLead, checkDuplicateEmail } from "@/actions/crm";
import { useRouter } from "next/navigation";
import { UserPlus, X, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";

const SOURCES = ["GOOGLE", "FACEBOOK", "INSTAGRAM", "LINKEDIN", "TIKTOK", "REFERRAL", "DIRECT", "EMAIL", "ORGANIC", "WHATSAPP", "OTRO"];

interface Props { companyId: string; trigger?: React.ReactNode; }

export function CreateLeadDialog({ companyId, trigger }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [duplicate, setDuplicate] = useState<{ leadId: string; leadName?: string } | null>(null);
    const [form, setForm] = useState({
        name: "", email: "", phone: "", company: "",
        source: "DIRECT", message: "",
        utmSource: "", utmMedium: "", utmCampaign: "",
        pipelineStage: "NEW",
    });

    const set = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

    const handleEmailBlur = async () => {
        if (!form.email || !form.email.includes("@")) return;
        const res = await checkDuplicateEmail(form.email, companyId);
        if (res.isDuplicate) setDuplicate({ leadId: res.leadId!, leadName: res.leadName });
        else setDuplicate(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            const result = await createLead({ ...form, companyId });
            if ("error" in result) { setError(result.error ?? "Error al crear lead"); return; }
            setSuccess(true);
            setForm({ name: "", email: "", phone: "", company: "", source: "DIRECT", message: "", utmSource: "", utmMedium: "", utmCampaign: "", pipelineStage: "NEW" });
            setTimeout(() => { setSuccess(false); setOpen(false); router.refresh(); }, 1500);
        } catch {
            setError("Error inesperado. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all text-slate-200 placeholder-slate-600";
    const inputStyle = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.9)', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', color: '#cbd5e1', width: '100%', outline: 'none' } as React.CSSProperties;

    const dialogContent = open && (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && !loading && setOpen(false)}
        >
            <div style={{ background: 'rgba(11,15,25,0.98)', border: '1px solid rgba(30,41,59,0.9)', borderRadius: '20px', boxShadow: '0 25px 80px rgba(0,0,0,0.6)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ position: 'sticky', top: 0, background: 'rgba(11,15,25,0.98)', borderRadius: '20px 20px 0 0', padding: '24px 28px 16px', borderBottom: '1px solid rgba(30,41,59,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,#0d9488,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <UserPlus style={{ width: '18px', height: '18px', color: '#fff' }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#f1f5f9', margin: 0 }}>Nuevo Lead</h2>
                            <p style={{ fontSize: '11px', color: '#475569', margin: 0, fontFamily: 'monospace' }}>Registra un contacto manualmente</p>
                        </div>
                    </div>
                    <button onClick={() => setOpen(false)} disabled={loading}
                        style={{ padding: '6px', borderRadius: '8px', color: '#475569', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(30,41,59,0.6)'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#475569'; }}>
                        <X style={{ width: '18px', height: '18px' }} />
                    </button>
                </div>

                {success ? (
                    <div style={{ padding: '48px 28px', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                        <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#f1f5f9', margin: '0 0 8px' }}>¡Lead creado!</h3>
                        <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>El lead fue registrado correctamente.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Datos de contacto */}
                        <div>
                            <p style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: '12px' }}>📋 Datos de Contacto</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px', fontFamily: 'monospace' }}>Nombre</label>
                                        <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ana García" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px', fontFamily: 'monospace' }}>Empresa</label>
                                        <input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Mi Empresa S.A.S" style={inputStyle} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px', fontFamily: 'monospace' }}>Email <span style={{ color: '#f87171' }}>*</span></label>
                                    <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} onBlur={handleEmailBlur} placeholder="ana@empresa.com" style={inputStyle} />
                                    {duplicate && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '8px', marginTop: '6px', fontSize: '12px' }}>
                                            <AlertTriangle style={{ width: '14px', height: '14px', color: '#fbbf24', flexShrink: 0 }} />
                                            <span style={{ color: '#fcd34d' }}>Ya existe: <strong>{duplicate.leadName ?? duplicate.leadId}</strong></span>
                                            <Link href={`/dashboard/admin/crm/leads/${duplicate.leadId}`} onClick={() => setOpen(false)} style={{ marginLeft: 'auto', color: '#2dd4bf', fontWeight: 700, fontSize: '11px' }}>Ver →</Link>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px', fontFamily: 'monospace' }}>WhatsApp / Teléfono</label>
                                    <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+57 300 000 0000" style={inputStyle} />
                                </div>
                            </div>
                        </div>

                        {/* Fuente + Etapa del Pipeline */}
                        <div>
                            <p style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: '12px' }}>🌐 Fuente &amp; Pipeline</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px', fontFamily: 'monospace' }}>¿De dónde viene? <span style={{ color: '#f87171' }}>*</span></label>
                                    <select required value={form.source} onChange={(e) => set("source", e.target.value)} style={inputStyle}>
                                        {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px', fontFamily: 'monospace' }}>Etapa del Pipeline <span style={{ color: '#f87171' }}>*</span></label>
                                    <select required value={form.pipelineStage} onChange={(e) => set("pipelineStage", e.target.value)} style={inputStyle}>
                                        <option value="NEW">🔵 New Lead</option>
                                        <option value="CONTACTED">🟣 Contacted</option>
                                        <option value="QUALIFIED">🟦 Qualified Deal</option>
                                        <option value="PROPOSAL">🟡 Proposal Sent</option>
                                        <option value="NEGOTIATION">🟠 In Negotiation</option>
                                        <option value="WON">🟢 Closed Won</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: '12px' }}>💬 Mensaje / Notas</p>
                            <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={3} placeholder="¿En qué está interesado este lead?" style={{ ...inputStyle, resize: 'none' }} />
                        </div>

                        <details>
                            <summary style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', cursor: 'pointer', userSelect: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                📊 UTM / Atribución (opcional)
                            </summary>
                            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                {[
                                    { key: "utmSource", label: "Source", placeholder: "google" },
                                    { key: "utmMedium", label: "Medium", placeholder: "cpc" },
                                    { key: "utmCampaign", label: "Campaign", placeholder: "brand-q1" },
                                ].map((f) => (
                                    <div key={f.key}>
                                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px', fontFamily: 'monospace' }}>{f.label}</label>
                                        <input value={form[f.key as keyof typeof form]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} style={inputStyle} />
                                    </div>
                                ))}
                            </div>
                        </details>

                        {error && (
                            <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', fontSize: '12px', color: '#f87171' }}>{error}</div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                            <button type="button" onClick={() => setOpen(false)} disabled={loading}
                                style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid rgba(30,41,59,0.9)', background: 'transparent', color: '#64748b', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(13,148,136,0.4)'; (e.currentTarget as HTMLElement).style.color = '#2dd4bf'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,41,59,0.9)'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
                            >
                                Cancelar
                            </button>
                            <button type="submit" disabled={loading}
                                style={{ flex: 1, padding: '11px', borderRadius: '10px', background: 'linear-gradient(135deg,#0d9488,#0f766e)', color: '#fff', fontWeight: 800, fontSize: '13px', border: 'none', cursor: 'pointer', opacity: loading ? 0.5 : 1, boxShadow: '0 4px 20px rgba(13,148,136,0.3)' }}
                            >
                                {loading ? "Creando…" : "Crear Lead ✓"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );

    return (
        <>
            <div onClick={() => setOpen(true)}>
                {trigger ?? (
                    <button
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: 'linear-gradient(135deg,#0d9488,#0f766e)', color: '#fff', fontSize: '13px', fontWeight: 800, borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(13,148,136,0.3)', transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                    >
                        <UserPlus style={{ width: '14px', height: '14px' }} /> Nuevo Lead
                    </button>
                )}
            </div>
            {typeof window !== "undefined" && dialogContent
                ? createPortal(dialogContent, document.body)
                : null}
        </>
    );
}
