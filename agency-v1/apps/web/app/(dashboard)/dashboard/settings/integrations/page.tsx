import { Plug2, CreditCard, BarChart3, MessageSquare, Terminal } from "lucide-react";
import { GoogleIntegrations } from "@/components/settings/google-integrations";
import { MetaIntegrations } from "@/components/settings/meta-integrations";
import { HotjarIntegrations } from "@/components/settings/hotjar-integrations";
import { AhrefsIntegrations } from "@/components/settings/ahrefs-integrations";
import { PayuIntegrations } from "@/components/settings/payu-integrations";
import { AiModelsIntegrations } from "@/components/settings/ai-models-integrations";
import { IntegrationsToastHandler } from "@/components/settings/integrations-toast-handler";
import { IntegrationsHealthSummary } from "@/components/settings/integrations-health-summary";
import { NewIntegrationCard } from "@/components/settings/new-integration-card";
import { AudienceSyncButton } from "@/components/settings/audience-sync-button";
import { EmailDomainCard } from "@/components/settings/email-domain-card";
import { Suspense } from "react";

const NEW_INTEGRATIONS = {
    marketing: [
        { key: "HUBSPOT", name: "HubSpot CRM", desc: "Sincronización bidireccional de contactos y deals", logo: "🔶", fields: [{ label: "API Key / Access Token", placeholder: "pat-na1-..." }] },
        { key: "MAILCHIMP", name: "Mailchimp", desc: "Sincroniza listas de email marketing y audiencias", logo: "🐒", fields: [{ label: "API Key", placeholder: "xxxxxx-us1" }, { label: "Audience ID", placeholder: "ID de tu lista" }] },
    ],
    communication: [
        { key: "OPENCLAW", name: "OpenClaw Gateway", desc: "Gateway unificado omnicanal: conecta Telegram, Discord, Slack y más de 20 canales en un solo endpoint.", logo: "🦀", fields: [{ label: "Gateway URL", placeholder: "http://localhost:18789" }, { label: "Webhook Secret", placeholder: "Tu clave secreta compartida" }] },
        { key: "TWILIO", name: "Twilio SMS/Voice", desc: "Mensajes SMS y llamadas de voz programáticas", logo: "📱", fields: [{ label: "Account SID", placeholder: "ACxxxxxx" }, { label: "Auth Token", placeholder: "Tu auth token de Twilio" }] },
        { key: "SLACK", name: "Slack", desc: "Notificaciones y alertas directamente a canales de Slack", logo: "💬", fields: [{ label: "Bot Token", placeholder: "xoxb-..." }, { label: "Channel ID", placeholder: "#general" }] },
        { key: "RESEND", name: "Resend", desc: "Transactional email de alta entregabilidad", logo: "✉️", fields: [{ label: "API Key", placeholder: "re_..." }] },
    ],
    development: [
        { key: "ZAPIER", name: "Zapier", desc: "Conecta con más de 6,000 aplicaciones vía Zapier", logo: "⚡", fields: [{ label: "Webhook URL", placeholder: "https://hooks.zapier.com/..." }] },
        { key: "AWS_S3", name: "AWS S3", desc: "Almacenamiento de archivos y assets en la nube", logo: "☁️", fields: [{ label: "Access Key ID", placeholder: "AKIA..." }, { label: "Secret Access Key", placeholder: "Tu secret key" }, { label: "Bucket Name", placeholder: "mi-bucket" }] },
        { key: "ZOHO", name: "Zoho CRM", desc: "Sincronización con Zoho CRM y módulos", logo: "🏢", fields: [{ label: "Client ID", placeholder: "Tu Zoho client ID" }, { label: "Client Secret", placeholder: "Tu Zoho client secret" }] },
        { key: "DYNAMICS365", name: "Microsoft Dynamics 365", desc: "Integración con el ecosistema Microsoft", logo: "🪟", fields: [{ label: "Tenant ID", placeholder: "Tu Azure tenant ID" }, { label: "Client ID", placeholder: "Tu app client ID" }] },
    ]
};

export default function IntegrationsPage() {
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
                {/* 1. Pagos & Finanzas */}
                <section>
                    <div className="flex items-center gap-3 mb-5 pb-2 border-b border-slate-800/60">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <CreditCard className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white tracking-tight">Pagos & E-Commerce</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">PASARELAS DE PAGO Y FACTURACIÓN</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Suspense fallback={<div className="h-[400px] animate-pulse bg-slate-800/50 rounded-xl" />}><PayuIntegrations /></Suspense>
                    </div>
                </section>

                {/* 2. Marketing & Analítica */}
                <section>
                    <div className="flex items-center gap-3 mb-5 pb-2 border-b border-slate-800/60">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <BarChart3 className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white tracking-tight">Marketing, CRM & Analítica</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">TRACKING, CAMPAÑAS Y GESTIÓN DE LEADS</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Configured ones */}
                        <Suspense fallback={<div className="h-[400px] animate-pulse bg-slate-800/50 rounded-xl" />}><MetaIntegrations /></Suspense>
                        <Suspense fallback={<div className="h-[400px] animate-pulse bg-slate-800/50 rounded-xl" />}><GoogleIntegrations /></Suspense>
                        <Suspense fallback={<div className="h-[400px] animate-pulse bg-slate-800/50 rounded-xl" />}><HotjarIntegrations /></Suspense>
                        <Suspense fallback={<div className="h-[400px] animate-pulse bg-slate-800/50 rounded-xl" />}><AhrefsIntegrations /></Suspense>
                    </div>
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Available ones */}
                        {NEW_INTEGRATIONS.marketing.map(integration => (
                            <NewIntegrationCard key={integration.key} integration={integration} />
                        ))}
                    </div>
                </section>

                {/* 3. Comunicación & Soporte */}
                <section>
                    <div className="flex items-center gap-3 mb-5 pb-2 border-b border-slate-800/60">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                            <MessageSquare className="w-4 h-4 text-teal-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white tracking-tight">Canales de Comunicación</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">INBOX, EMAIL TRANSACCIONAL Y SMS</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <EmailDomainCard />
                        {NEW_INTEGRATIONS.communication.map(integration => (
                            <NewIntegrationCard key={integration.key} integration={integration} />
                        ))}
                    </div>
                </section>

                {/* 4. Desarrollo & IA */}
                <section>
                    <div className="flex items-center gap-3 mb-5 pb-2 border-b border-slate-800/60">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <Terminal className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white tracking-tight">Desarrollo, Nube & IA</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">LLMS, ALMACENAMIENTO Y WEBHOOKS</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Configured ones */}
                        <Suspense fallback={<div className="h-[400px] animate-pulse bg-slate-800/50 rounded-xl" />}><AiModelsIntegrations /></Suspense>
                    </div>
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Available ones */}
                        {NEW_INTEGRATIONS.development.map(integration => (
                            <NewIntegrationCard key={integration.key} integration={integration} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
