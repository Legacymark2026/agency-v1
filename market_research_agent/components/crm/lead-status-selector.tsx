"use client";

import { useTransition, useState, useEffect } from "react";
import { updateLead } from "@/actions/crm";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; border: string; bg: string }> = {
    NEW: { label: "Nuevo", color: "#38bdf8", border: "rgba(56,189,248,0.4)", bg: "rgba(56,189,248,0.1)" },
    CONTACTED: { label: "Contactado", color: "#a78bfa", border: "rgba(167,139,250,0.4)", bg: "rgba(167,139,250,0.1)" },
    QUALIFIED: { label: "Calificado", color: "#2dd4bf", border: "rgba(45,212,191,0.4)", bg: "rgba(45,212,191,0.1)" },
    CONVERTED: { label: "Convertido", color: "#34d399", border: "rgba(52,211,153,0.4)", bg: "rgba(52,211,153,0.1)" },
    LOST: { label: "Perdido", color: "#f87171", border: "rgba(248,113,113,0.4)", bg: "rgba(248,113,113,0.1)" },
};

interface Props {
    leadId: string;
    initialStatus: string;
    isMobile?: boolean;
    canManageLeads?: boolean;
}

export function LeadStatusSelector({ leadId, initialStatus, isMobile = false, canManageLeads = false }: Props) {
    const [status, setStatus] = useState(initialStatus);
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => { setStatus(initialStatus); }, [initialStatus]);

    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["NEW"];

    async function handleStatusChange(newStatus: string) {
        if (newStatus === status) return;
        setIsOpen(false);
        const prev = status;
        setStatus(newStatus);
        startTransition(async () => {
            const res = await updateLead(leadId, { status: newStatus });
            if (res.error) {
                setStatus(prev);
                toast?.error?.(res.error);
            } else {
                toast?.success?.("Estado actualizado");
            }
        });
    }

    return (
        <div style={{ position: "relative", display: "inline-block" }}>
            <button
                onClick={() => canManageLeads && setIsOpen(!isOpen)}
                disabled={isPending || !canManageLeads}
                style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "5px 12px", borderRadius: "99px", fontSize: "11px", fontWeight: 800,
                    color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
                    cursor: canManageLeads ? "pointer" : "default",
                    opacity: isPending ? 0.6 : 1, transition: "all 0.15s",
                    fontFamily: "monospace",
                }}
            >
                {isPending && <Loader2 style={{ width: "12px", height: "12px" }} className="animate-spin" />}
                {cfg.label}
                {canManageLeads && (
                    <ChevronDown style={{ width: "12px", height: "12px", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                )}
            </button>

            {isOpen && (
                <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setIsOpen(false)} />
                    <div style={{
                        position: "absolute", zIndex: 50, marginTop: "6px",
                        width: "160px",
                        background: "rgba(11,15,25,0.98)",
                        border: "1px solid rgba(30,41,59,0.9)",
                        borderRadius: "12px",
                        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                        overflow: "hidden",
                        ...(isMobile ? { bottom: "100%", marginBottom: "6px", left: 0 } : { right: 0 }),
                    }}>
                        <div style={{ padding: "6px" }}>
                            {Object.entries(STATUS_CONFIG).map(([key, c]) => (
                                <button
                                    key={key}
                                    onClick={() => handleStatusChange(key)}
                                    style={{
                                        width: "100%", textAlign: "left", padding: "8px 12px",
                                        fontSize: "11px", fontWeight: 800, fontFamily: "monospace",
                                        color: status === key ? c.color : "#475569",
                                        background: status === key ? c.bg : "transparent",
                                        border: "none", borderRadius: "8px",
                                        cursor: "pointer", transition: "all 0.1s",
                                    }}
                                    onMouseEnter={e => { if (status !== key) (e.currentTarget as HTMLElement).style.background = "rgba(30,41,59,0.7)"; }}
                                    onMouseLeave={e => { if (status !== key) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
