"use client";

import React, { useState } from "react";
import {
    ShieldCheck,
    FileText,
    CheckCircle2,
    Clock,
    AlertTriangle,
    DollarSign,
    QrCode,
    ExternalLink,
    Send,
    Eye,
    RefreshCw,
    Search,
    Filter,
    Plus,
    Download,
    Package,
    Users,
    Hash,
    Cpu,
    Settings,
    Building,
    TrendingUp,
    Sparkles,
    Activity
} from "lucide-react";
import { DianInvoiceViewer, DianInvoiceData } from "./dian-invoice-viewer";
import { DianWithholdingCalculator } from "./dian-withholding-calculator";
import { DianTaxParametersManager } from "./dian-tax-parameters-manager";
import { DianLiveSyncMonitor } from "./dian-live-sync-monitor";
import { DianTaxAiScannerCard } from "./dian-tax-ai-scanner-card";
import { DianNumberingRangesManager } from "./dian-numbering-ranges-manager";
import { DianBuyersManager } from "./dian-buyers-manager";
import { DianProductsServicesManager } from "./dian-products-services-manager";
import { DianMicroserviceDiagnosticsCard } from "./dian-microservice-diagnostics-card";
import { DianInvoicingSettings } from "@/components/settings/dian-invoicing-settings";

import { evaluateDianSystemReadiness } from "@/lib/dian-readiness-check";

interface DianDocumentRecord {
    id: string;
    documentType: "FACTURA_ELECTRONICA" | "NOTA_CREDITO" | "NOTA_DEBITO" | "DOCUMENTO_SOPORTE";
    prefix: string;
    number: number;
    issueDate: string;
    buyerName: string;
    buyerNit: string;
    subtotal: number;
    vat: number;
    total: number;
    status: "BORRADOR" | "ENVIADO_DIAN" | "ACEPTADO_DIAN" | "RECHAZADO_DIAN" | "ENVIADO_CLIENTE";
    cufe?: string;
    qrCodeText?: string;
}

export function DianElectronicBillingHub() {
    // 4 Category Navigation: "DOCUMENTS" | "CATALOGS" | "AI_DIAGNOSTICS" | "SETTINGS"
    const [mainCategory, setMainCategory] = useState<"DOCUMENTS" | "CATALOGS" | "AI_DIAGNOSTICS" | "SETTINGS">("DOCUMENTS");
    
    // Sub-tab inside category
    const [subTab, setSubTab] = useState<string>("FE"); // FE, NC, DS, RETEFUENTE, BUYERS, PRODUCTS, RANGES, AI_SCAN, DIAGNOSTICS, LIVE_SYNC, TAX_PARAMS, SAAS_CONFIG

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [selectedInvoice, setSelectedInvoice] = useState<DianInvoiceData | null>(null);

    const [documents] = useState<DianDocumentRecord[]>([
        {
            id: "1",
            documentType: "FACTURA_ELECTRONICA",
            prefix: "SETP",
            number: 154,
            issueDate: "2026-08-08 10:15",
            buyerName: "CARLIXPLAST S.A.S",
            buyerNit: "890211126-4",
            subtotal: 1000000,
            vat: 190000,
            total: 1190000,
            status: "ACEPTADO_DIAN",
            cufe: "fc8eac422eba16e22ffd8c6f94b3f40a6e38112d7d06e23b2075a6e87a25032d8471a5c689d0f488f7b764b8a2135678",
            qrCodeText: "https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=fc8eac42...",
        },
        {
            id: "2",
            documentType: "FACTURA_ELECTRONICA",
            prefix: "SETP",
            number: 153,
            issueDate: "2026-08-07 16:40",
            buyerName: "HEYBER FLOREZ",
            buyerNit: "1007306770",
            subtotal: 450000,
            vat: 85500,
            total: 535500,
            status: "ENVIADO_CLIENTE",
            cufe: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0",
            qrCodeText: "https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=a1b2c3d4...",
        },
        {
            id: "3",
            documentType: "DOCUMENTO_SOPORTE",
            prefix: "DS",
            number: 45,
            issueDate: "2026-08-06 11:20",
            buyerName: "MARIA GOMEZ (Cuenta de Cobro)",
            buyerNit: "63512345",
            subtotal: 800000,
            vat: 0,
            total: 800000,
            status: "ACEPTADO_DIAN",
            cufe: "b987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0",
        },
    ]);

    const readiness = evaluateDianSystemReadiness({
        softwareId: "b8c3f4e1-7d9a-4e2b-8f1c-3a5d7e9f0b2a",
        softwarePin: "12345",
        certificateValidUntil: "2027-12-31",
        resolutionNumber: "18760000001",
        resolutionEndDate: "2027-01-15",
        testSetId: "fa82e1d0-9988-4433-bb22-110099887766",
        environment: "HABILITACION",
    });

    const fmtMoney = (n: number) =>
        new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

    const handleViewInvoice = (doc: DianDocumentRecord) => {
        setSelectedInvoice({
            invoiceNumber: `${doc.prefix}-${doc.number}`,
            issueDate: doc.issueDate,
            issueTime: "10:15:00-05:00",
            cufe: doc.cufe || "fc8eac422eba16e22ffd8c6f94b3f40a...",
            qrCodeText: doc.qrCodeText || "https://catalogo-vpfe.dian.gov.co",
            environment: "2 - Habilitación / Pruebas DIAN",
            seller: {
                name: "LEGACYMARK S.A.S.",
                nit: "901345678-1",
                address: "Carrera 27 # 36-14, Bucaramanga, Santander",
                email: "facturacion@legacymark.com",
                phone: "3145162914",
                taxRegime: "O-48 Responsable de IVA",
            },
            buyer: {
                name: doc.buyerName,
                nit: doc.buyerNit,
                address: "Dirección Registrada del Cliente",
                email: "cliente@empresa.com",
                phone: "3001234567",
                taxRegime: "R-99-PN No Responsable de IVA",
            },
            items: [
                {
                    code: "SERV-01",
                    description: "Servicio de Desarrollo y Parametrización DIAN",
                    quantity: 1,
                    unitPrice: doc.subtotal,
                    vatRate: doc.vat > 0 ? 19 : 0,
                    subtotal: doc.subtotal,
                    vat: doc.vat,
                    total: doc.total,
                },
            ],
            subtotal: doc.subtotal,
            vatTotal: doc.vat,
            total: doc.total,
            notes: "Factura emitida conforme al Anexo Técnico 1.9 DIAN.",
        });
    };

    return (
        <div className="space-y-6 text-slate-100 p-2 md:p-6 max-w-[1600px] mx-auto">
            {/* Header Title Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="space-y-1 z-10">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" /> DIAN Anexo Técnico 1.9 & RADIAN
                        </span>
                        <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-bold rounded-full">
                            UVT 2026: $49.799 COP
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        Centro de Gestión Electrónica DIAN 🇨🇴
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400">
                        Facturación Electrónica de Venta, Notas Crédito/Débito, Documento Soporte y Factoring RADIAN.
                    </p>
                </div>

                <div className="flex items-center gap-3 z-10 shrink-0">
                    <div className="text-right hidden sm:block">
                        <div className="text-xs font-bold text-slate-400">Estado de Habilitación</div>
                        <div className="text-sm font-black text-emerald-400">{readiness.overallScore}% CUMPLIMIENTO</div>
                    </div>
                    <button
                        onClick={() => {
                            setMainCategory("DOCUMENTS");
                            setSubTab("FE");
                        }}
                        className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
                    >
                        <Plus className="w-4 h-4" /> Emitir Factura Electrónica
                    </button>
                </div>
            </div>

            {/* Executive Summary Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span className="font-bold">Total Facturado (Mes)</span>
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-white font-mono">{fmtMoney(2525500)}</div>
                    <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +12.5% vs mes anterior
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span className="font-bold">Facturas Aceptadas DIAN</span>
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="text-2xl font-black text-teal-400 font-mono">154 / 154</div>
                    <div className="text-[10px] text-slate-400 font-medium">100% Rechazos Prevenidos</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span className="font-bold">IVA Generado (19%)</span>
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-2xl font-black text-indigo-400 font-mono">{fmtMoney(403245)}</div>
                    <div className="text-[10px] text-slate-400 font-medium">Formulario 300 DIAN</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span className="font-bold">Directorio de Adquirientes</span>
                        <Users className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-amber-400 font-mono">48 Clientes</div>
                    <div className="text-[10px] text-slate-400 font-medium">NIT / Cédulas Registradas</div>
                </div>
            </div>

            {/* MAIN CATEGORY NAVIGATION TABS (ORGANIZED & PROFESSIONAL) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                        onClick={() => {
                            setMainCategory("DOCUMENTS");
                            setSubTab("FE");
                        }}
                        className={`p-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 ${
                            mainCategory === "DOCUMENTS"
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        }`}
                    >
                        <FileText className="w-4 h-4" /> Comprobantes & Facturas
                    </button>

                    <button
                        onClick={() => {
                            setMainCategory("CATALOGS");
                            setSubTab("BUYERS");
                        }}
                        className={`p-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 ${
                            mainCategory === "CATALOGS"
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        }`}
                    >
                        <Package className="w-4 h-4" /> Catálogos & Clientes
                    </button>

                    <button
                        onClick={() => {
                            setMainCategory("AI_DIAGNOSTICS");
                            setSubTab("AI_SCAN");
                        }}
                        className={`p-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 ${
                            mainCategory === "AI_DIAGNOSTICS"
                                ? "bg-teal-600 text-white shadow-lg shadow-teal-600/30"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        }`}
                    >
                        <Cpu className="w-4 h-4" /> Auditoría & Diagnóstico AI
                    </button>

                    <button
                        onClick={() => {
                            setMainCategory("SETTINGS");
                            setSubTab("SAAS_CONFIG");
                        }}
                        className={`p-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 ${
                            mainCategory === "SETTINGS"
                                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        }`}
                    >
                        <Settings className="w-4 h-4" /> Configuración & SaaS
                    </button>
                </div>

                {/* SUB-CATEGORY PILLS */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800 mt-3 px-1">
                    {mainCategory === "DOCUMENTS" && (
                        <>
                            <button
                                onClick={() => setSubTab("FE")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    subTab === "FE" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                Facturas de Venta (FE)
                            </button>
                            <button
                                onClick={() => setSubTab("NC")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    subTab === "NC" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                Notas Crédito / Débito
                            </button>
                            <button
                                onClick={() => setSubTab("DS")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    subTab === "DS" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                Documento Soporte (DS)
                            </button>
                            <button
                                onClick={() => setSubTab("RETEFUENTE")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    subTab === "RETEFUENTE" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                Retención en la Fuente 2026
                            </button>
                        </>
                    )}

                    {mainCategory === "CATALOGS" && (
                        <>
                            <button
                                onClick={() => setSubTab("BUYERS")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    subTab === "BUYERS" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                Adquirientes / Compradores
                            </button>
                            <button
                                onClick={() => setSubTab("PRODUCTS")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    subTab === "PRODUCTS" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                Productos & Servicios
                            </button>
                            <button
                                onClick={() => setSubTab("RANGES")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    subTab === "RANGES" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                Rangos de Numeración DIAN
                            </button>
                        </>
                    )}

                    {mainCategory === "AI_DIAGNOSTICS" && (
                        <>
                            <button
                                onClick={() => setSubTab("AI_SCAN")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    subTab === "AI_SCAN" ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                Auditor AI DIAN 2026 🤖
                            </button>
                            <button
                                onClick={() => setSubTab("DIAGNOSTICS")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    subTab === "DIAGNOSTICS" ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                Diagnóstico Microservicio ⚡
                            </button>
                            <button
                                onClick={() => setSubTab("LIVE_SYNC")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    subTab === "LIVE_SYNC" ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                Monitor Sincronización TRM/UVT
                            </button>
                        </>
                    )}

                    {mainCategory === "SETTINGS" && (
                        <>
                            <button
                                onClick={() => setSubTab("SAAS_CONFIG")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    subTab === "SAAS_CONFIG" ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                Configuración SaaS & Producción 🚀
                            </button>
                            <button
                                onClick={() => setSubTab("TAX_PARAMS")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    subTab === "TAX_PARAMS" ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                Catálogo Parámetros Tributarios
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* DYNAMIC CONTENT AREA */}
            <div>
                {/* 1. DOCUMENTS CATEGORY */}
                {mainCategory === "DOCUMENTS" && subTab === "RETEFUENTE" && (
                    <DianWithholdingCalculator />
                )}

                {mainCategory === "DOCUMENTS" && subTab !== "RETEFUENTE" && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-emerald-400" /> Registro de Comprobantes Emitidos
                            </h3>

                            <div className="relative w-full sm:w-72">
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar por NIT, Cliente o #"
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                                        <th className="p-3">Tipo / Nro Documento</th>
                                        <th className="p-3">Adquirente / Cliente</th>
                                        <th className="p-3">NIT / Cédula</th>
                                        <th className="p-3">Fecha Emisión</th>
                                        <th className="p-3 text-right">Subtotal</th>
                                        <th className="p-3 text-right">IVA (19%)</th>
                                        <th className="p-3 text-right">Total Factura</th>
                                        <th className="p-3 text-center">Estado DIAN</th>
                                        <th className="p-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-medium">
                                    {documents.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="p-3 font-mono font-bold text-white">
                                                {doc.prefix}-{doc.number}
                                            </td>
                                            <td className="p-3 font-bold text-slate-200">{doc.buyerName}</td>
                                            <td className="p-3 font-mono text-slate-400">{doc.buyerNit}</td>
                                            <td className="p-3 text-slate-400 font-mono text-[11px]">{doc.issueDate}</td>
                                            <td className="p-3 text-right font-mono text-slate-300">{fmtMoney(doc.subtotal)}</td>
                                            <td className="p-3 text-right font-mono text-slate-400">{fmtMoney(doc.vat)}</td>
                                            <td className="p-3 text-right font-mono font-bold text-emerald-400">{fmtMoney(doc.total)}</td>
                                            <td className="p-3 text-center">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    ● ACEPTADO DIAN
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button
                                                    onClick={() => handleViewInvoice(doc)}
                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Ver PDF / XML
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 2. CATALOGS CATEGORY */}
                {mainCategory === "CATALOGS" && subTab === "BUYERS" && <DianBuyersManager />}
                {mainCategory === "CATALOGS" && subTab === "PRODUCTS" && <DianProductsServicesManager />}
                {mainCategory === "CATALOGS" && subTab === "RANGES" && <DianNumberingRangesManager />}

                {/* 3. AI & DIAGNOSTICS CATEGORY */}
                {mainCategory === "AI_DIAGNOSTICS" && subTab === "AI_SCAN" && <DianTaxAiScannerCard />}
                {mainCategory === "AI_DIAGNOSTICS" && subTab === "DIAGNOSTICS" && <DianMicroserviceDiagnosticsCard />}
                {mainCategory === "AI_DIAGNOSTICS" && subTab === "LIVE_SYNC" && <DianLiveSyncMonitor />}

                {/* 4. SETTINGS CATEGORY */}
                {mainCategory === "SETTINGS" && subTab === "SAAS_CONFIG" && <DianInvoicingSettings />}
                {mainCategory === "SETTINGS" && subTab === "TAX_PARAMS" && <DianTaxParametersManager />}
            </div>

            {/* Modal Viewer */}
            {selectedInvoice && (
                <DianInvoiceViewer invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
            )}
        </div>
    );
}
