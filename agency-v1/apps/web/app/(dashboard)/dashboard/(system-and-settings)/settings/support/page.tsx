import { Metadata } from "next";
import Link from "next/link";
import { 
    MessageSquare, Mail, Sliders, Settings, ArrowRight, ShieldCheck, 
    Bot, Users, Zap, Clock, Shield, Bell
} from "lucide-react";

export const metadata: Metadata = {
    title: "Configuración de Soporte & Comunicaciones | LegacyMark",
    description: "Macros, respuestas automáticas, horarios de atención y asignación de tickets.",
};

export default function SupportSettingsPage() {
    const settingsCards = [
        {
            title: "Macros y Atajos de Respuesta Rápida",
            desc: "Crea plantillas con variables dinámicas para respuestas instantáneas con 1 clic en el Inbox.",
            href: "/dashboard/settings/inbox/macros",
            icon: Sliders,
            badge: "Productividad",
        },
        {
            title: "Canales de Mensajería & Conectores",
            desc: "Conexión oficial de WhatsApp Business Cloud API, Instagram DM y Meta Messenger.",
            href: "/dashboard/admin/marketing/settings",
            icon: MessageSquare,
            badge: "Omnicanal",
        },
        {
            title: "Agentes Cognitivos de Atención 24/7",
            desc: "Configura qué bots de IA atienden primer contacto, derivación o resolución autónoma.",
            href: "/dashboard/settings/agents",
            icon: Bot,
            badge: "Inteligencia Artificial",
        },
        {
            title: "Equipos de Agentes & Enrutamiento",
            desc: "Define colas de atención, asignación round-robin a asesores humanos y priorización VIP.",
            href: "/dashboard/settings/agents/teams",
            icon: Users,
            badge: "Swarms",
        },
        {
            title: "Reglas de Escalabilidad y Alertas SLA",
            desc: "Alertas cuando un ticket supera tiempos máximos de respuesta o satisfacción del cliente.",
            href: "/dashboard/security/sla",
            icon: Clock,
            badge: "Calidad",
        },
        {
            title: "Notificaciones y Avisos de Soporte",
            desc: "Preferencias de alertas sonoras, notificaciones push al navegador y correos de guardia.",
            href: "/dashboard/settings/notifications",
            icon: Bell,
            badge: "Alertas",
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-12 max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                        <span>Área de Soporte</span>
                        <span className="text-slate-700">/</span>
                        <span className="text-violet-400 font-bold">Configuración de Canales</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Settings className="w-7 h-7 text-violet-400" />
                        Configuración de Soporte & Comunicaciones
                    </h1>
                    <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                        Ajusta macros predeterminadas, conexión con canales de mensajería en tiempo real, reglas de atención por IA y colas de asignación.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        <ShieldCheck className="w-3.5 h-3.5" /> Canales Activos
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {settingsCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.href}
                            href={card.href}
                            className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-violet-500/40 hover:bg-slate-900/90 transition-all duration-200 shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                        {card.badge}
                                    </span>
                                </div>
                                <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                                    {card.title}
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {card.desc}
                                </p>
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-violet-400 group-hover:text-violet-300">
                                <span>Administrar regla</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
