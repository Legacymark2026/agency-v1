"use client";

import { useState } from "react";
import { createDealActivity } from "@/actions/crm";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, Phone, Mail, Users, FileText, Plus } from "lucide-react";

interface Activity {
    id: string; type: string; content: string; createdAt: Date;
    user?: { name: string | null; image: string | null };
}
interface Props { dealId: string; activities: Activity[]; }

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; border: string; bg: string }> = {
    NOTE: { icon: <FileText style={{ width: "13px", height: "13px" }} />, label: "Nota", color: "#94a3b8", border: "rgba(148,163,184,0.3)", bg: "rgba(148,163,184,0.1)" },
    CALL: { icon: <Phone style={{ width: "13px", height: "13px" }} />, label: "Llamada", color: "#2dd4bf", border: "rgba(45,212,191,0.3)", bg: "rgba(45,212,191,0.1)" },
    EMAIL: { icon: <Mail style={{ width: "13px", height: "13px" }} />, label: "Email", color: "#38bdf8", border: "rgba(56,189,248,0.3)", bg: "rgba(56,189,248,0.1)" },
    MEETING: { icon: <Users style={{ width: "13px", height: "13px" }} />, label: "Reunión", color: "#a78bfa", border: "rgba(167,139,250,0.3)", bg: "rgba(167,139,250,0.1)" },
    INBOX_MESSAGE: { icon: <MessageSquare style={{ width: "13px", height: "13px" }} />, label: "Inbox", color: "#fbbf24", border: "rgba(251,191,36,0.3)", bg: "rgba(251,191,36,0.1)" },
};

export function DealActivityTimeline({ dealId, activities: initial }: Props) {
    const [activities, setActivities] = useState(initial);
    const [type, setType] = useState("NOTE");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        if (!content.trim()) return;
        setLoading(true);
        const result = await createDealActivity(dealId, type, content.trim());
        if ("success" in result) {
            setActivities([{ id: Date.now().toString(), type, content: content.trim(), createdAt: new Date(), user: undefined }, ...activities]);
            setContent("");
        }
        setLoading(false);
    };

    const cfg_curr = TYPE_CONFIG[type] ?? TYPE_CONFIG["NOTE"];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Add activity panel */}
            <div style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "14px", padding: "16px" }}>
                <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                        <button key={k} onClick={() => setType(k)}
                            style={{
                                display: "flex", alignItems: "center", gap: "5px",
                                padding: "5px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 800, fontFamily: "monospace",
                                border: `1px solid ${type === k ? v.border : "rgba(30,41,59,0.7)"}`,
                                background: type === k ? v.bg : "transparent",
                                color: type === k ? v.color : "#475569",
                                cursor: "pointer", transition: "all 0.15s",
                            }}>
                            {v.icon} {v.label}
                        </button>
                    ))}
                </div>
                <textarea value={content} onChange={(e) => setContent(e.target.value)}
                    placeholder={`Añadir ${cfg_curr.label.toLowerCase()}...`} rows={3}
                    style={{ width: "100%", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#cbd5e1", outline: "none", resize: "none" }} />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                    <button onClick={handleAdd} disabled={loading || !content.trim()}
                        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "linear-gradient(135deg,#0d9488,#0f766e)", color: "#fff", fontSize: "12px", fontWeight: 800, borderRadius: "10px", border: "none", cursor: "pointer", opacity: (loading || !content.trim()) ? 0.4 : 1 }}>
                        <Plus style={{ width: "13px", height: "13px" }} /> {loading ? "Guardando…" : "Añadir"}
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ position: "absolute", left: "19px", top: 0, bottom: 0, width: "1px", background: "rgba(30,41,59,0.8)" }} aria-hidden />
                {activities.length === 0 && (
                    <p style={{ fontSize: "12px", color: "#334155", textAlign: "center", padding: "32px 0", fontFamily: "monospace" }}>— Sin actividades registradas —</p>
                )}
                {activities.map((a) => {
                    const c = TYPE_CONFIG[a.type] ?? TYPE_CONFIG["NOTE"];
                    return (
                        <div key={a.id} style={{ display: "flex", gap: "14px", position: "relative" }}>
                            <div style={{ position: "relative", zIndex: 10, width: "38px", height: "38px", borderRadius: "50%", background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: c.color }}>
                                {c.icon}
                            </div>
                            <div style={{ flex: 1, background: "rgba(11,15,25,0.6)", border: "1px solid rgba(30,41,59,0.7)", borderRadius: "12px", padding: "12px 14px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: c.color, fontFamily: "monospace" }}>{c.label}</span>
                                    <span style={{ fontSize: "11px", color: "#334155", fontFamily: "monospace" }}>
                                        {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: es })}
                                    </span>
                                </div>
                                <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>{a.content}</p>
                                {a.user?.name && <p style={{ fontSize: "11px", color: "#334155", marginTop: "8px", fontFamily: "monospace" }}>— {a.user.name}</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
