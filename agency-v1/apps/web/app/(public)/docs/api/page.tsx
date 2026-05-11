"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Copy, Check, ChevronRight, Book, Key, Link as LinkIcon, ShieldAlert, Webhook, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

// Helper component for copying text to clipboard
const CodeBlock = ({ code, language }: { code: string; language: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group rounded-xl overflow-hidden bg-slate-950 border border-slate-800 my-4 shadow-xl">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{language}</span>
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
            <div className="p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-slate-300 leading-relaxed">
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
};

// Main Page Component
export default function ApiDocsPage() {
    const [activeSection, setActiveSection] = useState("introduccion");

    // Scroll spy for navigation
    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll("section[id]");
            const scrollPosition = window.scrollY + 150;

            sections.forEach((section) => {
                const sectionTop = (section as HTMLElement).offsetTop;
                const sectionHeight = section.clientHeight;
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    setActiveSection(section.getAttribute("id") || "");
                }
            });
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollTo = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 100,
                behavior: "smooth",
            });
        }
    };

    const navItems = [
        { id: "introduccion", label: "Introducción", icon: Book },
        { id: "autenticacion", label: "Autenticación", icon: Key },
        { id: "endpoints", label: "Endpoints Core", icon: LinkIcon },
        { id: "webhooks", label: "Webhooks y Eventos", icon: Webhook },
        { id: "errores", label: "Códigos de Error", icon: ShieldAlert },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30">
            {/* Top Navbar */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
                <div className="flex items-center h-16 px-6 max-w-7xl mx-auto">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center font-bold text-slate-950">
                            LM
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white">LegacyMark Developers</span>
                    </Link>
                    <div className="ml-auto flex items-center gap-4">
                        <Link href="/dashboard/settings/developer" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            Developer Console
                        </Link>
                        <Link href="/dashboard" className="px-4 py-2 text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-full transition-colors">
                            Ir al Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto flex">
                {/* Left Sidebar */}
                <aside className="w-64 shrink-0 hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-slate-800 py-8 px-4">
                    <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">API Reference</h4>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeSection === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => scrollTo(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        isActive
                                            ? "bg-teal-500/10 text-teal-400"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? "text-teal-400" : "text-slate-500"}`} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 py-10 px-6 lg:px-12 max-w-4xl pb-32">
                    
                    {/* Sección: Introducción */}
                    <section id="introduccion" className="scroll-mt-28 mb-20">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-mono mb-6">
                                API v1.0.0
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-6">
                                Documentación de la API
                            </h1>
                            <p className="text-lg text-slate-400 leading-relaxed mb-8">
                                La API de LegacyMark te permite integrar nuestra potencia de CRM e Inteligencia Artificial directamente en tus aplicaciones, flujos de trabajo personalizados o sitios web externos.
                            </p>
                            
                            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                                <h3 className="text-sm font-semibold text-white mb-2">Base URL</h3>
                                <code className="text-sm font-mono text-teal-400">https://api.legacymark.com/v1</code>
                            </div>
                        </motion.div>
                    </section>

                    {/* Sección: Autenticación */}
                    <section id="autenticacion" className="scroll-mt-28 mb-20 border-t border-slate-800/50 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <Key className="w-6 h-6 text-violet-400" /> Autenticación
                        </h2>
                        <p className="text-slate-400 mb-6">
                            Todas las peticiones a la API deben incluir una clave de API válida utilizando el encabezado HTTP <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Authorization</code> con el esquema Bearer. Puedes generar tus claves desde la consola de desarrollador en tu dashboard.
                        </p>

                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-6">
                            <h4 className="text-sm font-bold text-amber-400 mb-1 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4" /> Mantén tus claves seguras
                            </h4>
                            <p className="text-sm text-amber-500/80">
                                Nunca expongas tus claves secretas (<code className="text-xs">lm_live_...</code>) en el código del lado del cliente, como en aplicaciones frontend o repositorios públicos.
                            </p>
                        </div>

                        <CodeBlock
                            language="cURL"
                            code={`curl https://api.legacymark.com/v1/leads \\
  -H "Authorization: Bearer lm_live_YOUR_SECRET_KEY"`}
                        />
                    </section>

                    {/* Sección: Endpoints Core */}
                    <section id="endpoints" className="scroll-mt-28 mb-20 border-t border-slate-800/50 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <LinkIcon className="w-6 h-6 text-blue-400" /> Endpoints: Leads
                        </h2>
                        <p className="text-slate-400 mb-8">
                            La API de Leads te permite crear contactos directamente en el CRM desde integraciones externas como formularios, chats o plataformas de terceros (Shopify, Wix, etc).
                        </p>

                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-2 py-1 bg-teal-500/20 text-teal-400 text-xs font-bold rounded">POST</span>
                                <code className="text-sm font-mono text-slate-300">/v1/leads</code>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Crear un nuevo Lead</h3>
                            <p className="text-sm text-slate-400 mb-4">Crea un registro de Lead en el CRM. Requiere el scope <code className="text-xs">leads:write</code>.</p>
                            
                            <h4 className="text-sm font-semibold text-slate-300 mb-3 mt-6">Parámetros del Body (JSON)</h4>
                            <div className="overflow-x-auto rounded-xl border border-slate-800 mb-6">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Parámetro</th>
                                            <th className="px-4 py-3 font-medium">Tipo</th>
                                            <th className="px-4 py-3 font-medium">Descripción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50 bg-slate-950 text-slate-300">
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-xs text-violet-300">name<span className="text-red-400">*</span></td>
                                            <td className="px-4 py-3 text-xs">string</td>
                                            <td className="px-4 py-3 text-slate-400">Nombre completo del lead.</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-xs text-violet-300">email</td>
                                            <td className="px-4 py-3 text-xs">string</td>
                                            <td className="px-4 py-3 text-slate-400">Correo electrónico de contacto.</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-xs text-violet-300">phone</td>
                                            <td className="px-4 py-3 text-xs">string</td>
                                            <td className="px-4 py-3 text-slate-400">Teléfono incluyendo código de país (ej. +57...).</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-xs text-violet-300">source</td>
                                            <td className="px-4 py-3 text-xs">string</td>
                                            <td className="px-4 py-3 text-slate-400">Origen del lead (ej. 'Website', 'Facebook').</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <CodeBlock
                                language="JavaScript"
                                code={`const response = await fetch('https://api.legacymark.com/v1/leads', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer lm_live_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Carlos Developer",
    email: "carlos@example.com",
    source: "API Documentation"
  })
});

const data = await response.json();
console.log(data);`}
                            />
                        </div>
                    </section>

                    {/* Sección: Webhooks */}
                    <section id="webhooks" className="scroll-mt-28 mb-20 border-t border-slate-800/50 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <Webhook className="w-6 h-6 text-emerald-400" /> Webhooks y Eventos
                        </h2>
                        <p className="text-slate-400 mb-6">
                            Suscríbete a eventos para recibir notificaciones HTTP en tiempo real en tus propios servidores cuando algo suceda dentro de tu cuenta de LegacyMark.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-4 mb-8">
                            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                <h4 className="text-sm font-semibold text-white mb-2">Eventos de Leads</h4>
                                <ul className="space-y-2">
                                    <li className="text-xs text-slate-400 flex items-center gap-2"><ArrowRight className="w-3 h-3 text-teal-500" /> <code className="text-slate-300">lead.created</code></li>
                                    <li className="text-xs text-slate-400 flex items-center gap-2"><ArrowRight className="w-3 h-3 text-teal-500" /> <code className="text-slate-300">lead.updated</code></li>
                                </ul>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                <h4 className="text-sm font-semibold text-white mb-2">Eventos de Negocios</h4>
                                <ul className="space-y-2">
                                    <li className="text-xs text-slate-400 flex items-center gap-2"><ArrowRight className="w-3 h-3 text-teal-500" /> <code className="text-slate-300">deal.won</code></li>
                                    <li className="text-xs text-slate-400 flex items-center gap-2"><ArrowRight className="w-3 h-3 text-teal-500" /> <code className="text-slate-300">deal.lost</code></li>
                                </ul>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-white mb-3">Verificación de Firmas (HMAC)</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Para asegurarte de que las peticiones provienen genuinamente de LegacyMark, cada webhook incluye un encabezado <code className="text-xs bg-slate-800 px-1 rounded">X-LegacyMark-Signature</code> generado usando tu <b>Webhook Secret</b> y HMAC SHA-256.
                        </p>

                        <CodeBlock
                            language="Node.js (Express)"
                            code={`const crypto = require('crypto');
const express = require('express');
const app = express();

const WEBHOOK_SECRET = process.env.LM_WEBHOOK_SECRET;

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-legacymark-signature'];
  
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).send('Firma inválida');
  }

  const event = JSON.parse(req.body);
  console.log('Evento recibido:', event.type);
  
  res.status(200).send('Webhook recibido');
});`}
                        />
                    </section>

                    {/* Sección: Errores */}
                    <section id="errores" className="scroll-mt-28 border-t border-slate-800/50 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-6 h-6 text-rose-400" /> Códigos de Error
                        </h2>
                        <p className="text-slate-400 mb-6">
                            La API utiliza códigos de estado HTTP convencionales para indicar el éxito o el fracaso de una solicitud.
                        </p>

                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Código HTTP</th>
                                        <th className="px-4 py-3 font-medium">Significado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50 bg-slate-950 text-slate-300">
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-emerald-400">200 / 201</td>
                                        <td className="px-4 py-3">Éxito. La petición se completó o el recurso fue creado.</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-rose-400">400</td>
                                        <td className="px-4 py-3">Bad Request. A menudo debido a un parámetro faltante o mal formado.</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-rose-400">401</td>
                                        <td className="px-4 py-3">Unauthorized. No se proporcionó una clave API o es inválida.</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-rose-400">403</td>
                                        <td className="px-4 py-3">Forbidden. La clave API no tiene el Scope necesario para esta acción.</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-rose-400">429</td>
                                        <td className="px-4 py-3">Too Many Requests. Has excedido tu límite de Rate Limit de la API.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                </main>
            </div>
        </div>
    );
}
