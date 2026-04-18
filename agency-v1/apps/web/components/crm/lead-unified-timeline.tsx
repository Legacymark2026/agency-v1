import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, MessageSquare, MousePointerClick, UserPlus, Globe } from "lucide-react";

interface Props { leadId: string; createdAt: Date; formData: any; source: string; }

export async function LeadUnifiedTimeline({ leadId, createdAt, formData, source }: Props) {
    const [conversations, marketingEvents] = await Promise.all([
        prisma.conversation.findMany({ where: { leadId }, orderBy: { updatedAt: "desc" }, take: 10 }),
        prisma.marketingEvent.findMany({ where: { leadId }, orderBy: { createdAt: "desc" }, take: 15 }),
    ]);

    type TimelineItem = {
        id: string; date: Date; type: string; icon: React.ReactNode;
        title: string; description: string | React.ReactNode;
        color: string; border: string; bg: string;
    };

    const timeline: TimelineItem[] = [];

    timeline.push({
        id: "created", date: createdAt, type: "lead_created",
        icon: <UserPlus style={{ width: "13px", height: "13px" }} />,
        title: "Lead capturado",
        description: (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                <p style={{ fontSize: "12px", color: "#94a3b8" }}>Entró mediante <span style={{ fontWeight: 800, color: "#e2e8f0" }}>{source}</span></p>
                {formData && Object.keys(formData).length > 0 && (
                    <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "10px", padding: "10px 12px" }}>
                        <p style={{ fontSize: "9px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace", marginBottom: "6px" }}>Datos del formulario</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
                            {Object.entries(formData as Record<string, unknown>).map(([k, v]) => (
                                <div key={k} style={{ display: "flex", gap: "4px" }}>
                                    <span style={{ fontSize: "11px", color: "#475569" }}>{k}:</span>
                                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={String(v)}>{String(v)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        ),
        color: "#60a5fa", border: "rgba(96,165,250,0.3)", bg: "rgba(96,165,250,0.1)",
    });

    conversations.forEach((conv) => {
        timeline.push({
            id: `conv-${conv.id}`, date: conv.updatedAt, type: "conversation",
            icon: <MessageSquare style={{ width: "13px", height: "13px" }} />,
            title: `Conversación Por ${conv.channel}`,
            description: (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <span style={{ fontSize: "9px", padding: "2px 8px", borderRadius: "99px", fontWeight: 800, fontFamily: "monospace", color: conv.status === "OPEN" ? "#34d399" : "#475569", background: conv.status === "OPEN" ? "rgba(52,211,153,0.12)" : "rgba(71,85,105,0.15)", border: `1px solid ${conv.status === "OPEN" ? "rgba(52,211,153,0.3)" : "rgba(71,85,105,0.3)"}` }}>
                        {conv.status}
                    </span>
                    <Link href={`/dashboard/inbox/${conv.id}`} style={{ fontSize: "11px", fontWeight: 700, color: "#2dd4bf", textDecoration: "underline" }}>
                        Ver hilo completo →
                    </Link>
                </div>
            ),
            color: "#34d399", border: "rgba(52,211,153,0.3)", bg: "rgba(52,211,153,0.1)",
        });
    });

    marketingEvents.forEach((ev) => {
        const isClick = ev.eventType.includes("CLICK");
        timeline.push({
            id: `ev-${ev.id}`, date: ev.createdAt, type: "marketing_event",
            icon: isClick ? <MousePointerClick style={{ width: "13px", height: "13px" }} /> : <Globe style={{ width: "13px", height: "13px" }} />,
            title: ev.eventType.replace(/_/g, " "),
            description: (
                <div style={{ marginTop: "4px" }}>
                    <p style={{ fontSize: "12px", color: "#94a3b8" }}>{ev.eventName || "Actividad en el sitio"}</p>
                    {ev.url && <a href={ev.url} target="_blank" rel="noreferrer" style={{ fontSize: "10px", color: "#38bdf8", display: "block", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.url}</a>}
                </div>
            ),
            color: isClick ? "#fbbf24" : "#a78bfa",
            border: isClick ? "rgba(251,191,36,0.3)" : "rgba(167,139,250,0.3)",
            bg: isClick ? "rgba(251,191,36,0.1)" : "rgba(167,139,250,0.1)",
        });
    });

    timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <div style={{ background: "rgba(11,15,25,0.6)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "18px", padding: "22px" }}>
            <h2 style={{ fontSize: "11px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: "6px", marginBottom: "22px", fontFamily: "monospace" }}>
                <Calendar style={{ width: "14px", height: "14px", color: "#2dd4bf" }} /> Historial Unificado
            </h2>

            <div style={{ position: "relative", borderLeft: "2px solid rgba(30,41,59,0.9)", marginLeft: "16px", display: "flex", flexDirection: "column", gap: "22px", paddingBottom: "8px" }}>
                {timeline.map((item) => (
                    <div key={item.id} style={{ position: "relative", paddingLeft: "28px" }}>
                        <div style={{ position: "absolute", left: "-19px", top: "2px", width: "34px", height: "34px", borderRadius: "50%", border: `1px solid ${item.border}`, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>
                            {item.icon}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "4px", marginBottom: "3px" }}>
                            <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#e2e8f0", textTransform: "capitalize", margin: 0 }}>{item.title}</h3>
                            <span style={{ fontSize: "10px", fontWeight: 600, color: "#334155", whiteSpace: "nowrap", fontFamily: "monospace" }} title={format(item.date, "PPpp", { locale: es })}>
                                {formatDistanceToNow(item.date, { addSuffix: true, locale: es })}
                            </span>
                        </div>
                        <div>{item.description}</div>
                    </div>
                ))}

                {timeline.length === 0 && (
                    <p style={{ fontSize: "12px", color: "#334155", textAlign: "center", padding: "32px 0", fontFamily: "monospace" }}>— Sin actividad registrada —</p>
                )}
            </div>
        </div>
    );
}

export function LeadUnifiedTimelineSkeleton() {
    return (
        <div style={{ background: "rgba(11,15,25,0.6)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "18px", padding: "22px" }}>
            <div style={{ height: "14px", width: "160px", background: "rgba(30,41,59,0.9)", borderRadius: "99px", marginBottom: "22px" }} />
            <div style={{ position: "relative", borderLeft: "2px solid rgba(30,41,59,0.9)", marginLeft: "16px", display: "flex", flexDirection: "column", gap: "22px" }}>
                {[1, 2, 3].map((i) => (
                    <div key={i} style={{ position: "relative", paddingLeft: "28px" }}>
                        <div style={{ position: "absolute", left: "-19px", top: "2px", width: "34px", height: "34px", borderRadius: "50%", background: "rgba(30,41,59,0.9)" }} />
                        <div style={{ height: "13px", width: "140px", background: "rgba(30,41,59,0.9)", borderRadius: "99px", marginBottom: "8px" }} />
                        <div style={{ height: "10px", width: "80px", background: "rgba(30,41,59,0.7)", borderRadius: "99px" }} />
                    </div>
                ))}
            </div>
        </div>
    );
}
