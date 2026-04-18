"use client";

import { Mail, Phone } from "lucide-react";
import { logLeadContact } from "@/actions/inbox";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface Props {
    lead: {
        id: string;
        name: string | null;
        email: string;
        phone: string | null;
        jobTitle: string | null;
        company: string | null;
        score: number;
        message: string | null;
    };
    children?: React.ReactNode;
    canManageLeads?: boolean;
}

import { LeadScoreEditor } from "./lead-score-editor";

export function LeadProfileHeader({ lead, children, canManageLeads = false }: Props) {
    const [isPending, startTransition] = useTransition();

    const handleContact = (channel: string, target: string) => {
        startTransition(async () => {
            try {
                const res = await logLeadContact(lead.id, channel);
                if (!res.success) toast.error("Error al registrar contacto: " + res.error);
            } catch (error) {
                console.error("Failed to log contact", error);
            } finally {
                if (channel === "WHATSAPP") window.open(target, "_blank");
                else window.location.href = target;
            }
        });
    };

    const btnBase: React.CSSProperties = {
        display: "flex", alignItems: "center", gap: "8px",
        padding: "7px 14px", fontSize: "12px", fontWeight: 600,
        background: "rgba(15,23,42,0.7)", border: "1px solid rgba(30,41,59,0.9)",
        borderRadius: "10px", cursor: "pointer", color: "#64748b",
        transition: "all 0.15s", opacity: isPending ? 0.5 : 1,
    };

    return (
        <div style={{
            background: "rgba(11,15,25,0.8)",
            border: "1px solid rgba(30,41,59,0.8)",
            borderRadius: "20px",
            overflow: "hidden",
            position: "relative",
            backdropFilter: "blur(12px)",
        }}>
            {/* Top accent bar */}
            <div style={{ height: "3px", background: "linear-gradient(90deg,#0d9488,#0891b2,#7c3aed)" }} />

            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "row", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* Avatar */}
                <div style={{
                    width: "72px", height: "72px", borderRadius: "16px", flexShrink: 0,
                    background: "linear-gradient(135deg,#0d9488,#0891b2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 900, fontSize: "28px",
                    boxShadow: "0 0 24px rgba(13,148,136,0.4)",
                }}>
                    {(lead.name || lead.email)[0].toUpperCase()}
                </div>

                {/* Identity */}
                <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                        <div>
                            <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#f1f5f9", margin: "0 0 4px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                                {lead.name || "Sin nombre"}
                            </h1>
                            {lead.jobTitle && <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 2px", fontWeight: 600 }}>{lead.jobTitle}</p>}
                            {lead.company && (
                                <p style={{ fontSize: "12px", color: "#475569", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                                    <span>🏢</span> {lead.company}
                                </p>
                            )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                            {children}
                        </div>
                    </div>

                    {/* Contact buttons */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
                        {lead.email && (
                            <button onClick={() => handleContact("EMAIL", `mailto:${lead.email}`)} disabled={isPending}
                                style={btnBase}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(13,148,136,0.4)"; (e.currentTarget as HTMLElement).style.color = "#2dd4bf"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,41,59,0.9)"; (e.currentTarget as HTMLElement).style.color = "#64748b"; }}>
                                <Mail style={{ width: "14px", height: "14px" }} />
                                <span style={{ fontFamily: "monospace" }}>{lead.email}</span>
                            </button>
                        )}
                        {lead.phone && (
                            <button onClick={() => handleContact("PHONE", `tel:${lead.phone}`)} disabled={isPending}
                                style={btnBase}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(13,148,136,0.4)"; (e.currentTarget as HTMLElement).style.color = "#2dd4bf"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,41,59,0.9)"; (e.currentTarget as HTMLElement).style.color = "#64748b"; }}>
                                <Phone style={{ width: "14px", height: "14px" }} />
                                <span style={{ fontFamily: "monospace" }}>{lead.phone}</span>
                            </button>
                        )}
                        {lead.phone && (
                            <button onClick={() => handleContact("WHATSAPP", `https://wa.me/${lead.phone!.replace(/\D/g, "")}`)} disabled={isPending}
                                style={{ ...btnBase, color: "#34d399", borderColor: "rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.08)" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(52,211,153,0.5)"; (e.currentTarget as HTMLElement).style.background = "rgba(52,211,153,0.14)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(52,211,153,0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(52,211,153,0.08)"; }}>
                                <span style={{ fontSize: "14px", lineHeight: 1 }}>💬</span> WhatsApp
                            </button>
                        )}
                    </div>
                </div>

                {/* Score */}
                <div style={{ flexShrink: 0 }}>
                    <LeadScoreEditor leadId={lead.id} initialScore={lead.score} canManageLeads={canManageLeads} />
                </div>
            </div>

            {/* Message section */}
            {lead.message && (
                <div style={{ padding: "16px 32px 24px", borderTop: "1px solid rgba(30,41,59,0.6)" }}>
                    <p style={{ fontSize: "9px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace", marginBottom: "8px" }}>
                        Mensaje del Lead
                    </p>
                    <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6, fontStyle: "italic", background: "rgba(15,23,42,0.5)", padding: "12px 16px", borderRadius: "10px", border: "1px solid rgba(30,41,59,0.7)", margin: 0 }}>
                        "{lead.message}"
                    </p>
                </div>
            )}
        </div>
    );
}
