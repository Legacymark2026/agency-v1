"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, X } from "lucide-react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { createDealActivity } from "@/actions/crm";

const CALL_OUTCOMES = [
    { value: "ANSWERED", label: "📞 Contestó" },
    { value: "NO_ANSWER", label: "📵 No contestó" },
    { value: "VOICEMAIL", label: "📬 Buzón de voz" },
    { value: "CALLBACK_REQUESTED", label: "🔄 Solicita devolución" },
    { value: "WRONG_NUMBER", label: "❌ Número incorrecto" },
];

interface Props { companyId: string; dealId?: string; trigger?: React.ReactNode; onSuccess?: () => void; }

const IS: React.CSSProperties = { background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "10px", padding: "9px 14px", fontSize: "13px", color: "#cbd5e1", width: "100%", outline: "none" };
const LBL: React.CSSProperties = { fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px", fontFamily: "monospace" };

export function LogCallDialog({ companyId, dealId, trigger, onSuccess }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ contactName: "", phone: "", outcome: "ANSWERED", duration: "", notes: "" });
    const set = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setError("");
        try {
            const content = `📞 Llamada con ${form.contactName || "contacto"} | ${CALL_OUTCOMES.find(o => o.value === form.outcome)?.label ?? form.outcome}${form.duration ? ` | Duración: ${form.duration} min` : ""}${form.phone ? ` | Tel: ${form.phone}` : ""}${form.notes ? `\n\nNotas: ${form.notes}` : ""}`;
            if (dealId) {
                const result = await createDealActivity(dealId, "CALL", content);
                if ("error" in result) { setError(result.error ?? "Error al registrar llamada"); return; }
            }
            toast.success("✅ Llamada registrada");
            setForm({ contactName: "", phone: "", outcome: "ANSWERED", duration: "", notes: "" });
            setOpen(false); onSuccess?.(); router.refresh();
        } catch { setError("Error inesperado."); } finally { setLoading(false); }
    };

    const dialogContent = open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
            onClick={(e) => e.target === e.currentTarget && !loading && setOpen(false)}>
            <div style={{ background: "rgba(11,15,25,0.98)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "20px", boxShadow: "0 25px 80px rgba(0,0,0,0.6)", width: "100%", maxWidth: "460px", maxHeight: "90vh", overflowY: "auto" }}>
                {/* Header */}
                <div style={{ padding: "22px 26px 16px", borderBottom: "1px solid rgba(30,41,59,0.8)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: "linear-gradient(135deg,#059669,#0d9488)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Phone style={{ width: "16px", height: "16px", color: "#fff" }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#f1f5f9", margin: 0 }}>Registrar Llamada</h2>
                            <p style={{ fontSize: "11px", color: "#475569", margin: 0, fontFamily: "monospace" }}>Documenta la llamada en el CRM</p>
                        </div>
                    </div>
                    <button onClick={() => setOpen(false)} disabled={loading}
                        style={{ padding: "6px", borderRadius: "8px", color: "#475569", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                        <X style={{ width: "16px", height: "16px" }} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: "18px 26px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div><label style={LBL}>Nombre del contacto</label><input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Ana García" style={IS} /></div>
                        <div><label style={LBL}>Teléfono</label><input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+57 300 000 0000" style={IS} /></div>
                    </div>
                    <div><label style={LBL}>Resultado <span style={{ color: "#f87171" }}>*</span></label><select required value={form.outcome} onChange={(e) => set("outcome", e.target.value)} style={IS}>{CALL_OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                    <div><label style={LBL}>Duración (min)</label><input type="number" min="0" value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="5" style={IS} /></div>
                    <div><label style={LBL}>Notas</label><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="¿De qué se habló? Próximos pasos..." style={{ ...IS, resize: "none" }} /></div>
                    {!dealId && <div style={{ padding: "10px 12px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "10px", fontSize: "11px", color: "#fcd34d" }}>💡 Ábrela desde el perfil del deal para asociarla.</div>}
                    {error && <div style={{ padding: "10px 12px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "10px", fontSize: "12px", color: "#f87171" }}>{error}</div>}
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button type="button" onClick={() => setOpen(false)} disabled={loading}
                            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid rgba(30,41,59,0.9)", background: "transparent", color: "#64748b", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Cancelar</button>
                        <button type="submit" disabled={loading}
                            style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "linear-gradient(135deg,#059669,#0d9488)", color: "#fff", fontWeight: 800, fontSize: "13px", border: "none", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
                            {loading ? "Registrando…" : "Registrar ✓"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <>
            <div onClick={() => setOpen(true)}>
                {trigger ?? (
                    <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "linear-gradient(135deg,#059669,#0d9488)", color: "#fff", fontSize: "12px", fontWeight: 800, borderRadius: "10px", border: "none", cursor: "pointer" }}>
                        <Phone style={{ width: "13px", height: "13px" }} /> Llamada
                    </button>
                )}
            </div>
            {typeof window !== "undefined" && dialogContent ? createPortal(dialogContent, document.body) : null}
        </>
    );
}
