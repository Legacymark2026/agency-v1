"use client";
import React, { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { Copy, Check, Book, Key, Link as LinkIcon, ShieldAlert, Webhook, ArrowRight, Zap, MessageSquare, BarChart2, Globe, Cpu, ShoppingBag, ShieldCheck, Mail, Sparkles, Sliders } from "lucide-react";
import { motion } from "framer-motion";

const CodeBlock = ({ code, language }: { code: string; language: string }) => {
    const [copied, setCopied] = useState(false);
    return (
        <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 my-4 shadow-xl">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{language}</span>
                <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
            <div className="p-4 overflow-x-auto"><pre className="text-sm font-mono text-slate-300 leading-relaxed"><code>{code}</code></pre></div>
        </div>
    );
};

const Badge = ({ method }: { method: string }) => {
    const colors: Record<string, string> = {
        GET:    "bg-blue-500/20 text-blue-400 border-blue-500/30",
        POST:   "bg-teal-500/20 text-teal-400 border-teal-500/30",
        PUT:    "bg-amber-500/20 text-amber-400 border-amber-500/30",
        PATCH:  "bg-violet-500/20 text-violet-400 border-violet-500/30",
        DELETE: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    };
    return <span className={`px-2 py-0.5 text-xs font-bold rounded border font-mono ${colors[method] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>{method}</span>;
};

const Endpoint = ({ method, path, desc, scope }: { method: string; path: string; desc: string; scope: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-slate-800/50 last:border-0 hover:bg-slate-900/40 px-2 rounded-lg transition-colors">
        <div className="flex items-center gap-2 shrink-0">
            <Badge method={method} />
            <code className="text-sm font-mono text-slate-200">{path}</code>
        </div>
        <span className="text-xs text-slate-400 sm:ml-2">{desc}</span>
        <span className="ml-auto text-[11px] font-mono text-violet-400 bg-violet-950/60 border border-violet-800/40 px-2 py-0.5 rounded shrink-0">{scope}</span>
    </div>
);

const ParamRow = ({ name, type, required, desc }: { name: string; type: string; required?: boolean; desc: string }) => (
    <tr className="hover:bg-slate-900/30 transition-colors">
        <td className="px-4 py-3 font-mono text-xs text-teal-300 font-semibold">{name}{required && <span className="text-rose-400 font-bold ml-0.5">*</span>}</td>
        <td className="px-4 py-3 font-mono text-xs text-slate-400">{type}</td>
        <td className="px-4 py-3 text-xs text-slate-300 leading-relaxed">{desc}</td>
    </tr>
);

export default function ApiDocsPage() {
    const [activeSection, setActiveSection] = useState("intro");
    const [filterQuery, setFilterQuery] = useState("");

    useEffect(() => {
        const handleScroll = () => {
            document.querySelectorAll("section[id]").forEach((s) => {
                const el = s as HTMLElement;
                if (window.scrollY + 150 >= el.offsetTop && window.scrollY + 150 < el.offsetTop + el.clientHeight) {
                    setActiveSection(s.getAttribute("id") || "");
                }
            });
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: "smooth" });
    };

    const nav = [
        { id: "intro",           label: "Introducción",     icon: Book },
        { id: "autenticacion",   label: "Autenticación",    icon: Key },
        { id: "rate-limit",      label: "Rate Limiting",    icon: Zap },
        { id: "tarifario-api",   label: "Tarifario de Consumo", icon: Sparkles },
        { id: "cognitive-engine",label: "Motor Cognitivo IA",icon: Cpu },
        { id: "leads",           label: "Leads CRM",        icon: Globe },
        { id: "contacts",        label: "Contactos",        icon: Globe },
        { id: "deals",           label: "Deals & Pipeline", icon: BarChart2 },
        { id: "conversations",   label: "Conversaciones",   icon: MessageSquare },
        { id: "marketing-ent",   label: "Marketing Enterprise", icon: Mail },
        { id: "pos-dian",        label: "POS & Facturación",icon: ShoppingBag },
        { id: "workflows",       label: "Workflows Engine", icon: Webhook },
        { id: "video-api",       label: "Video Render API", icon: BarChart2 },
        { id: "webhooks-api",    label: "Webhooks API",     icon: Webhook },
        { id: "errores",         label: "Códigos de Error", icon: ShieldAlert },
    ];

    return (
        <div className="min-h-screen bg-[#07090e] text-slate-200 font-sans selection:bg-teal-500/30">
            {/* Header Sticky */}
            <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
                <div className="flex items-center justify-between h-16 px-6 max-w-7xl mx-auto">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center font-black text-slate-950 text-sm shadow-lg shadow-teal-500/20">LM</div>
                        <div>
                            <span className="font-extrabold text-base text-white tracking-tight block">LegacyMark Developers</span>
                            <span className="text-[10px] font-mono text-teal-400">API Documentation v1.0.0</span>
                        </div>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/settings/developer" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">Developer Console</Link>
                        <Link href="/dashboard" className="px-4 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition-all shadow-md shadow-teal-500/20">
                            Ir al Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto flex">
                {/* Sidebar Navigation */}
                <aside className="w-64 shrink-0 hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-slate-800/80 py-8 px-4">
                    <div className="mb-4">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Ref. API v1 Enterprise</p>
                    </div>
                    <nav className="space-y-0.5">
                        {nav.map(({ id, label, icon: Icon }) => {
                            const active = activeSection === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => scrollTo(id)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl transition-all text-left font-medium ${
                                        active
                                            ? "bg-teal-500/10 text-teal-300 font-bold border border-teal-500/30 shadow-[0_0_12px_-4px_rgba(20,184,166,0.3)]"
                                            : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${active ? "text-teal-400" : "text-slate-500"}`} />
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 py-10 px-6 lg:px-12 max-w-4xl pb-32 space-y-20">

                    {/* Intro */}
                    <section id="intro" className="scroll-mt-28">
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-mono font-semibold">
                                    <Sparkles className="w-3.5 h-3.5" /> API REST Enterprise v1.0
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-mono">JSON / HTTPS</span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
                                Documentación Oficial de la API
                            </h1>
                            <p className="text-base text-slate-400 mb-8 leading-relaxed">
                                Integra la suite completa de LegacyMark en tus sistemas: Motor Cognitivo de Agentes IA (ReFRAG), CRM Enterprise, Facturación Electrónica DIAN, POS, Marketing Multicanal y Workflows Asíncronos.
                            </p>

                            <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider mb-1">BASE URL PRINCIPAL (GATEWAY API)</p>
                                    <code className="text-sm font-mono text-teal-400 font-bold">https://legacymarksas.com/api/v1</code>
                                </div>
                                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono rounded-lg">
                                    🟢 Online
                                </div>
                            </div>
                        </motion.div>
                    </section>

                    {/* Autenticación */}
                    <section id="autenticacion" className="scroll-mt-28 border-t border-slate-800/80 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
                            <Key className="w-6 h-6 text-violet-400" /> Autenticación
                        </h2>
                        <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                            Todas las solicitudes a la API deben incluir el encabezado <code className="text-xs font-mono bg-slate-900 border border-slate-800 text-teal-300 px-2 py-0.5 rounded">Authorization: Bearer &lt;tu_api_key&gt;</code>. Genera tus claves seguras desde tu <Link href="/dashboard/settings/developer" className="text-teal-400 underline hover:text-teal-300">Developer Console</Link>.
                        </p>
                        
                        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl mb-6">
                            <p className="text-xs text-amber-300 font-bold mb-1 flex items-center gap-1.5">
                                🔒 Buenas prácticas de seguridad
                            </p>
                            <p className="text-xs text-amber-400/80 leading-relaxed">
                                Las claves de API tienen permisos de producción. Mantén tus credenciales reservadas en variables de entorno de servidor. Nunca expongas tu API Key en código cliente de navegador.
                            </p>
                        </div>

                        <CodeBlock language="cURL" code={`curl https://legacymarksas.com/api/v1/me \\
  -H "Authorization: Bearer lm_live_YOUR_API_KEY"`} />

                        <p className="text-xs text-slate-400 mt-4 mb-2">Verificación de credenciales con <code className="text-xs bg-slate-800 px-1 rounded">GET /api/v1/me</code>:</p>
                        <CodeBlock language="JSON Response" code={`{
  "success": true,
  "data": {
    "key": { "prefix": "lm_live_ab", "scopes": ["agents:read", "leads:write"], "isActive": true },
    "company": { "id": "comp_123", "name": "LegacyMark SAS", "plan": "enterprise" },
    "rateLimit": { "requestsPerHour": 100000 }
  }
}`} />
                    </section>

                    {/* Rate Limit */}
                    <section id="rate-limit" className="scroll-mt-28 border-t border-slate-800/80 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
                            <Zap className="w-6 h-6 text-amber-400" /> Rate Limiting (Límites de Tráfico)
                        </h2>
                        <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                            Los límites se evalúan por API Key en ventanas móviles de 60 segundos con algoritmo Token Bucket.
                        </p>
                        <div className="overflow-x-auto rounded-xl border border-slate-800 mb-4">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold">Plan Suscripción</th>
                                        <th className="px-4 py-3 text-left font-bold">Peticiones por Hora</th>
                                        <th className="px-4 py-3 text-left font-bold">Concurrencia Máxima</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50 bg-slate-950 text-slate-300">
                                    <tr><td className="px-4 py-3">Free</td><td className="px-4 py-3 font-mono text-slate-400">1,000</td><td className="px-4 py-3 font-mono">5 req/s</td></tr>
                                    <tr><td className="px-4 py-3 font-semibold text-teal-400">Starter</td><td className="px-4 py-3 font-mono text-teal-400">10,000</td><td className="px-4 py-3 font-mono">20 req/s</td></tr>
                                    <tr><td className="px-4 py-3 font-semibold text-teal-400">Growth</td><td className="px-4 py-3 font-mono text-teal-400">50,000</td><td className="px-4 py-3 font-mono">50 req/s</td></tr>
                                    <tr><td className="px-4 py-3 font-semibold text-emerald-400">Enterprise</td><td className="px-4 py-3 font-mono text-emerald-400">500,000</td><td className="px-4 py-3 font-mono">200 req/s</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Tarifario API & Consumo */}
                    <section id="tarifario-api" className="scroll-mt-28 border-t border-slate-800/80 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2.5">
                            <Sparkles className="w-6 h-6 text-emerald-400" /> Tarifario de Consumo & Metered Billing
                        </h2>
                        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                            Monetización en tiempo real por uso de microservicios. Puedes consumir saldo de tu **Wallet Prepago** o facturar mensualmente con **Stripe Metered Billing**.
                        </p>

                        <div className="overflow-x-auto rounded-2xl border border-slate-800 mb-6 shadow-xl">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Microservicio</th>
                                        <th className="px-4 py-3 text-left">Recurso / Endpoint</th>
                                        <th className="px-4 py-3 text-left">Unidad de Medida</th>
                                        <th className="px-4 py-3 text-right">Precio por Unidad (USD)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50 bg-slate-950 text-slate-300">
                                    <tr className="hover:bg-slate-900/40">
                                        <td className="px-4 py-3 font-semibold text-teal-400">Motor Cognitivo IA</td>
                                        <td className="px-4 py-3 font-mono text-slate-300">/api/v1/agents/:id/run</td>
                                        <td className="px-4 py-3 text-slate-400">1,000 Tokens LLM</td>
                                        <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-right">$0.0025 USD</td>
                                    </tr>
                                    <tr className="hover:bg-slate-900/40">
                                        <td className="px-4 py-3 font-semibold text-violet-400">Video Engine</td>
                                        <td className="px-4 py-3 font-mono text-slate-300">/api/v1/video/render</td>
                                        <td className="px-4 py-3 text-slate-400">1 Segundo Renderizado</td>
                                        <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-right">$0.0500 USD</td>
                                    </tr>
                                    <tr className="hover:bg-slate-900/40">
                                        <td className="px-4 py-3 font-semibold text-blue-400">Facturación DIAN</td>
                                        <td className="px-4 py-3 font-mono text-slate-300">/api/v1/invoices</td>
                                        <td className="px-4 py-3 text-slate-400">1 Factura Electrónica</td>
                                        <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-right">$0.0800 USD</td>
                                    </tr>
                                    <tr className="hover:bg-slate-900/40">
                                        <td className="px-4 py-3 font-semibold text-amber-400">Marketing Enterprise</td>
                                        <td className="px-4 py-3 font-mono text-slate-300">/api/v1/email-validation/validate</td>
                                        <td className="px-4 py-3 text-slate-400">1 Email Validado</td>
                                        <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-right">$0.0010 USD</td>
                                    </tr>
                                    <tr className="hover:bg-slate-900/40">
                                        <td className="px-4 py-3 font-semibold text-slate-400">Core REST (CRM, POS)</td>
                                        <td className="px-4 py-3 font-mono text-slate-300">/api/v1/leads, /api/v1/pos/*</td>
                                        <td className="px-4 py-3 text-slate-400">1 Petición HTTP</td>
                                        <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-right">$0.0005 USD</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                                <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                                    👛 Saldo Wallet Prepago
                                </h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Cada cuenta recibe <strong className="text-teal-300">$50.00 USD de crédito inicial</strong> al crear su primera API Key. Las peticiones descuentan automáticamente saldo en tiempo real.
                                </p>
                            </div>
                            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                                <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                                    ⚡ Auto-Recarga Configurable
                                </h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Evita interrupciones en tu servicio configurando recargas automáticas (ej. recargar $50 USD cuando el saldo baje de $10 USD).
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Motor Cognitivo IA */}
                    <section id="cognitive-engine" className="scroll-mt-28 border-t border-slate-800/80 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2.5">
                            <Cpu className="w-6 h-6 text-teal-400" /> Motor Cognitivo & Agentes IA (ReFRAG)
                        </h2>
                        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                            Ejecuta agentes de IA conversacionales con RAG recursivo, trazabilidad de razonamiento y Human-in-the-Loop.
                        </p>

                        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 px-4 mb-6">
                            <Endpoint method="POST"  path="/api/v1/agents/:agentId/run"  desc="Ejecutar agente con mensaje y contexto CRM" scope="agents:run" />
                            <Endpoint method="GET"   path="/api/v1/agents/traces"          desc="Listar trazabilidad de razonamiento (Audit Logs)" scope="agents:read" />
                            <Endpoint method="GET"   path="/api/v1/agents/traces/:id font-mono" desc="Obtener detalle completo de un trace" scope="agents:read" />
                            <Endpoint method="POST"  path="/api/v1/agents/:agentId/feedback" desc="Registrar retroalimentación (Thumbs / Stars)" scope="agents:write" />
                            <Endpoint method="GET"   path="/api/v1/agents/governance"      desc="Consultar modos de autonomía y presupuesto" scope="agents:read" />
                            <Endpoint method="PATCH" path="/api/v1/agents/:id/governance"  desc="Actualizar parámetros de gobernanza y temperatura" scope="agents:write" />
                        </div>

                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">POST /api/v1/agents/:agentId/run — Payload</h4>
                        <CodeBlock language="JSON Request" code={`{
  "userMessage": "¿Cuáles son las tarifas del plan Enterprise para facturación DIAN?",
  "conversationId": "conv_9901",
  "leadId": "lead_4402",
  "enableRefrag": true
}`} />

                        <CodeBlock language="JSON Response" code={`{
  "success": true,
  "response": "El plan Enterprise incluye facturación electrónica DIAN ilimitada...",
  "traceId": "trc_8840291",
  "confidenceScore": 0.96,
  "tokensUsed": 342,
  "hitlStatus": "AUTO_APPROVED"
}`} />
                    </section>

                    {/* Leads CRM */}
                    <section id="leads" className="scroll-mt-28 border-t border-slate-800/80 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2.5">
                            <Globe className="w-6 h-6 text-blue-400" /> Leads CRM
                        </h2>
                        <p className="text-sm text-slate-400 mb-5">Creación y gestión de leads con scoring automático y atribución multi-canal.</p>

                        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 px-4 mb-6">
                            <Endpoint method="GET"    path="/api/v1/leads"     desc="Listar leads con filtros y paginación" scope="leads:read" />
                            <Endpoint method="POST"   path="/api/v1/leads"     desc="Crear lead con scoring automático"     scope="leads:write" />
                            <Endpoint method="GET"    path="/api/v1/leads/:id" desc="Obtener lead por ID"                     scope="leads:read" />
                            <Endpoint method="PUT"    path="/api/v1/leads/:id" desc="Actualizar lead"                        scope="leads:write" />
                            <Endpoint method="DELETE" path="/api/v1/leads/:id" desc="Eliminar lead"                        scope="leads:delete" />
                        </div>
                    </section>

                    {/* Contacts */}
                    <section id="contacts" className="scroll-mt-28 border-t border-slate-800/80 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-2">Contactos CRM</h2>
                        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 px-4 mb-4">
                            <Endpoint method="GET"    path="/api/v1/crm/contacts"     desc="Listar contactos CRM" scope="contacts:read" />
                            <Endpoint method="POST"   path="/api/v1/crm/contacts"     desc="Crear contacto"      scope="contacts:write" />
                            <Endpoint method="GET"    path="/api/v1/crm/contacts/:id" desc="Obtener contacto"    scope="contacts:read" />
                            <Endpoint method="PUT"    path="/api/v1/crm/contacts/:id" desc="Actualizar"          scope="contacts:write" />
                        </div>
                    </section>

                    {/* Deals / Pipeline */}
                    <section id="deals" className="scroll-mt-28 border-t border-slate-800/80 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2.5">
                            <BarChart2 className="w-6 h-6 text-purple-400" /> Deals & Pipeline de Ventas
                        </h2>
                        <p className="text-sm text-slate-400 mb-5">Gestión de oportunidades comerciales y movimiento de etapas de venta.</p>

                        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 px-4 mb-4">
                            <Endpoint method="GET"    path="/api/v1/deals"            desc="Listar deals por etapa" scope="deals:read" />
                            <Endpoint method="POST"   path="/api/v1/deals"            desc="Crear oportunidad de venta" scope="deals:write" />
                            <Endpoint method="PATCH"  path="/api/v1/deals/:id/stage"  desc="Mover deal de etapa" scope="deals:write" />
                        </div>

                        <CodeBlock language="cURL — Mover etapa de venta" code={`curl -X PATCH https://legacymarksas.com/api/v1/deals/DEAL_ID/stage \\
  -H "Authorization: Bearer lm_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "stage": "WON" }'`} />
                    </section>

                    {/* Marketing Enterprise */}
                    <section id="marketing-ent" className="scroll-mt-28 border-t border-slate-800/80 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2.5">
                            <Mail className="w-6 h-6 text-pink-400" /> Marketing Enterprise & Reputación
                        </h2>
                        <p className="text-sm text-slate-400 mb-5">Verificación de dominios (SPF, DKIM, DMARC), validación de emails y secuencias drip.</p>

                        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 px-4 mb-6">
                            <Endpoint method="GET"  path="/api/v1/domain-reputation/check?domain=..." desc="Auditar SPF, DKIM, DMARC y DNS blacklists" scope="marketing:read" />
                            <Endpoint method="POST" path="/api/v1/email-validation/validate"      desc="Validar sintaxis, MX y filtro desechables" scope="marketing:read" />
                            <Endpoint method="GET"  path="/api/v1/templates/system"               desc="Obtener plantillas de email HTML responsive" scope="marketing:read" />
                        </div>

                        <CodeBlock language="POST /api/v1/email-validation/validate" code={`{
  "email": "contacto@ejemplo.com"
}
// Output: { success: true, isValidFormat: true, hasMxRecords: true, isDisposable: false, score: 95 }`} />
                    </section>

                    {/* POS & Facturación DIAN */}
                    <section id="pos-dian" className="scroll-mt-28 border-t border-slate-800/80 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2.5">
                            <ShoppingBag className="w-6 h-6 text-emerald-400" /> POS & Facturación Electrónica DIAN
                        </h2>
                        <p className="text-sm text-slate-400 mb-5">Emisión de facturas electrónicas UBL 2.1, notas crédito y catálogo del punto de venta.</p>

                        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 px-4 mb-6">
                            <Endpoint method="GET"  path="/api/v1/pos/products"    desc="Obtener catálogo de productos e inventario POS" scope="pos:read" />
                            <Endpoint method="POST" path="/api/v1/pos/registers"   desc="Apertura y cierre de caja registradora" scope="pos:write" />
                            <Endpoint method="POST" path="/api/v1/invoices"        desc="Emitir Factura Electrónica UBL 2.1 a la DIAN" scope="invoices:write" />
                        </div>
                    </section>

                    {/* Workflows Engine */}
                    <section id="workflows" className="scroll-mt-28 border-t border-slate-800/80 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2.5">
                            <Webhook className="w-6 h-6 text-teal-400" /> Workflows Engine (Automatizaciones)
                        </h2>
                        <p className="text-sm text-slate-400 mb-5">Disparador de flujos asíncronos con soporte de idempotencia.</p>

                        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 px-4 mb-6">
                            <Endpoint method="POST" path="/api/workflows/execute" desc="Disparar workflow asíncrono" scope="x-api-key" />
                        </div>

                        <CodeBlock language="JavaScript" code={`const res = await fetch('https://legacymarksas.com/api/workflows/execute', {
  method: 'POST',
  headers: {
    'x-api-key': 'lm_live_YOUR_KEY',
    'x-idempotency-key': 'unique-uuid-key-12345',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    workflowId: 'wf_prod_sales_01',
    triggerData: { leadEmail: 'cliente@empresa.com' }
  })
});`} />
                    </section>

                    {/* Errores */}
                    <section id="errores" className="scroll-mt-28 border-t border-slate-800/80 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
                            <ShieldAlert className="w-6 h-6 text-rose-400" /> Respuestas y Códigos de Error
                        </h2>
                        <div className="overflow-x-auto rounded-xl border border-slate-800 mb-4">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                                    <tr><th className="px-4 py-3 text-left font-bold">Código HTTP</th><th className="px-4 py-3 text-left font-bold">Descripción</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50 bg-slate-950 text-slate-300">
                                    <tr><td className="px-4 py-3 font-mono text-emerald-400 font-bold">200 / 201</td><td className="px-4 py-3">Petición exitosa · Recurso creado.</td></tr>
                                    <tr><td className="px-4 py-3 font-mono text-rose-400 font-bold">400 Bad Request</td><td className="px-4 py-3">Parámetro obligatorio faltante o formato erróneo.</td></tr>
                                    <tr><td className="px-4 py-3 font-mono text-rose-400 font-bold">401 Unauthorized</td><td className="px-4 py-3">API Key inválida o expirada.</td></tr>
                                    <tr><td className="px-4 py-3 font-mono text-amber-400 font-bold">429 Rate Limit</td><td className="px-4 py-3">Límite de solicitudes superado para el plan actual.</td></tr>
                                    <tr><td className="px-4 py-3 font-mono text-rose-400 font-bold">500 Server Error</td><td className="px-4 py-3">Error interno de servidor de microservicio.</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
