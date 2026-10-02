import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ConvertToDealDialog } from "@/components/crm/convert-to-deal-dialog";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, MapPin, Tag, Calendar, Globe } from "lucide-react";
import { auth } from "@/lib/auth";
import { Permission, ROLE_PERMISSIONS, UserRole } from "@/types/auth";

import { LeadProfileHeader } from "@/components/crm/lead-profile-header";
import { LeadStatusSelector } from "@/components/crm/lead-status-selector";
import { LeadTagsEditor } from "@/components/crm/lead-tags-editor";
import { LeadUnifiedTimeline, LeadUnifiedTimelineSkeleton } from "@/components/crm/lead-unified-timeline";
import { LeadStickyActions } from "@/components/crm/lead-sticky-actions";
import { LeadDeleteButton } from "@/components/crm/lead-delete-button";
import { LeadEventsWidget } from "@/components/crm/lead-events-widget";
import { getEventsForLead } from "@/actions/events/event-actions";

const SOURCE_ICONS: Record<string, string> = {
    GOOGLE: "🔍", FACEBOOK: "📘", INSTAGRAM: "📷", LINKEDIN: "💼",
    REFERRAL: "🤝", DIRECT: "🌐", EMAIL: "✉️", TIKTOK: "🎵", ORGANIC: "🌱",
};

interface PageProps { params: Promise<{ id: string }> }

export default async function LeadDetailPage(props: PageProps) {
    const params = await props.params;

    // Direct Prisma query for core Lead + Company
    let lead;
    let company;
    let eventsRes;

    try {
        [lead, company, eventsRes] = await Promise.all([
            prisma.lead.findUnique({
                where: { id: params.id },
                include: {
                    campaign: { select: { id: true, name: true, platform: true, code: true } },
                },
            }),
            prisma.company.findFirst(),
            getEventsForLead(params.id)
        ]);
    } catch (err) {
        console.error("[LeadDetailPage] Core query failed:", err);
        return notFound();
    }

    if (!lead) return notFound();

    const session = await auth();
    const role = session?.user?.role as UserRole;
    const canManageLeads = Boolean(session?.user?.permissions?.includes(Permission.MANAGE_LEADS) || (role && ROLE_PERMISSIONS[role]?.includes(Permission.MANAGE_LEADS)));

    return (
        <div className="min-h-screen relative" style={{ background: "transparent" }}>
            {/* Sticky Actions */}
            <LeadStickyActions
                leadName={lead.name || "Sin nombre"}
                leadEmail={lead.email}
                leadPhone={lead.phone}
                leadId={lead.id}
            >
                <div className="scale-90 origin-right">
                    <LeadStatusSelector leadId={lead.id} initialStatus={lead.status} isMobile={true} canManageLeads={canManageLeads} />
                </div>
            </LeadStickyActions>

            {/* Top Breadcrumbs */}
            <div style={{ background: "rgba(11,15,25,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(30,41,59,0.8)", padding: "12px 24px", position: "sticky", top: 0, zIndex: 30 }}>
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Link href="/dashboard/admin/crm/leads" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(30,41,59,0.8)", border: "1px solid rgba(30,41,59,0.9)", color: "#475569" }}>
                            <ArrowLeft style={{ width: "14px", height: "14px" }} />
                        </Link>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#94a3b8", fontFamily: "monospace" }}>Detalles del plomo</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {canManageLeads && <LeadDeleteButton leadId={lead.id} />}
                        <ConvertAction lead={lead} company={company} canManageLeads={canManageLeads} />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── LEFT: Main Info & Timeline ── */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Glassmorphism Profile Header */}
                    <LeadProfileHeader lead={lead} canManageLeads={canManageLeads}>
                        <LeadStatusSelector leadId={lead.id} initialStatus={lead.status} canManageLeads={canManageLeads} />
                        <div className="mt-1">
                            <LeadTagsEditor leadId={lead.id} initialTags={lead.tags} />
                        </div>
                    </LeadProfileHeader>

                    {/* Unified Timeline with Suspense */}
                    <Suspense fallback={<LeadUnifiedTimelineSkeleton />}>
                        <LeadUnifiedTimeline
                            leadId={lead.id}
                            createdAt={lead.createdAt}
                            formData={lead.formData}
                            source={lead.source}
                        />
                    </Suspense>
                </div>

                {/* ── RIGHT: Sidebar Metadata ── */}
                <div className="space-y-6">
                    {/* UTM Attribution */}
                    {(lead.utmSource || lead.utmCampaign || lead.utmMedium || lead.source) && (
                        <div style={{ background: "rgba(11,15,25,0.6)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "18px", padding: "22px" }}>
                            <h2 style={{ fontSize: "11px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", fontFamily: "monospace" }}>
                                <Globe style={{ width: "14px", height: "14px", color: "#2dd4bf" }} /> Atribución
                            </h2>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                {[
                                    { label: "Fuente", value: lead.source, icon: SOURCE_ICONS[lead.source] ?? "🌐" },
                                    { label: "UTM Source", value: lead.utmSource },
                                    { label: "UTM Medium", value: lead.utmMedium },
                                    { label: "UTM Campaign", value: lead.utmCampaign },
                                    { label: "UTM Term", value: lead.utmTerm },
                                    { label: "Landing Page", value: lead.landingPage },
                                ].filter((i) => i.value).map((item) => (
                                    <div key={item.label} style={{ padding: "10px 12px", background: "rgba(15,23,42,0.7)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "10px" }}>
                                        <p style={{ fontSize: "9px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace", marginBottom: "3px" }}>{item.label}</p>
                                        <p style={{ fontSize: "13px", fontWeight: 800, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.value as string}>
                                            {item.icon && <span style={{ marginRight: "4px" }}>{item.icon}</span>}{item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {(lead as any).campaign && (
                                <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: "12px" }}>
                                    <span style={{ fontSize: "22px" }}>📈</span>
                                    <div>
                                        <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", color: "#a78bfa", letterSpacing: "0.1em", fontFamily: "monospace" }}>Campaña Vinculada</p>
                                        <p style={{ fontSize: "13px", fontWeight: 800, color: "#e2e8f0" }}>{(lead as any).campaign.name} <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#475569" }}>({(lead as any).campaign.platform})</span></p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Metadata */}
                    <div style={{ background: "rgba(11,15,25,0.6)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "18px", padding: "22px", display: "flex", flexDirection: "column", gap: "14px" }}>
                        <h3 style={{ fontSize: "11px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0, fontFamily: "monospace" }}>Detalles Internos</h3>
                        {[
                            { icon: <Calendar style={{ width: "14px", height: "14px" }} />, label: "Creado", value: format(new Date(lead.createdAt), "d MMM yyyy · HH:mm", { locale: es }) },
                            { icon: <Calendar style={{ width: "14px", height: "14px" }} />, label: "Actualizado", value: formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true, locale: es }) },
                            { icon: <MapPin style={{ width: "14px", height: "14px" }} />, label: "País", value: lead.country || "Desconocido" },
                            { icon: <MapPin style={{ width: "14px", height: "14px" }} />, label: "Ciudad", value: lead.city || "Desconocida" },
                        ].map((item) => (
                            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2dd4bf", flexShrink: 0 }}>
                                    {item.icon}
                                </div>
                                <div>
                                    <p style={{ fontSize: "9px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace", margin: 0 }}>{item.label}</p>
                                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", margin: 0 }}>{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Events Integration */}
                    <LeadEventsWidget leadId={lead.id} initialEvents={eventsRes?.events || []} />
                </div>
            </div>
        </div>
    );
}

// Small helper for the Convert To Deal action
function ConvertAction({ lead, company, canManageLeads }: { lead: any; company: any; canManageLeads: boolean }) {
    if (!company || lead.status === "CONVERTED" || !canManageLeads) return null;

    return (
        <ConvertToDealDialog
            leadId={lead.id}
            leadName={lead.name || "Lead"}
            leadEmail={lead.email}
            companyId={company.id}
        />
    );
}
