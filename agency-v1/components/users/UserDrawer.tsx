"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    X, Key, Activity, ShieldAlert, MonitorOff,
    Smartphone, Copy, AlertTriangle, Download,
    Briefcase, MapPin, AtSign
} from "lucide-react";
import { forcePasswordReset, revokeAllSessions, updateUserMeta, getUserAuditLogs } from "@/actions/admin";

import type { UserRecord } from "./UsersDashboardClient";

interface UserDrawerProps { user: UserRecord | null; onClose: () => void; onUpdate: (userId: string, data: Partial<UserRecord>) => void; }

const CARD: React.CSSProperties = { background: "rgba(15,23,42,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "12px", padding: "12px" };
const LBL: React.CSSProperties = { fontSize: "9px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" };
const VAL: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#e2e8f0" };

export function UserDrawer({ user, onClose, onUpdate }: UserDrawerProps) {
    const [activeTab, setActiveTab] = useState<"info" | "security" | "audit">("info");
    const [isResetting, setIsResetting] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);
    const [notes, setNotes] = useState(user?.adminNotes || "");
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    if (!user) return null;

    const handleTabChange = async (tab: "info" | "security" | "audit") => {
        setActiveTab(tab);
        if (tab === "audit" && auditLogs.length === 0) {
            setIsLoadingLogs(true);
            const res = await getUserAuditLogs(user.id);
            if (res.success) setAuditLogs(res.logs || []);
            setIsLoadingLogs(false);
        }
    };

    const handleForceReset = async () => { setIsResetting(true); const res = await forcePasswordReset(user.id); if (res.success) toast.success("Enlace de reseteo enviado"); else toast.error(res.error); setIsResetting(false); };
    const handleRevokeSessions = async () => { setIsRevoking(true); const res = await revokeAllSessions(user.id); if (res.success) toast.success("Sistema purgando sesiones..."); else toast.error(res.error); setIsRevoking(false); };
    const handleSaveNotes = async () => { const res = await updateUserMeta(user.id, { adminNotes: notes }); if (res.success) { toast.success("Notas guardadas."); onUpdate(user.id, { adminNotes: notes }); } };
    const copyToClipboard = (text: string, label: string) => { navigator.clipboard.writeText(text); toast.success(`${label} copiado`); };

    const TABS = [
        { id: "info", label: "Perfil HR", accent: "#6366f1" },
        { id: "security", label: "Seguridad", accent: "#f87171", icon: <ShieldAlert size={12} /> },
        { id: "audit", label: "Auditoría", accent: "#fbbf24", icon: <Activity size={12} /> },
    ] as const;

    return (
        <AnimatePresence>
            {user && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 40 }} />

                    <motion.div initial={{ x: "100%", opacity: 0.5 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0.5 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        style={{ position: "fixed", right: 0, top: 0, height: "100%", width: "100%", maxWidth: "420px", background: "rgba(11,15,25,0.98)", borderLeft: "1px solid rgba(30,41,59,0.9)", boxShadow: "-20px 0 60px rgba(0,0,0,0.5)", zIndex: 50, display: "flex", flexDirection: "column" }}>

                        {/* Header */}
                        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(30,41,59,0.8)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,#6366f1,#0d9488,#7c3aed)" }} />
                            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg,#6366f1,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 900, color: "#fff" }}>
                                    {user.name?.[0]?.toUpperCase() ?? "U"}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: "17px", fontWeight: 900, color: "#f1f5f9", margin: 0, lineHeight: 1.2 }}>{user.name || "Sin Nombre"}</h2>
                                    <p style={{ fontSize: "12px", color: "#475569", margin: 0, fontFamily: "monospace", display: "flex", alignItems: "center", gap: "4px" }}>
                                        {user.email}
                                        {user.emailVerified && <span style={{ color: "#34d399" }}>✓</span>}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose}
                                style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(30,41,59,0.8)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", cursor: "pointer" }}>
                                <X size={14} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: "flex", borderBottom: "1px solid rgba(30,41,59,0.8)", padding: "0 16px" }}>
                            {TABS.map((tab) => (
                                <button key={tab.id} onClick={() => handleTabChange(tab.id as any)}
                                    style={{ padding: "10px 14px", fontSize: "11px", fontWeight: 800, fontFamily: "monospace", display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", borderBottom: `2px solid ${activeTab === tab.id ? tab.accent : "transparent"}`, color: activeTab === tab.id ? tab.accent : "#475569", cursor: "pointer", transition: "all 0.15s" }}>
                                    {tab.label} {(tab as any).icon}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>

                            {/* TAB: INFO */}
                            {activeTab === "info" && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                        <div style={CARD}><p style={LBL}><Briefcase size={9} /> Posición</p><p style={VAL}>{user.jobTitle || "No Asignado"}</p></div>
                                        <div style={CARD}><p style={LBL}><Smartphone size={9} /> Contacto</p><p style={VAL}>{user.phone || "Sin Número"}</p></div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px", fontFamily: "monospace" }}>Notas Privadas (Admin Solo)</label>
                                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={handleSaveNotes}
                                            style={{ width: "100%", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "10px", padding: "10px 12px", fontSize: "13px", color: "#fcd34d", height: "80px", outline: "none", resize: "none" }}
                                            placeholder="Detalles sobre rendimiento, notas legales..." />
                                    </div>
                                    <div style={{ ...CARD, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div>
                                            <p style={{ fontSize: "12px", fontWeight: 700, color: "#e2e8f0", margin: "0 0 2px" }}>Copia de Datos (GDPR)</p>
                                            <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>Extraer Info. en formato JSON.</p>
                                        </div>
                                        <button onClick={() => toast.success("JSON Generado", { icon: <Download size={14} /> })}
                                            style={{ width: "32px", height: "32px", background: "rgba(30,41,59,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", cursor: "pointer" }}>
                                            <Download size={13} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB: SECURITY */}
                            {activeTab === "security" && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "12px", padding: "14px" }}>
                                        <h3 style={{ color: "#f87171", fontWeight: 800, fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", fontFamily: "monospace" }}>
                                            <AlertTriangle size={14} /> Acciones de Riesgo
                                        </h3>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            <button onClick={handleForceReset} disabled={isResetting}
                                                style={{ width: "100%", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                                                Forzar Reseteo de Clave <Key size={14} />
                                            </button>
                                            <button onClick={handleRevokeSessions} disabled={isRevoking}
                                                style={{ width: "100%", background: "rgba(220,38,38,0.8)", border: "none", color: "#fff", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                                                Revocar Todas las Sesiones <MonitorOff size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div style={CARD}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" }}>Estado MFA (2FA)</span>
                                            <span style={{ padding: "3px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: 800, fontFamily: "monospace", color: user.mfaEnabled ? "#34d399" : "#475569", background: user.mfaEnabled ? "rgba(52,211,153,0.12)" : "rgba(71,85,105,0.15)", border: `1px solid ${user.mfaEnabled ? "rgba(52,211,153,0.3)" : "rgba(71,85,105,0.3)"}` }}>
                                                {user.mfaEnabled ? "Activo" : "Inactivo"}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: "11px", color: "#334155" }}>Si un usuario pierde acceso a 2FA, contacta soporte L2 para reset.</p>
                                    </div>
                                    <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "12px", padding: "14px" }}>
                                        <h3 style={{ color: "#a78bfa", fontWeight: 900, fontSize: "13px", margin: "0 0 4px", fontFamily: "monospace" }}>Simular Sesión (Impersonate)</h3>
                                        <p style={{ fontSize: "11px", color: "#475569", margin: "0 0 12px" }}>Navega la plataforma exactamente como {user.name} lo hace.</p>
                                        <button onClick={() => toast("Impersonate Mode activado", { style: { background: "#0f172a", color: "white" } })}
                                            style={{ width: "100%", background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "#fff", padding: "8px", borderRadius: "8px", fontSize: "12px", fontWeight: 800, border: "none", cursor: "pointer" }}>
                                            Ver como Usuario...
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB: AUDIT */}
                            {activeTab === "audit" && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                        <div style={CARD}><p style={LBL}>Sesiones Activas</p><p style={{ fontSize: "24px", fontWeight: 900, color: "#2dd4bf", margin: 0, fontFamily: "monospace" }}>{user._count?.activityLogs ?? 0}</p></div>
                                        <div style={CARD}><p style={LBL}>Inactividad</p><p style={{ fontSize: "24px", fontWeight: 900, color: "#fbbf24", margin: 0, fontFamily: "monospace" }}>12D</p></div>
                                    </div>
                                    <div style={{ ...CARD, padding: "16px" }}>
                                        <h3 style={{ fontWeight: 800, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px", fontFamily: "monospace" }}>
                                            <Activity size={10} /> Timeline Breve
                                        </h3>
                                        <div style={{ position: "relative", borderLeft: "1px solid rgba(30,41,59,0.9)", marginLeft: "6px", display: "flex", flexDirection: "column", gap: "14px" }}>
                                            {isLoadingLogs ? <p style={{ fontSize: "12px", color: "#334155", marginLeft: "16px", fontFamily: "monospace" }}>Cargando...</p>
                                                : auditLogs.length === 0 ? <p style={{ fontSize: "12px", color: "#334155", marginLeft: "16px", fontFamily: "monospace" }}>Sin actividad reciente.</p>
                                                    : auditLogs.map((log) => {
                                                        const isAlert = log.action.includes("FAIL") || log.action.includes("RESET");
                                                        return (
                                                            <div key={log.id} style={{ position: "relative", paddingLeft: "16px" }}>
                                                                <div style={{ position: "absolute", width: "8px", height: "8px", borderRadius: "50%", left: "-4.5px", top: "4px", background: isAlert ? "#f87171" : "#34d399", boxShadow: isAlert ? "0 0 8px rgba(248,113,113,0.5)" : "0 0 8px rgba(52,211,153,0.5)" }} />
                                                                <p style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", margin: "0 0 2px", fontFamily: "monospace" }}>{log.action}</p>
                                                                <p style={{ fontSize: "10px", color: "#334155", margin: 0, fontFamily: "monospace" }}>
                                                                    {new Date(log.createdAt).toLocaleString()} desde <span style={{ color: "#6366f1" }}>{log.ipAddress}</span>
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(30,41,59,0.8)", background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                            onClick={() => copyToClipboard(user.id, "ID Interno")}>
                            <div>
                                <p style={{ fontSize: "9px", fontWeight: 800, color: "#334155", textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 2px" }}>System DB_ID</p>
                                <p style={{ fontSize: "11px", fontFamily: "monospace", color: "#475569", margin: 0 }}>{user.id.slice(0, 24)}…</p>
                            </div>
                            <Copy size={14} style={{ color: "#334155" }} />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
