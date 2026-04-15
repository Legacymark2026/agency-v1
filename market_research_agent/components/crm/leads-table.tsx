"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { bulkUpdateLeads } from "@/actions/crm";
import { CreateLeadDialog } from "@/components/crm/create-lead-dialog";
import { Search, Download, ChevronUp, ChevronDown, X, Mail, Phone, ExternalLink } from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Lead {
    id: string; name: string | null; email: string; phone: string | null;
    company: string | null; status: string; source: string; score: number;
    assignedTo: string | null; createdAt: Date; tags: string[];
    utmSource: string | null; utmCampaign: string | null; convertedAt: Date | null;
}

interface Props { leads: Lead[]; total: number; companyId: string; }

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; border: string; bg: string }> = {
    NEW: { label: "Nuevo", color: "#38bdf8", border: "rgba(56,189,248,0.4)", bg: "rgba(56,189,248,0.1)" },
    CONTACTED: { label: "Contactado", color: "#a78bfa", border: "rgba(167,139,250,0.4)", bg: "rgba(167,139,250,0.1)" },
    QUALIFIED: { label: "Calificado", color: "#2dd4bf", border: "rgba(45,212,191,0.4)", bg: "rgba(45,212,191,0.1)" },
    CONVERTED: { label: "Convertido", color: "#34d399", border: "rgba(52,211,153,0.4)", bg: "rgba(52,211,153,0.1)" },
    LOST: { label: "Perdido", color: "#f87171", border: "rgba(248,113,113,0.4)", bg: "rgba(248,113,113,0.1)" },
};

const SOURCE_ICONS: Record<string, string> = {
    GOOGLE: "🔍", FACEBOOK: "📘", INSTAGRAM: "📷", LINKEDIN: "💼",
    REFERRAL: "🤝", DIRECT: "🌐", EMAIL: "✉️", TIKTOK: "🎵", ORGANIC: "🌱",
};

// ─── SCORE BAR ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
    const color = score >= 70 ? "#34d399" : score >= 40 ? "#fbbf24" : "#f87171";
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "60px", height: "4px", background: "rgba(30,41,59,0.8)", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: "99px", boxShadow: `0 0 6px ${color}80` }} />
            </div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", fontFamily: "monospace", minWidth: "24px" }}>{score}</span>
        </div>
    );
}

// ─── CONTROL STYLES ───────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
    background: "rgba(15,23,42,0.8)",
    border: "1px solid rgba(30,41,59,0.9)",
    color: "#cbd5e1",
    borderRadius: "10px",
    padding: "8px 14px",
    fontSize: "13px",
    outline: "none",
    width: "100%",
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function LeadsTable({ leads, total, companyId }: Props) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterSource, setFilterSource] = useState("");
    const [sortCol, setSortCol] = useState("createdAt");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkStatus, setBulkStatus] = useState("");
    const [bulkLoading, setBulkLoading] = useState(false);

    const toggleAll = () => { if (selected.size === leads.length) setSelected(new Set()); else setSelected(new Set(leads.map((l) => l.id))); };
    const toggle = (id: string) => setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    const sortBy = (col: string) => { if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir("asc"); } };

    const filtered = leads.filter((l) => {
        const q = search.toLowerCase();
        const matchSearch = !q || l.name?.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.company?.toLowerCase().includes(q);
        const matchStatus = !filterStatus || l.status === filterStatus;
        const matchSource = !filterSource || l.source === filterSource;
        return matchSearch && matchStatus && matchSource;
    });

    const sorted = [...filtered].sort((a, b) => {
        const av = a[sortCol as keyof Lead]; const bv = b[sortCol as keyof Lead];
        if (av === null || av === undefined) return 1;
        if (bv === null || bv === undefined) return -1;
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
    });

    const handleBulkAction = useCallback(async () => {
        if (!bulkStatus || selected.size === 0) return;
        setBulkLoading(true);
        await bulkUpdateLeads(Array.from(selected), { status: bulkStatus });
        setSelected(new Set()); setBulkStatus(""); setBulkLoading(false);
    }, [bulkStatus, selected]);

    const exportCSV = useCallback(() => {
        const rows = sorted.map((l) => ([l.name ?? "", l.email, l.phone ?? "", l.company ?? "", l.source, l.status, l.score, l.createdAt.toString()]));
        const header = ["Nombre", "Email", "Teléfono", "Empresa", "Fuente", "Estado", "Score", "Fecha"];
        const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click(); URL.revokeObjectURL(url);
    }, [sorted]);

    const SortIcon = ({ col }: { col: string }) => sortCol === col
        ? sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        : <div className="w-3 h-3" />;

    const TH_STYLE: React.CSSProperties = {
        padding: "12px 16px", textAlign: "left", fontSize: "10px",
        fontWeight: 800, color: "#475569", textTransform: "uppercase",
        letterSpacing: "0.08em", fontFamily: "monospace", whiteSpace: "nowrap",
        cursor: "pointer", userSelect: "none",
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* ── Filters bar ── */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                {/* Search */}
                <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                    <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "15px", height: "15px", color: "#475569" }} />
                    <input
                        type="text" placeholder="Buscar nombre, email, empresa..."
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: "38px" }}
                        onFocus={e => (e.target.style.borderColor = "rgba(13,148,136,0.6)")}
                        onBlur={e => (e.target.style.borderColor = "rgba(30,41,59,0.9)")}
                    />
                </div>
                {/* Status filter */}
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ ...inputStyle, width: "auto", minWidth: "150px" }}>
                    <option value="">Todos los estados</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                {/* Source filter */}
                <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}
                    style={{ ...inputStyle, width: "auto", minWidth: "150px" }}>
                    <option value="">Todas las fuentes</option>
                    {Object.keys(SOURCE_ICONS).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {/* Export */}
                <button onClick={exportCSV}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, color: "#94a3b8", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "10px", cursor: "pointer", whiteSpace: "nowrap" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(13,148,136,0.5)"; (e.currentTarget as HTMLElement).style.color = "#2dd4bf"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,41,59,0.9)"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
                >
                    <Download style={{ width: "14px", height: "14px" }} /> Exportar CSV
                </button>
                <CreateLeadDialog companyId={companyId} />
                <span style={{ marginLeft: "auto", fontSize: "11px", color: "#475569", fontFamily: "monospace" }}>
                    {filtered.length} de {total} leads
                </span>
            </div>

            {/* ── Bulk actions ── */}
            {selected.size > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.3)", borderRadius: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#2dd4bf", fontFamily: "monospace" }}>{selected.size} seleccionados</span>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                        <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}
                            style={{ ...inputStyle, width: "auto" }}>
                            <option value="">Cambiar estado…</option>
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <button onClick={handleBulkAction} disabled={!bulkStatus || bulkLoading}
                            style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 800, background: "linear-gradient(135deg,#0d9488,#0f766e)", color: "#fff", borderRadius: "8px", border: "none", cursor: "pointer", opacity: (!bulkStatus || bulkLoading) ? 0.4 : 1 }}>
                            {bulkLoading ? "..." : "Aplicar"}
                        </button>
                    </div>
                    <button onClick={() => setSelected(new Set())} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer" }}>
                        <X style={{ width: "16px", height: "16px" }} />
                    </button>
                </div>
            )}

            {/* ── Table ── */}
            <div style={{ borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(30,41,59,0.8)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ background: "rgba(15,23,42,0.9)", borderBottom: "1px solid rgba(30,41,59,0.9)" }}>
                            <th style={{ ...TH_STYLE, width: "40px" }}>
                                <input type="checkbox" checked={selected.size === leads.length && leads.length > 0} onChange={toggleAll}
                                    style={{ accentColor: "#0d9488", width: "14px", height: "14px" }} />
                            </th>
                            {[
                                { key: "name", label: "Lead" },
                                { key: "status", label: "Estado" },
                                { key: "source", label: "Fuente" },
                                { key: "score", label: "Score" },
                                { key: "company", label: "Empresa" },
                                { key: "createdAt", label: "Fecha" },
                            ].map((col) => (
                                <th key={col.key} style={TH_STYLE} onClick={() => sortBy(col.key)}>
                                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        {col.label} <SortIcon col={col.key} />
                                    </span>
                                </th>
                            ))}
                            <th style={TH_STYLE}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((lead, idx) => {
                            const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG["NEW"];
                            const isSelected = selected.has(lead.id);
                            const rowBg = isSelected
                                ? "rgba(13,148,136,0.08)"
                                : idx % 2 === 0 ? "rgba(11,15,25,0.6)" : "rgba(15,20,35,0.5)";
                            return (
                                <tr key={lead.id}
                                    style={{ background: rowBg, borderBottom: "1px solid rgba(30,41,59,0.5)", transition: "background 0.15s" }}
                                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(13,148,136,0.04)"; }}
                                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = rowBg; }}
                                >
                                    <td style={{ padding: "12px 16px" }}>
                                        <input type="checkbox" checked={isSelected} onChange={() => toggle(lead.id)}
                                            style={{ accentColor: "#0d9488", width: "14px", height: "14px" }} />
                                    </td>
                                    <td style={{ padding: "12px 16px" }}>
                                        <Link href={`/dashboard/admin/crm/leads/${lead.id}`}
                                            style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg,#0d9488,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: "12px", flexShrink: 0 }}>
                                                {(lead.name || lead.email)[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700, color: "#e2e8f0", margin: 0, fontSize: "13px" }}>{lead.name || "Sin nombre"}</p>
                                                <p style={{ fontSize: "11px", color: "#475569", margin: 0, fontFamily: "monospace" }}>{lead.email}</p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td style={{ padding: "12px 16px" }}>
                                        <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 800, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                                            {cfg.label}
                                        </span>
                                    </td>
                                    <td style={{ padding: "12px 16px" }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
                                            <span>{SOURCE_ICONS[lead.source] ?? "🌐"}</span>
                                            <span style={{ fontFamily: "monospace" }}>{lead.source}</span>
                                        </span>
                                    </td>
                                    <td style={{ padding: "12px 16px" }}><ScoreBar score={lead.score} /></td>
                                    <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "13px" }}>{lead.company || "—"}</td>
                                    <td style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                                        {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: es })}
                                    </td>
                                    <td style={{ padding: "12px 16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            {lead.email && (
                                                <a href={`mailto:${lead.email}`}
                                                    style={{ padding: "5px", borderRadius: "7px", color: "#475569", display: "flex", transition: "all 0.15s" }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#38bdf8"; (e.currentTarget as HTMLElement).style.background = "rgba(56,189,248,0.1)"; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#475569"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                                    <Mail style={{ width: "14px", height: "14px" }} />
                                                </a>
                                            )}
                                            {lead.phone && (
                                                <a href={`tel:${lead.phone}`}
                                                    style={{ padding: "5px", borderRadius: "7px", color: "#475569", display: "flex", transition: "all 0.15s" }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#34d399"; (e.currentTarget as HTMLElement).style.background = "rgba(52,211,153,0.1)"; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#475569"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                                    <Phone style={{ width: "14px", height: "14px" }} />
                                                </a>
                                            )}
                                            <Link href={`/dashboard/admin/crm/leads/${lead.id}`}
                                                style={{ padding: "5px 10px", fontSize: "11px", fontWeight: 800, color: "#2dd4bf", background: "rgba(13,148,136,0.12)", borderRadius: "7px", textDecoration: "none", fontFamily: "monospace", border: "1px solid rgba(13,148,136,0.25)", transition: "all 0.15s" }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(13,148,136,0.25)"; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(13,148,136,0.12)"; }}>
                                                Ver
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {sorted.length === 0 && (
                            <tr>
                                <td colSpan={8} style={{ padding: "64px 16px", textAlign: "center", color: "#334155", fontSize: "12px", fontFamily: "monospace" }}>
                                    — No hay leads con estos filtros —
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
