"use client";
import React, { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { Copy, Check, Book, Key, Link as LinkIcon, ShieldAlert, Webhook, ArrowRight, Zap, MessageSquare, BarChart2, Globe } from "lucide-react";
import { motion } from "framer-motion";

const CodeBlock = ({ code, language }: { code: string; language: string }) => {
    const [copied, setCopied] = useState(false);
    return (
        <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 my-4 shadow-xl">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
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
        GET:    "bg-blue-500/20 text-blue-400",
        POST:   "bg-teal-500/20 text-teal-400",
        PUT:    "bg-amber-500/20 text-amber-400",
        PATCH:  "bg-violet-500/20 text-violet-400",
        DELETE: "bg-rose-500/20 text-rose-400",
    };
    return <span className={`px-2 py-0.5 text-xs font-bold rounded font-mono ${colors[method] ?? "bg-slate-700 text-slate-300"}`}>{method}</span>;
};

const Endpoint = ({ method, path, desc, scope }: { method: string; path: string; desc: string; scope: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-slate-800/50 last:border-0">
        <div className="flex items-center gap-2 shrink-0">
            <Badge method={method} />
            <code className="text-sm font-mono text-slate-300">{path}</code>
        </div>
        <span className="text-xs text-slate-500 sm:ml-2">{desc}</span>
        <span className="ml-auto text-xs font-mono text-violet-400 shrink-0">{scope}</span>
    </div>
);

const ParamRow = ({ name, type, required, desc }: { name: string; type: string; required?: boolean; desc: string }) => (
    <tr>
        <td className="px-4 py-3 font-mono text-xs text-violet-300">{name}{required && <span className="text-red-400">*</span>}</td>
        <td className="px-4 py-3 text-xs text-slate-400">{type}</td>
        <td className="px-4 py-3 text-xs text-slate-400">{desc}</td>
    </tr>
);

export default function ApiDocsPage() {
    const [activeSection, setActiveSection] = useState("intro");

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
        { id: "leads",           label: "Leads",            icon: Globe },
        { id: "contacts",        label: "Contactos",        icon: Globe },
        { id: "deals",           label: "Deals",            icon: BarChart2 },
        { id: "conversations",   label: "Conversaciones",   icon: MessageSquare },
        { id: "campaigns",       label: "Campañas",         icon: BarChart2 },
        { id: "webhooks-api",    label: "Webhooks API",     icon: Webhook },
        { id: "errores",         label: "Errores",          icon: ShieldAlert },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
                <div className="flex items-center h-16 px-6 max-w-7xl mx-auto">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center font-bold text-slate-950 text-sm">LM</div>
                        <span className="font-bold text-lg text-white">LegacyMark Developers</span>
                    </Link>
                    <div className="ml-auto flex items-center gap-4">
                        <Link href="/dashboard/settings/developer" className="text-sm text-slate-400 hover:text-white transition-colors">Developer Console</Link>
                        <Link href="/dashboard" className="px-4 py-2 text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-full transition-colors">Dashboard</Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto flex">
                {/* Sidebar */}
                <aside className="w-56 shrink-0 hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-slate-800 py-8 px-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">v1 Reference</p>
                    {nav.map(({ id, label, icon: Icon }) => {
                        const active = activeSection === id;
                        return (
                            <button key={id} onClick={() => scrollTo(id)} className={`w-full flex items-center gap-2 px-2 py-2 text-sm rounded-lg transition-colors mb-0.5 ${active ? "bg-teal-500/10 text-teal-400" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}>
                                <Icon className={`w-3.5 h-3.5 ${active ? "text-teal-400" : "text-slate-600"}`} />
                                {label}
                            </button>
                        );
                    })}
                </aside>

                <main className="flex-1 py-10 px-6 lg:px-12 max-w-3xl pb-32 space-y-20">

                    {/* Intro */}
                    <section id="intro" className="scroll-mt-28">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-mono mb-6">API v1.0.0 · REST · JSON</span>
                            <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">Documentación de la API</h1>
                            <p className="text-lg text-slate-400 mb-8">API REST pública para integrar CRM, Inbox, Campañas y Webhooks de LegacyMark en tus aplicaciones externas.</p>
                            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                                <p className="text-xs text-slate-500 mb-1 font-mono">BASE URL</p>
                                <code className="text-sm font-mono text-teal-400">https://legacymarksas.com/api/v1</code>
                            </div>
                        </motion.div>
                    </section>

                    {/* Auth */}
                    <section id="autenticacion" className="scroll-mt-28 border-t border-slate-800/50 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-violet-400" /> Autenticación</h2>
                        <p className="text-slate-400 mb-4">Usa el header <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded">Authorization: Bearer &lt;key&gt;</code> en todas las peticiones. Genera claves desde tu <Link href="/dashboard/settings/developer" className="text-teal-400 underline">Developer Console</Link>.</p>
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-6">
                            <p className="text-sm text-amber-400 font-semibold mb-1">⚠ Seguridad</p>
                            <p className="text-xs text-amber-500/80">Nunca expongas claves <code>lm_live_...</code> en código frontend o repositorios públicos. Úsalas solo en servidores.</p>
                        </div>
                        <CodeBlock language="cURL" code={`curl https://legacymarksas.com/api/v1/me \\
  -H "Authorization: Bearer lm_live_YOUR_KEY"`} />
                        <p className="text-sm text-slate-400 mt-4 mb-2">Verifica tus scopes y plan con <code className="text-xs bg-slate-800 px-1 rounded">GET /v1/me</code>:</p>
                        <CodeBlock language="JSON Response" code={`{
  "success": true,
  "data": {
    "key": { "prefix": "lm_live_ab", "scopes": ["leads:read","leads:write"], "isActive": true },
    "company": { "name": "Mi Agencia", "plan": "pro" },
    "rateLimit": { "requestsPerHour": 10000 }
  }
}`} />
                    </section>

                    {/* Rate Limit */}
                    <section id="rate-limit" className="scroll-mt-28 border-t border-slate-800/50 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" /> Rate Limiting</h2>
                        <p className="text-slate-400 mb-4">Los límites se aplican por API Key y ventana de 1 hora. Los headers de respuesta siempre incluyen el estado actual.</p>
                        <div className="overflow-x-auto rounded-xl border border-slate-800 mb-4">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800"><tr><th className="px-4 py-3 text-left">Plan</th><th className="px-4 py-3 text-left">Req / hora</th></tr></thead>
                                <tbody className="divide-y divide-slate-800/50 bg-slate-950 text-slate-300">
                                    <tr><td className="px-4 py-3">free</td><td className="px-4 py-3 font-mono text-slate-400">100</td></tr>
                                    <tr><td className="px-4 py-3">starter</td><td className="px-4 py-3 font-mono text-teal-400">1,000</td></tr>
                                    <tr><td className="px-4 py-3">growth</td><td className="px-4 py-3 font-mono text-teal-400">5,000</td></tr>
                                    <tr><td className="px-4 py-3">pro</td><td className="px-4 py-3 font-mono text-teal-400">10,000</td></tr>
                                    <tr><td className="px-4 py-3">enterprise</td><td className="px-4 py-3 font-mono text-emerald-400">100,000</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">Headers: X-RateLimit-Limit · X-RateLimit-Remaining · X-RateLimit-Reset</p>
                    </section>

                    {/* Leads */}
                    <section id="leads" className="scroll-mt-28 border-t border-slate-800/50 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><LinkIcon className="w-5 h-5 text-blue-400" /> Leads</h2>
                        <p className="text-slate-400 mb-5">Crea y gestiona leads en el CRM con scoring automático y atribución multi-plataforma.</p>
                        <div className="bg-slate-900 rounded-xl border border-slate-800 px-4 mb-6">
                            <Endpoint method="GET"    path="/v1/leads"     desc="Listar leads (paginado, filtrable)"       scope="leads:read" />
                            <Endpoint method="POST"   path="/v1/leads"     desc="Crear un lead con scoring automático"     scope="leads:write" />
                            <Endpoint method="GET"    path="/v1/leads/:id" desc="Obtener lead por ID"                     scope="leads:read" />
                            <Endpoint method="PUT"    path="/v1/leads/:id" desc="Actualizar datos del lead"               scope="leads:write" />
                            <Endpoint method="DELETE" path="/v1/leads/:id" desc="Eliminar lead"                           scope="leads:delete" />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">POST /v1/leads — Body</h4>
                        <div className="overflow-x-auto rounded-xl border border-slate-800 mb-4">
                            <table className="w-full text-sm"><thead className="bg-slate-900 text-slate-400 border-b border-slate-800"><tr><th className="px-4 py-3 text-left">Campo</th><th className="px-4 py-3 text-left">Tipo</th><th className="px-4 py-3 text-left">Descripción</th></tr></thead>
                                <tbody className="divide-y divide-slate-800/50 bg-slate-950">
                                    <ParamRow name="email" type="string" required desc="Email del lead" />
                                    <ParamRow name="name" type="string" desc="Nombre completo" />
                                    <ParamRow name="phone" type="string" desc="Teléfono con código país (+57...)" />
                                    <ParamRow name="utm_source" type="string" desc="Fuente UTM (auto-detectada si no se pasa)" />
                                    <ParamRow name="utm_campaign" type="string" desc="Campaña UTM para atribución" />
                                    <ParamRow name="gclid" type="string" desc="Google Click ID para conversiones" />
                                    <ParamRow name="fbclid" type="string" desc="Facebook Click ID para CAPI" />
                                    <ParamRow name="tags" type="string[]" desc="Etiquetas del lead" />
                                </tbody>
                            </table>
                        </div>
                        <CodeBlock language="JavaScript" code={`const res = await fetch('https://legacymarksas.com/api/v1/leads', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer lm_live_...', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'carlos@example.com', name: 'Carlos Dev',
    phone: '+573001234567', utm_source: 'shopify', tags: ['vip']
  })
});
// { success: true, data: { id, score: 75, source: 'Shopify' } }`} />
                    </section>

                    {/* Contacts */}
                    <section id="contacts" className="scroll-mt-28 border-t border-slate-800/50 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-2">Contactos CRM</h2>
                        <p className="text-slate-400 mb-5">Gestión de contactos y deals del pipeline de ventas.</p>
                        <div className="bg-slate-900 rounded-xl border border-slate-800 px-4 mb-4">
                            <Endpoint method="GET"    path="/v1/contacts"     desc="Listar contactos"    scope="contacts:read" />
                            <Endpoint method="POST"   path="/v1/contacts"     desc="Crear contacto"     scope="contacts:write" />
                            <Endpoint method="GET"    path="/v1/contacts/:id" desc="Obtener contacto"   scope="contacts:read" />
                            <Endpoint method="PUT"    path="/v1/contacts/:id" desc="Actualizar"         scope="contacts:write" />
                            <Endpoint method="DELETE" path="/v1/contacts/:id" desc="Eliminar"           scope="contacts:write" />
                        </div>
                    </section>

                    {/* Deals */}
                    <section id="deals" className="scroll-mt-28 border-t border-slate-800/50 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-2">Deals / Pipeline</h2>
                        <p className="text-slate-400 mb-5">Mueve negocios entre etapas del pipeline de ventas.</p>
                        <div className="bg-slate-900 rounded-xl border border-slate-800 px-4 mb-4">
                            <Endpoint method="GET"    path="/v1/deals"            desc="Listar deals (filtrable por etapa)" scope="deals:read" />
                            <Endpoint method="POST"   path="/v1/deals"            desc="Crear deal"                        scope="deals:write" />
                            <Endpoint method="GET"    path="/v1/deals/:id"        desc="Obtener deal"                      scope="deals:read" />
                            <Endpoint method="PUT"    path="/v1/deals/:id"        desc="Actualizar deal"                   scope="deals:write" />
                            <Endpoint method="PATCH"  path="/v1/deals/:id/stage"  desc="Mover a nueva etapa del pipeline"  scope="deals:write" />
                            <Endpoint method="DELETE" path="/v1/deals/:id"        desc="Eliminar deal"                     scope="deals:write" />
                        </div>
                        <p className="text-xs text-slate-500 mb-2">Etapas válidas: <code className="text-slate-400">NEW · CONTACTED · QUALIFIED · PROPOSAL · NEGOTIATION · WON · LOST</code></p>
                        <CodeBlock language="cURL — Mover etapa" code={`curl -X PATCH https://legacymarksas.com/api/v1/deals/DEAL_ID/stage \\
  -H "Authorization: Bearer lm_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "stage": "WON" }'`} />
                    </section>

                    {/* Conversations */}
                    <section id="conversations" className="scroll-mt-28 border-t border-slate-800/50 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-emerald-400" /> Conversaciones</h2>
                        <p className="text-slate-400 mb-5">Accede al inbox omnicanal y envía mensajes a conversaciones existentes.</p>
                        <div className="bg-slate-900 rounded-xl border border-slate-800 px-4 mb-4">
                            <Endpoint method="GET"  path="/v1/conversations"              desc="Listar conversaciones"       scope="inbox:read" />
                            <Endpoint method="POST" path="/v1/conversations"              desc="Abrir nueva conversación"    scope="inbox:write" />
                            <Endpoint method="GET"  path="/v1/conversations/:id/messages" desc="Listar mensajes"             scope="inbox:read" />
                            <Endpoint method="POST" path="/v1/conversations/:id/messages" desc="Enviar mensaje outbound"     scope="inbox:write" />
                        </div>
                    </section>

                    {/* Campaigns */}
                    <section id="campaigns" className="scroll-mt-28 border-t border-slate-800/50 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-pink-400" /> Campañas</h2>
                        <p className="text-slate-400 mb-5">Crea y consulta campañas de marketing para atribución de leads.</p>
                        <div className="bg-slate-900 rounded-xl border border-slate-800 px-4 mb-4">
                            <Endpoint method="GET"  path="/v1/campaigns" desc="Listar campañas con métricas" scope="campaigns:read" />
                            <Endpoint method="POST" path="/v1/campaigns" desc="Crear campaña"               scope="campaigns:write" />
                        </div>
                        <CodeBlock language="POST /v1/campaigns" code={`{
  "name": "Black Friday 2025",
  "code": "BF25",
  "platform": "META",
  "budget": 5000,
  "startDate": "2025-11-28"
}`} />
                    </section>

                    {/* Webhooks API */}
                    <section id="webhooks-api" className="scroll-mt-28 border-t border-slate-800/50 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><Webhook className="w-5 h-5 text-teal-400" /> Webhooks via API</h2>
                        <p className="text-slate-400 mb-5">Registra y gestiona webhooks programáticamente con tu API Key.</p>
                        <div className="bg-slate-900 rounded-xl border border-slate-800 px-4 mb-6">
                            <Endpoint method="GET"    path="/v1/webhooks"     desc="Listar webhooks registrados"  scope="webhooks:manage" />
                            <Endpoint method="POST"   path="/v1/webhooks"     desc="Registrar nuevo webhook"      scope="webhooks:manage" />
                            <Endpoint method="GET"    path="/v1/webhooks/:id" desc="Detalles + historial logs"    scope="webhooks:manage" />
                            <Endpoint method="PUT"    path="/v1/webhooks/:id" desc="Actualizar URL o eventos"     scope="webhooks:manage" />
                            <Endpoint method="DELETE" path="/v1/webhooks/:id" desc="Eliminar webhook"             scope="webhooks:manage" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Eventos disponibles</h3>
                        <div className="grid grid-cols-2 gap-2 mb-6">
                            {["lead.created","lead.updated","lead.deleted","deal.won","deal.lost","deal.stage_changed","contact.created","conversation.started","message.received","campaign.created","payment.received","automation.triggered"].map(e => (
                                <div key={e} className="flex items-center gap-2 text-xs text-slate-400"><ArrowRight className="w-3 h-3 text-teal-500 shrink-0" /><code className="text-slate-300">{e}</code></div>
                            ))}
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Verificación de Firma HMAC</h3>
                        <p className="text-sm text-slate-400 mb-3">Cada entrega incluye el header <code className="text-xs bg-slate-800 px-1 rounded">X-LegacyMark-Signature</code> con HMAC-SHA256 firmado con tu Webhook Secret.</p>
                        <CodeBlock language="Node.js" code={`const crypto = require('crypto');

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-legacymark-signature'];
  const expected = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(req.body).digest('hex');

  if (sig !== expected) return res.status(401).json({ error: 'Invalid signature' });

  const event = JSON.parse(req.body);
  console.log('Event:', event.type, event.data);
  res.status(200).send('ok');
});`} />
                    </section>

                    {/* Errores */}
                    <section id="errores" className="scroll-mt-28 border-t border-slate-800/50 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-rose-400" /> Códigos de Error</h2>
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400"><tr><th className="px-4 py-3 text-left">HTTP</th><th className="px-4 py-3 text-left">Significado</th></tr></thead>
                                <tbody className="divide-y divide-slate-800/50 bg-slate-950 text-slate-300">
                                    <tr><td className="px-4 py-3 font-mono text-emerald-400">200/201</td><td className="px-4 py-3">Éxito · Recurso creado</td></tr>
                                    <tr><td className="px-4 py-3 font-mono text-emerald-400">204</td><td className="px-4 py-3">No Content — Delete exitoso</td></tr>
                                    <tr><td className="px-4 py-3 font-mono text-rose-400">400</td><td className="px-4 py-3">Bad Request — parámetro faltante o inválido</td></tr>
                                    <tr><td className="px-4 py-3 font-mono text-rose-400">401</td><td className="px-4 py-3">Unauthorized — API Key inválida, expirada o revocada</td></tr>
                                    <tr><td className="px-4 py-3 font-mono text-rose-400">403</td><td className="px-4 py-3">Forbidden — scope requerido ausente en la key</td></tr>
                                    <tr><td className="px-4 py-3 font-mono text-rose-400">404</td><td className="px-4 py-3">Not Found — recurso no existe en tu cuenta</td></tr>
                                    <tr><td className="px-4 py-3 font-mono text-rose-400">409</td><td className="px-4 py-3">Conflict — recurso duplicado (ej. email ya existe)</td></tr>
                                    <tr><td className="px-4 py-3 font-mono text-amber-400">429</td><td className="px-4 py-3">Too Many Requests — Rate Limit excedido</td></tr>
                                    <tr><td className="px-4 py-3 font-mono text-rose-400">500</td><td className="px-4 py-3">Internal Server Error — contacta soporte</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <CodeBlock language="Error Response Format" code={`{
  "success": false,
  "error": "This API key does not have the required scope: \\"leads:write\\". Current scopes: [leads:read]"
}`} />
                    </section>
                </main>
            </div>
        </div>
    );
}
