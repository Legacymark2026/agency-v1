import { Plug2, CreditCard, BarChart3, MessageSquare, Terminal } from "lucide-react";
import { GoogleIntegrations } from "@/components/settings/google-integrations";
import { MetaIntegrations } from "@/components/settings/meta-integrations";
import { HotjarIntegrations } from "@/components/settings/hotjar-integrations";
import { AhrefsIntegrations } from "@/components/settings/ahrefs-integrations";
import { PayuIntegrations } from "@/components/settings/payu-integrations";
import { AiModelsIntegrations } from "@/components/settings/ai-models-integrations";
import { VideoAssetsIntegrations } from "@/components/settings/video-assets-integrations";
import { IntegrationsToastHandler } from "@/components/settings/integrations-toast-handler";
import { IntegrationsHealthSummary } from "@/components/settings/integrations-health-summary";
import { NewIntegrationCard } from "@/components/settings/new-integration-card";
import { AudienceSyncButton } from "@/components/settings/audience-sync-button";
import { EmailDomainCard } from "@/components/settings/email-domain-card";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const NEW_INTEGRATIONS = {
    crm_sales: [
        { key: "HUBSPOT", name: "HubSpot CRM", desc: "Sincronización bidireccional de contactos y deals", logo: "🔶" },
        { key: "DYNAMICS365", name: "Microsoft Dynamics 365", desc: "Integración con el ecosistema Microsoft", logo: "🪟" },
        { key: "ZOHO", name: "Zoho CRM", desc: "Sincronización con Zoho CRM y módulos", logo: "🏢" },
        { key: "GMAIL", name: "Gmail", desc: "Envío y lectura automatizada de correos corporativos", logo: "📧" },
        { key: "GOOGLE_MEET", name: "Google Meet", desc: "Creación automática de salas de reunión", logo: "📹" },
        { key: "GOOGLE_DRIVE", name: "Google Drive", desc: "Almacenamiento y gestión de documentos automatizada", logo: "📂" },
    ],
    marketing_growth: [
        { key: "MAILCHIMP", name: "Mailchimp", desc: "Sincroniza listas de email marketing y audiencias", logo: "🐒" },
        { key: "EVENTBRITE", name: "Eventbrite", desc: "Importa asistentes y gestiona eventos automáticamente", logo: "🎟️" },
        { key: "GOTOWEBINAR", name: "GoToWebinar", desc: "Sincroniza registros y datos de asistentes a tus webinars", logo: "🌐" },
        { key: "SURVEYMONKEY", name: "SurveyMonkey", desc: "Envía encuestas automatizadas y recopila feedback", logo: "🐵" },
    ],
    support_billing: [
        { key: "OPENCLAW", name: "OpenClaw Gateway", desc: "Gateway unificado omnicanal: conecta Telegram, Discord, Slack y más de 20 canales.", logo: "🦀" },
        { key: "TWILIO", name: "Twilio SMS/Voice", desc: "Mensajes SMS y llamadas de voz programáticas", logo: "📱" },
        { key: "SLACK", name: "Slack", desc: "Notificaciones y alertas directamente a canales de Slack", logo: "💬" },
        { key: "RESEND", name: "Resend", desc: "Transactional email de alta entregabilidad", logo: "✉️" },
    ],
    ai_automation: [
        { key: "ZAPIER", name: "Zapier", desc: "Conecta con más de 6,000 aplicaciones vía Zapier", logo: "⚡" },
        { key: "AWS_S3", name: "AWS S3", desc: "Almacenamiento de archivos y assets en la nube", logo: "☁️" },
        { key: "JIRA", name: "Jira Software", desc: "Creación y seguimiento de tickets automático", logo: "🔷" },
    ]
};

export default async function IntegrationsPage() {
    const session = await auth();
    let connectedProviders = new Set<string>();

    if (session?.user?.id) {
        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id },
            select: { companyId: true }
        });

        if (companyUser) {
            const configs = await prisma.integrationConfig.findMany({
                where: { companyId: companyUser.companyId }
            });
            // Guardamos en Set los que están habilitados
            configs.forEach(c => connectedProviders.add(c.provider.toLowerCase()));
        }
    }
    return (
        <div className="space-y-10 pb-16 animate-in fade-in duration-500">
            <Suspense fallback={null}><IntegrationsToastHandler /></Suspense>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6 relative">
                {/* Decorative glow */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-violet-500/10 blur-3xl rounded-full pointer-events-none" />
                
                <div className="relative">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs uppercase font-mono tracking-widest mb-3">
                        <Plug2 className="w-3.5 h-3.5" /> App Store — Ecosistema
                    </div>
                    <div className="flex items-center gap-4">
                      <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">Integraciones</h2>
                      <AudienceSyncButton />
                    </div>
                    <p className="text-slate-400 text-sm mt-2 max-w-xl leading-relaxed">
                        Conecta y orquesta todas las herramientas externas de LegacyMark en un solo lugar. Modifica credenciales, revisa el estado de salud y añade nuevos módulos a tu ecosistema operativo.
                    </p>
                </div>
            </div>

            {/* Health Summary - HUD Dashboard Style */}
            <IntegrationsHealthSummary />

            <div className="space-y-12">
                {/* 1. CRM & Sales Operations */}
                <section>
                    <div className="flex items-center gap-3 mb-5 pb-2 border-b border-slate-800/60">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <BarChart3 className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white tracking-tight">Operaciones CRM & Ventas</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">GESTIÓN DE CLIENTES Y OPERACIONES DE NEGOCIO</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {NEW_INTEGRATIONS.crm_sales.map(integration => (
                            <NewIntegrationCard key={integration.key} integration={integration} status={{ status: connectedProviders.has(integration.key.toLowerCase()) ? "OK" : "UNCONFIGURED" }} />
                        ))}
                    </div>
                </section>

                {/* 2. Marketing, Analítica & Growth */}
                <section>
                    <div className="flex items-center gap-3 mb-5 pb-2 border-b border-slate-800/60">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <BarChart3 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white tracking-tight">Marketing, Analítica & Growth</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">TRACKING, CAMPAÑAS Y GESTIÓN DE AUDIENCIAS</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Suspense fallback={<div className="h-[400px] animate-pulse bg-slate-800/50 rounded-xl" />}><MetaIntegrations /></Suspense>
                        <Suspense fallback={<div className="h-[400px] animate-pulse bg-slate-800/50 rounded-xl" />}><GoogleIntegrations /></Suspense>
                        <Suspense fallback={<div className="h-[400px] animate-pulse bg-slate-800/50 rounded-xl" />}><HotjarIntegrations /></Suspense>
                        <Suspense fallback={<div className="h-[400px] animate-pulse bg-slate-800/50 rounded-xl" />}><AhrefsIntegrations /></Suspense>
                    </div>
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {NEW_INTEGRATIONS.marketing_growth.map(integration => (
                            <NewIntegrationCard key={integration.key} integration={integration} status={{ status: connectedProviders.has(integration.key.toLowerCase()) ? "OK" : "UNCONFIGURED" }} />
                        ))}
                    </div>
                </section>

                {/* 3. Soporte, Omnicanalidad & Pagos */}
                <section>
                    <div className="flex items-center gap-3 mb-5 pb-2 border-b border-slate-800/60">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                            <MessageSquare className="w-4 h-4 text-teal-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white tracking-tight">Soporte, Omnicanalidad & Pagos</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">COMUNICACIÓN CON CLIENTES Y FACTURACIÓN</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Suspense fallback={<div className="h-[400px] animate-pulse bg-slate-800/50 rounded-xl" />}><PayuIntegrations /></Suspense>
                        <EmailDomainCard />
                        {NEW_INTEGRATIONS.support_billing.map(integration => (
                            <NewIntegrationCard key={integration.key} integration={integration} status={{ status: connectedProviders.has(integration.key.toLowerCase()) ? "OK" : "UNCONFIGURED" }} />
                        ))}
                    </div>
                </section>

                {/* 4. IA & Automatización */}
                <section>
                    <div className="flex items-center gap-3 mb-5 pb-2 border-b border-slate-800/60">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <Terminal className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white tracking-tight">IA, Nube & Automatización</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">LLMS, ALMACENAMIENTO Y ORQUESTACIÓN</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Suspense fallback={<div className="h-[400px] animate-pulse bg-slate-800/50 rounded-xl" />}><AiModelsIntegrations /></Suspense>
                        <Suspense fallback={<div className="h-[400px] animate-pulse bg-slate-800/50 rounded-xl" />}><VideoAssetsIntegrations /></Suspense>
                    </div>
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {NEW_INTEGRATIONS.ai_automation.map(integration => (
                            <NewIntegrationCard key={integration.key} integration={integration} status={{ status: connectedProviders.has(integration.key.toLowerCase()) ? "OK" : "UNCONFIGURED" }} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
