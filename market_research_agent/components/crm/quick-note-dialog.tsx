"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, X } from "lucide-react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { createDealActivity } from "@/actions/crm";

interface Props { companyId: string; dealId?: string; trigger?: React.ReactNode; onSuccess?: () => void; }

export function QuickNoteDialog({ companyId, dealId, trigger, onSuccess }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [note, setNote] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) return;
        setLoading(true); setError("");
        try {
            if (dealId) {
                const result = await createDealActivity(dealId, "NOTE", `📝 ${note}`);
                if ("error" in result) { setError(result.error ?? "Error al guardar nota"); return; }
            }
            toast.success("✅ Nota guardada");
            setNote(""); setOpen(false); onSuccess?.(); router.refresh();
        } catch { setError("Error inesperado."); } finally { setLoading(false); }
    };

    const dialogContent = open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
            onClick={(e) => e.target === e.currentTarget && !loading && setOpen(false)}>
            <div style={{ background: "rgba(11,15,25,0.98)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "20px", boxShadow: "0 25px 80px rgba(0,0,0,0.6)", width: "100%", maxWidth: "440px" }}>
                <div style={{ padding: "22px 26px 16px", borderBottom: "1px solid rgba(30,41,59,0.8)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: "linear-gradient(135deg,#d97706,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <MessageSquare style={{ width: "16px", height: "16px", color: "#fff" }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#f1f5f9", margin: 0 }}>Nota Rápida</h2>
                            <p style={{ fontSize: "11px", color: "#475569", margin: 0, fontFamily: "monospace" }}>Añade un comentario o recordatorio</p>
                        </div>
                    </div>
                    <button onClick={() => setOpen(false)} disabled={loading}
                        style={{ padding: "6px", borderRadius: "8px", color: "#475569", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                        <X style={{ width: "16px", height: "16px" }} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: "18px 26px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px", fontFamily: "monospace" }}>
                            Nota <span style={{ color: "#f87171" }}>*</span>
                        </label>
                        <textarea required value={note} onChange={(e) => setNote(e.target.value)} rows={5}
                            placeholder="Escribe un recordatorio, observación o nota interna..."
                            style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#cbd5e1", width: "100%", outline: "none", resize: "none" }}
                            autoFocus />
                    </div>
                    {!dealId && <div style={{ padding: "10px 12px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "10px", fontSize: "11px", color: "#fcd34d" }}>💡 Ábrela desde el perfil del deal para asociarla.</div>}
                    {error && <div style={{ padding: "10px 12px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "10px", fontSize: "12px", color: "#f87171" }}>{error}</div>}
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button type="button" onClick={() => setOpen(false)} disabled={loading}
                            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid rgba(30,41,59,0.9)", background: "transparent", color: "#64748b", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Cancelar</button>
                        <button type="submit" disabled={loading || !note.trim()}
                            style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "linear-gradient(135deg,#d97706,#ea580c)", color: "#fff", fontWeight: 800, fontSize: "13px", border: "none", cursor: "pointer", opacity: (loading || !note.trim()) ? 0.5 : 1 }}>
                            {loading ? "Guardando…" : "Guardar Nota ✓"}
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
                    <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "linear-gradient(135deg,#d97706,#ea580c)", color: "#fff", fontSize: "12px", fontWeight: 800, borderRadius: "10px", border: "none", cursor: "pointer" }}>
                        <MessageSquare style={{ width: "13px", height: "13px" }} /> Nota
                    </button>
                )}
            </div>
            {typeof window !== "undefined" && dialogContent ? createPortal(dialogContent, document.body) : null}
        </>
    );
}
