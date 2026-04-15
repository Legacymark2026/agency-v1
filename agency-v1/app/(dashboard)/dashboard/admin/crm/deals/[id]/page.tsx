import { notFound } from "next/navigation";
import Link from "next/link";
import { getDealById } from "@/actions/crm-advanced";
import { getDealStageHistory, getProposalsByDeal, getInvoicesByDeal, getCompanyUsers } from "@/actions/crm-closing";
import { DealActivityTimeline } from "@/components/crm/deal-activity-timeline";
import { DealStageTimeline } from "@/components/crm/DealStageTimeline";
import { ProposalPanel } from "@/components/crm/ProposalPanel";
import { InvoicesPanel } from "@/components/crm/InvoicesPanel";
import { DealAssignSelect } from "@/components/crm/DealAssignSelect";
import { WhatsAppFloatingBtn } from "@/components/crm/WhatsAppFloatingBtn";
import { prisma } from "@/lib/prisma";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import {
    ArrowLeft, Clock, Tag, DollarSign, Calendar, User, AlertTriangle,
    GitBranch, FileText, FileCheck2, CheckSquare, ExternalLink
} from "lucide-react";
import { STAGES as BASE_STAGES } from "@/lib/crm-config";

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string; step: number; accent: string }> = {
    NEW: { label: "Nuevo", color: "text-slate-400", bg: "rgba(100,116,139,0.1)", step: 1, accent: "#64748b" },
    CONTACTED: { label: "Contactado", color: "text-sky-400", bg: "rgba(14,165,233,0.1)", step: 2, accent: "#0ea5e9" },
    QUALIFIED: { label: "Calificado", color: "text-violet-400", bg: "rgba(139,92,246,0.1)", step: 3, accent: "#8b5cf6" },
    PROPOSAL: { label: "Propuesta", color: "text-amber-400", bg: "rgba(245,158,11,0.1)", step: 4, accent: "#f59e0b" },
    NEGOTIATION: { label: "Negociación", color: "text-orange-400", bg: "rgba(249,115,22,0.1)", step: 5, accent: "#f97316" },
    WON: { label: "Ganado ✓", color: "text-emerald-400", bg: "rgba(16,185,129,0.1)", step: 6, accent: "#10b981" },
    LOST: { label: "Perdido", color: "text-red-400", bg: "rgba(239,68,68,0.1)", step: 6, accent: "#ef4444" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    LOW: { label: "Baja", color: "#64748b" },
    MEDIUM: { label: "Media", color: "#f59e0b" },
    HIGH: { label: "Alta", color: "#f97316" },
    URGENT: { label: "Urgente 🔥", color: "#ef4444" },
};

// Reusable HUD section card
function Section({ title, icon, children, accentColor = "#0d9488" }: { title: string; icon: React.ReactNode; children: React.ReactNode; accentColor?: string }) {
    return (
        <div style={{
            background: "rgba(11,15,25,0.85)", border: "1px solid rgba(30,41,59,0.8)",
            borderRadius: 16, overflow: "hidden"
        }}>
            <div style={{ height: 2, background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
            <div style={{ padding: "16px 18px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                        background: `${accentColor}22`, border: `1px solid ${accentColor}44`
                    }}>
                        {icon}
                    </div>
                    <p style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                        {title}
                    </p>
                </div>
                {children}
            </div>
        </div>
    );
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function DealDetailPage(props: PageProps) {
    const params = await props.params;
    const [result, company] = await Promise.all([getDealById(params.id), prisma.company.findFirst()]);
    if ("error" in result || !result.deal) return notFound();
    const { deal } = result;

    // Parallel data fetching for all new panels
    const [stageHistory, proposals, invoices, companyUsers, relatedLead] = await Promise.all([
        getDealStageHistory(deal.id).catch(() => []),
        getProposalsByDeal(deal.id).catch(() => []),
        getInvoicesByDeal(deal.id).catch(() => []),
        company ? getCompanyUsers(company.id).catch(() => []) : [],
        prisma.lead.findFirst({
            where: { convertedToDealId: deal.id },
            include: {
                conversations: {
                    include: {
                        messages: { orderBy: { createdAt: 'desc' } }
                    }
                }
            }
        }).catch(() => null),
    ]);

    let inboxActivities: any[] = [];
    if (relatedLead?.conversations) {
        relatedLead.conversations.forEach((conv: any) => {
            conv.messages?.forEach((msg: any) => {
                // Ignore system notifications in the general timeline if needed, but here we include all messages
                inboxActivities.push({
                    id: msg.id,
                    type: "INBOX_MESSAGE",
                    content: msg.content,
                    createdAt: msg.createdAt,
                    user: msg.direction === 'OUTBOUND' ? { name: "Compañía", image: null } : { name: relatedLead.name || relatedLead.email, image: null }
                });
            });
        });
    }

    const allActivities = [...(deal.activities || []), ...inboxActivities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const stage = STAGE_CONFIG[deal.stage] ?? STAGE_CONFIG["NEW"];
    const priority = PRIORITY_CONFIG[deal.priority] ?? PRIORITY_CONFIG["MEDIUM"];
    const daysSinceActivity = differenceInDays(new Date(), deal.lastActivity ?? deal.updatedAt);
    const isStagnant = daysSinceActivity > 7 && !["WON", "LOST"].includes(deal.stage);
    const STAGES = BASE_STAGES.map(s => s.id);

    return (
        <div style={{ minHeight: "100vh", background: "rgb(2,6,14)", color: "#cbd5e1" }}>
            {/* HUD Grid overlay */}
            <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(30,41,59,0.3) 1px, transparent 0)", backgroundSize: "24px 24px", pointerEvents: "none", zIndex: 0 }} />

            {/* Sticky Header */}
            <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(2,6,14,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(30,41,59,0.8)", padding: "12px 24px" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <Link href="/dashboard/admin/crm/pipeline" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#475569", textDecoration: "none", fontFamily: "monospace" }}>
                        <ArrowLeft style={{ width: 13, height: 13 }} /> Pipeline
                    </Link>
                    <span style={{ color: "#1e293b" }}>/</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", fontFamily: "monospace" }}>{deal.title}</span>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {isStagnant && (
                            <div style={{
                                display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
                                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 999,
                                fontSize: 10, fontWeight: 800, color: "#fbbf24", fontFamily: "monospace",
                                animation: "pulse 2s ease-in-out infinite"
                            }}>
                                <AlertTriangle style={{ width: 11, height: 11 }} />
                                STAGNANT · {daysSinceActivity}d sin actividad
                            </div>
                        )}
                        <span style={{
                            padding: "4px 12px", borderRadius: 999, fontSize: 10, fontWeight: 800, fontFamily: "monospace",
                            background: stage.bg, color: stage.accent, border: `1px solid ${stage.accent}44`,
                            boxShadow: `0 0 12px ${stage.accent}22`
                        }}>
                            {stage.label}
                        </span>
                        <Link href={`/dashboard/admin/crm/pipeline`}
                            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#475569", textDecoration: "none", padding: "4px 8px", border: "1px solid rgba(30,41,59,0.8)", borderRadius: 7 }}>
                            <ExternalLink style={{ width: 10, height: 10 }} /> Pipeline
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stage Progress Bar */}
            <div style={{ background: "rgba(11,15,25,0.8)", borderBottom: "1px solid rgba(30,41,59,0.5)", padding: "10px 24px", position: "relative", zIndex: 1 }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 0 }}>
                    {STAGES.map((s, i) => {
                        const cfg = STAGE_CONFIG[s];
                        const isActive = s === deal.stage;
                        const isPast = cfg.step < (STAGE_CONFIG[deal.stage]?.step ?? 1);
                        const isWon = deal.stage === "WON" && s === "WON";
                        return (
                            <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                                <div style={{
                                    flex: 1, textAlign: "center", padding: "6px 4px", fontSize: 9, fontWeight: 800,
                                    fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", borderRadius: 8,
                                    background: isWon ? "#065f46" : isActive ? `${cfg.accent}22` : isPast ? "rgba(13,148,136,0.1)" : "rgba(30,41,59,0.3)",
                                    color: isWon ? "#34d399" : isActive ? cfg.accent : isPast ? "#2dd4bf" : "#334155",
                                    border: isActive ? `1px solid ${cfg.accent}66` : "1px solid transparent",
                                    boxShadow: isActive ? `0 0 12px ${cfg.accent}22` : "none",
                                    transition: "all 0.3s"
                                }}>
                                    {cfg.label.replace(" ✓", "")}
                                </div>
                                {i < STAGES.length - 1 && (
                                    <div style={{ width: 16, height: 1, background: isPast ? "#0d9488" : "rgba(30,41,59,0.8)", flexShrink: 0, transition: "background 0.3s" }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px", position: "relative", zIndex: 1 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

                    {/* ── LEFT COLUMN ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Main Deal Card */}
                        <div style={{ background: "rgba(11,15,25,0.9)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: 18, overflow: "hidden" }}>
                            <div style={{ height: 3, background: `linear-gradient(90deg, ${stage.accent}, #0ea5e9, #8b5cf6)` }} />
                            <div style={{ padding: "24px 24px 20px" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                                    <div style={{
                                        width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                                        background: `linear-gradient(135deg, ${stage.accent}, #0ea5e9)`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: `0 8px 24px ${stage.accent}44`
                                    }}>
                                        <DollarSign style={{ width: 24, height: 24, color: "white" }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#f1f5f9", margin: 0, lineHeight: 1.2 }}>{deal.title}</h1>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                                            <span style={{ fontSize: 28, fontWeight: 900, color: "#2dd4bf", fontFamily: "monospace" }}>
                                                ${deal.value.toLocaleString()}
                                            </span>
                                            <span style={{ fontSize: 11, fontWeight: 800, color: priority.color }}>● {priority.label} prioridad</span>
                                            <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>{deal.probability}% prob.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact */}
                                {(deal.contactName || deal.contactEmail) && (
                                    <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                                            background: "linear-gradient(135deg, #7c3aed, #0ea5e9)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 14, fontWeight: 900, color: "white"
                                        }}>
                                            {(deal.contactName || deal.contactEmail || "?")[0].toUpperCase()}
                                        </div>
                                        <div>
                                            {deal.contactName && <p style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{deal.contactName}</p>}
                                            {deal.contactEmail && <a href={`mailto:${deal.contactEmail}`} style={{ fontSize: 11, color: "#2dd4bf", textDecoration: "none" }}>{deal.contactEmail}</a>}
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {deal.notes && (
                                    <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12 }}>
                                        <p style={{ fontSize: 9, fontWeight: 800, color: "#fbbf24", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>📝 Notas</p>
                                        <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>{deal.notes}</p>
                                    </div>
                                )}

                                {/* Tags */}
                                {deal.tags?.length > 0 && (
                                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                        <Tag style={{ width: 12, height: 12, color: "#475569" }} />
                                        {deal.tags.map((tag) => (
                                            <span key={tag} style={{
                                                fontSize: 10, fontWeight: 700, padding: "2px 8px",
                                                background: "rgba(13,148,136,0.1)", color: "#2dd4bf",
                                                border: "1px solid rgba(13,148,136,0.3)", borderRadius: 6
                                            }}>{tag}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Lost Reason */}
                                {deal.stage === "LOST" && deal.lostReason && (
                                    <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12 }}>
                                        <p style={{ fontSize: 9, fontWeight: 800, color: "#f87171", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>⚠️ Razón de pérdida</p>
                                        <p style={{ fontSize: 12, color: "#fca5a5", margin: 0 }}>{deal.lostReason}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* F4: Proposals Panel */}
                        <Section title="Propuestas y Cotizaciones" icon={<FileText style={{ width: 13, height: 13, color: "#f59e0b" }} />} accentColor="#f59e0b">
                            <ProposalPanel dealId={deal.id} initialProposals={proposals as any} />
                        </Section>

                        {/* F7: Invoices Panel */}
                        <Section title="Facturas Vinculadas" icon={<FileCheck2 style={{ width: 13, height: 13, color: "#8b5cf6" }} />} accentColor="#8b5cf6">
                            <InvoicesPanel dealId={deal.id} initialInvoices={invoices as any} />
                        </Section>

                        {/* Activity Timeline */}
                        <Section title="Actividad del Deal" icon={<CheckSquare style={{ width: 13, height: 13, color: "#0d9488" }} />} accentColor="#0d9488">
                            <DealActivityTimeline dealId={deal.id} activities={allActivities as any} />
                        </Section>

                        {/* F5: Stage History Timeline */}
                        <Section title="Historial de Etapas" icon={<GitBranch style={{ width: 13, height: 13, color: "#0ea5e9" }} />} accentColor="#0ea5e9">
                            <DealStageTimeline history={stageHistory as any} />
                        </Section>
                    </div>

                    {/* ── RIGHT SIDEBAR ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                        {/* KPI Cards */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {[
                                { label: "Valor", value: `$${deal.value.toLocaleString()}`, icon: "💰", color: "#2dd4bf" },
                                { label: "Probabilidad", value: `${deal.probability}%`, icon: "🎯", color: "#a78bfa" },
                            ].map((k) => (
                                <div key={k.label} style={{
                                    background: "rgba(11,15,25,0.9)", border: "1px solid rgba(30,41,59,0.8)",
                                    borderRadius: 14, padding: "14px 12px"
                                }}>
                                    <p style={{ fontSize: 18, margin: 0 }}>{k.icon}</p>
                                    <p style={{ fontSize: 18, fontWeight: 900, color: k.color, fontFamily: "monospace", margin: "4px 0 2px" }}>{k.value}</p>
                                    <p style={{ fontSize: 9, color: "#334155", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{k.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Deal Meta */}
                        <Section title="Detalles del Deal" icon={<Clock style={{ width: 13, height: 13, color: "#0d9488" }} />}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {[
                                    { icon: <Calendar style={{ width: 13, height: 13 }} />, label: "Cierre esperado", value: deal.expectedClose ? format(new Date(deal.expectedClose), "d MMM yyyy", { locale: es }) : "—" },
                                    { icon: <Clock style={{ width: 13, height: 13 }} />, label: "Última actividad", value: formatDistanceToNow(new Date(deal.lastActivity ?? deal.updatedAt), { addSuffix: true, locale: es }) },
                                    { icon: <Clock style={{ width: 13, height: 13 }} />, label: "Creado", value: format(new Date(deal.createdAt), "d MMM yyyy", { locale: es }) },
                                    { icon: <Tag style={{ width: 13, height: 13 }} />, label: "Fuente", value: deal.source ?? "—" },
                                ].map((item) => (
                                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <span style={{ color: "#475569", flexShrink: 0 }}>{item.icon}</span>
                                        <div>
                                            <p style={{ fontSize: 9, color: "#334155", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{item.label}</p>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", margin: 0 }}>{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* F3: Assign Salesperson */}
                        <Section title="Asignar Vendedor" icon={<User style={{ width: 13, height: 13, color: "#2dd4bf" }} />} accentColor="#0d9488">
                            <DealAssignSelect
                                dealId={deal.id}
                                users={companyUsers as any}
                                currentAssigneeId={deal.assignedTo}
                            />
                        </Section>

                        {/* Quick Stats */}
                        <div style={{
                            background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.6)",
                            borderRadius: 14, padding: "14px 16px"
                        }}>
                            <p style={{ fontFamily: "monospace", fontSize: 8, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Estado del Embudo</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {[
                                    { label: "Propuestas", count: proposals.length, color: "#f59e0b" },
                                    { label: "Facturas", count: invoices.length, color: "#8b5cf6" },
                                    { label: "Cambios de Etapa", count: stageHistory.length, color: "#0ea5e9" },
                                    { label: "Actividades", count: (deal.activities as any[])?.length ?? 0, color: "#2dd4bf" },
                                ].map(s => (
                                    <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 10, color: "#475569", fontFamily: "monospace" }}>{s.label}</span>
                                        <span style={{ fontSize: 14, fontWeight: 900, color: s.color, fontFamily: "monospace" }}>{s.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Floating Action */}
            <WhatsAppFloatingBtn contactPhone={(deal as any).contactPhone} contactName={deal.contactName} dealTitle={deal.title} />
        </div>
    );
}
