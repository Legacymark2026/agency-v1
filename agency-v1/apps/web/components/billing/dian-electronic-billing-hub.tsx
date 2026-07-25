"use client";

import React, { useState } from "react";
import {
    FileText,
    FileCheck,
    FileMinus,
    FilePlus,
    Building2,
    ShieldCheck,
    RefreshCw,
    Send,
    Eye,
    QrCode,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowUpRight,
    Search,
    Filter,
    Plus,
    Download
} from "lucide-react";
import { DianInvoiceViewer, DianInvoiceData } from "./dian-invoice-viewer";
import { DianWithholdingCalculator } from "./dian-withholding-calculator";

export interface DianDocumentRecord {
    id: string;
    documentType: "FACTURA_ELECTRONICA" | "NOTA_CREDITO" | "NOTA_DEBITO" | "DOCUMENTO_SOPORTE";
    prefix: string;
    number: string;
    cufeOrCude: string;
    issueDate: string;
    buyerName: string;
    buyerNit: string;
    totalAmount: number;
    dianStatus: "ACEPTADO_DIAN" | "EN_PROCESO" | "RECHAZADO";
    radianStatus?: "SIN_EVENTOS" | "ACUSE_RECIBO" | "BIENES_RECIBIDOS" | "ACEPTACION_EXPRESA";
}

const INITIAL_DOCUMENTS: DianDocumentRecord[] = [
    {
        id: "doc-1",
        documentType: "FACTURA_ELECTRONICA",
        prefix: "FE",
        number: "331643",
        cufeOrCude: "89201948192849182948192849182948192849182948192849182948192849182948192849182948192849182948192",
        issueDate: "2026-07-24 11:26",
        buyerName: "ENRIQUE BOHORQUEZ GAFA 8",
        buyerNit: "5493509",
        totalAmount: 1190000,
        dianStatus: "ACEPTADO_DIAN",
        radianStatus: "ACEPTACION_EXPRESA"
    },
    {
        id: "doc-2",
        documentType: "FACTURA_ELECTRONICA",
        prefix: "FE",
        number: "331644",
        cufeOrCude: "71928491829481928491829481928491829481928491829481928491829481928491829481928491829481928491829",
        issueDate: "2026-07-24 14:15",
        buyerName: "CARLIXPLAST CLIENTE DEMO S.A.S",
        buyerNit: "900123456",
        totalAmount: 580000,
        dianStatus: "ACEPTADO_DIAN",
        radianStatus: "BIENES_RECIBIDOS"
    },
    {
        id: "doc-3",
        documentType: "NOTA_CREDITO",
        prefix: "NC",
        number: "980001",
        cufeOrCude: "61928491829481928491829481928491829481928491829481928491829481928491829481928491829481928491829",
        issueDate: "2026-07-24 15:30",
        buyerName: "ENRIQUE BOHORQUEZ GAFA 8",
        buyerNit: "5493509",
        totalAmount: 150000,
        dianStatus: "ACEPTADO_DIAN"
    },
    {
        id: "doc-4",
        documentType: "DOCUMENTO_SOPORTE",
        prefix: "DS",
        number: "100045",
        cufeOrCude: "51928491829481928491829481928491829481928491829481928491829481928491829481928491829481928491829",
        issueDate: "2026-07-24 16:00",
        buyerName: "PEDRO PEREZ (PROVEEDOR NO OBLIGADO)",
        buyerNit: "1098472918",
        totalAmount: 420000,
        dianStatus: "ACEPTADO_DIAN"
    }
];

export function DianElectronicBillingHub() {
    const [documents, setDocuments] = useState<DianDocumentRecord[]>(INITIAL_DOCUMENTS);
    const [activeTab, setActiveTab] = useState<"ALL" | "FE" | "NC" | "ND" | "DS">("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDocForViewer, setSelectedDocForViewer] = useState<DianInvoiceData | null>(null);

    // Modal state for issuing NC / Radian Event
    const [showNcModal, setShowNcModal] = useState(false);
    const [ncTargetDoc, setNcTargetDoc] = useState<DianDocumentRecord | null>(null);
    const [ncReason, setNcReason] = useState("Devolución parcial de mercancía recibida");
    const [ncAmount, setNcAmount] = useState("100000");

    const [showRadianModal, setShowRadianModal] = useState(false);
    const [radianTargetDoc, setRadianTargetDoc] = useState<DianDocumentRecord | null>(null);

    const filteredDocs = documents.filter((doc) => {
        const matchesTab =
            activeTab === "ALL" ||
            (activeTab === "FE" && doc.documentType === "FACTURA_ELECTRONICA") ||
            (activeTab === "NC" && doc.documentType === "NOTA_CREDITO") ||
            (activeTab === "ND" && doc.documentType === "NOTA_DEBITO") ||
            (activeTab === "DS" && doc.documentType === "DOCUMENTO_SOPORTE");

        const matchesSearch =
            doc.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.buyerNit.includes(searchTerm) ||
            doc.number.includes(searchTerm) ||
            doc.cufeOrCude.includes(searchTerm);

        return matchesTab && matchesSearch;
    });

    const handleViewInvoice = (doc: DianDocumentRecord) => {
        const sampleData: DianInvoiceData = {
            documentType: doc.documentType as any,
            documentNumber: `${doc.prefix}-${doc.number}`,
            cufeOrCude: doc.cufeOrCude,
            issueDate: doc.issueDate,
            dueDate: "2026-08-24",
            paymentForm: "Contado",
            paymentMethod: "Transferencia Débito Bancaria",
            operationType: "10 - Estándar",
            purchaseOrder: "ORD-2026-88",
            issuer: {
                companyName: "CARLIXPLAST S.A.S",
                tradeName: "CARLIXPLAST",
                nit: "890.211.126-4",
                taxpayerType: "Persona Jurídica",
                taxRegime: "O-48 - Impuesto sobre las ventas - IVA",
                taxResponsibility: "O-13 - Gran Contribuyente",
                economicActivity: "2221",
                country: "Colombia",
                department: "Santander",
                city: "Bucaramanga",
                address: "Calle 33 No. 11-83",
                phone: "3123010693",
                email: "facturacion@carlixplast.com",
                slogan: "Soluciones Amigables",
                certifications: "ISO 9001 - ISO 45001 (ICONTEC)",
                pqrPhone: "PQR - 3123010693",
                sellerName: "WILSON TAPIA 8 GONZALEZ",
            },
            buyer: {
                name: doc.buyerName,
                documentType: "NIT",
                documentNumber: doc.buyerNit,
                taxpayerType: "Persona Jurídica",
                taxRegime: "O-48",
                taxResponsibility: "01 - IVA",
                country: "Colombia",
                department: "Santander",
                city: "Bucaramanga",
                address: "Calle 16 # 3 - 47",
                phone: "3124272175",
                email: "cliente@empresa.com",
            },
            items: [
                {
                    nro: 1,
                    code: "EMP-ROLLO-100",
                    description: "BOLSA EMBALAJE TRANSPARENTE ALTA DENSIDAD x 100M",
                    unitOfMeasure: "ROLLO",
                    quantity: 10,
                    unitPrice: 100000,
                    ivaPct: 19,
                    totalItemValue: 1000000,
                },
            ],
            subtotal: doc.totalAmount / 1.19,
            taxTotal: doc.totalAmount - (doc.totalAmount / 1.19),
            discountTotal: 0,
            grandTotal: doc.totalAmount,
            totalAmount: doc.totalAmount,
        };

        setSelectedDocForViewer(sampleData);
    };

    const handleCreateNc = () => {
        if (!ncTargetDoc) return;
        const newNcNumber = String(Math.floor(100000 + Math.random() * 900000));
        const newNc: DianDocumentRecord = {
            id: `doc-nc-${Date.now()}`,
            documentType: "NOTA_CREDITO",
            prefix: "NC",
            number: newNcNumber,
            cufeOrCude: `nc-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
            issueDate: new Date().toISOString().replace("T", " ").substring(0, 16),
            buyerName: ncTargetDoc.buyerName,
            buyerNit: ncTargetDoc.buyerNit,
            totalAmount: Number(ncAmount) || 50000,
            dianStatus: "ACEPTADO_DIAN",
        };

        setDocuments([newNc, ...documents]);
        setShowNcModal(false);
        setNcTargetDoc(null);
    };

    const handleRegisterRadianEvent = (eventType: "030" | "032" | "033") => {
        if (!radianTargetDoc) return;

        const updatedDocs = documents.map((doc) => {
            if (doc.id === radianTargetDoc.id) {
                const radianStatusMap: Record<string, any> = {
                    "030": "ACUSE_RECIBO",
                    "032": "BIENES_RECIBIDOS",
                    "033": "ACEPTACION_EXPRESA",
                };
                return { ...doc, radianStatus: radianStatusMap[eventType] };
            }
            return doc;
        });

        setDocuments(updatedDocs);
        setShowRadianModal(false);
        setRadianTargetDoc(null);
    };

    return (
        <div className="space-y-6 text-slate-100">
            {/* TOP TITLE BANNER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                            Centro de Gestión Electrónica DIAN & RADIAN ⚡
                        </h1>
                    </div>
                    <p className="text-xs text-slate-400 pl-11">
                        Facturación Electrónica UBL 2.1, Notas Crédito/Débito, Documento Soporte y Eventos RADIAN para Factoraje.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setNcTargetDoc(documents[0]);
                            setShowNcModal(true);
                        }}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 shadow-md"
                    >
                        <FileMinus className="w-4 h-4 text-amber-400" /> Emitir Nota Crédito
                    </button>
                    <button
                        onClick={() => {
                            setRadianTargetDoc(documents[0]);
                            setShowRadianModal(true);
                        }}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Registrar Evento RADIAN
                    </button>
                </div>
            </div>

            {/* QUICK STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Facturas Aceptadas DIAN</span>
                        <span className="text-lg font-black text-white">
                            {documents.filter(d => d.documentType === "FACTURA_ELECTRONICA").length}
                        </span>
                    </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                        <FileMinus className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Notas Crédito Emitidas</span>
                        <span className="text-lg font-black text-white">
                            {documents.filter(d => d.documentType === "NOTA_CREDITO").length}
                        </span>
                    </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Documentos Soporte</span>
                        <span className="text-lg font-black text-white">
                            {documents.filter(d => d.documentType === "DOCUMENTO_SOPORTE").length}
                        </span>
                    </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Eventos RADIAN Título Valor</span>
                        <span className="text-lg font-black text-white">
                            {documents.filter(d => d.radianStatus === "ACEPTACION_EXPRESA").length}
                        </span>
                    </div>
                </div>
            </div>

            {/* SEARCH & TABS BAR */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                    <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab("ALL")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === "ALL" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                            }`}
                        >
                            Todos ({documents.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("FE")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === "FE" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                            }`}
                        >
                            Facturas FE
                        </button>
                        <button
                            onClick={() => setActiveTab("NC")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === "NC" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                            }`}
                        >
                            Notas Crédito
                        </button>
                        <button
                            onClick={() => setActiveTab("DS")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === "DS" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                            }`}
                        >
                            Doc. Soporte
                        </button>
                        <button
                            onClick={() => setActiveTab("RETEFUENTE")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                activeTab === "RETEFUENTE" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                            }`}
                        >
                            Retención en la Fuente 2026
                        </button>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por NIT, Cliente, CUFE o #"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>

                {/* CONDITIONAL RENDER: RETEFUENTE CALCULATOR OR DOCUMENTS TABLE */}
                {activeTab === "RETEFUENTE" ? (
                    <div className="pt-2">
                        <DianWithholdingCalculator />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                                <th className="p-3">Tipo / Nro Documento</th>
                                <th className="p-3">Adquirente / Cliente</th>
                                <th className="p-3">NIT / Cédula</th>
                                <th className="p-3">Fecha Emisión</th>
                                <th className="p-3 text-right">Monto Total</th>
                                <th className="p-3 text-center">Estado DIAN</th>
                                <th className="p-3 text-center">RADIAN Evento</th>
                                <th className="p-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                            {filteredDocs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="p-3 space-y-0.5">
                                        <span className="font-mono font-bold text-white block">
                                            {doc.prefix}-{doc.number}
                                        </span>
                                        <span className="text-[10px] text-slate-400 uppercase block">
                                            {doc.documentType.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="p-3 font-semibold text-slate-200">{doc.buyerName}</td>
                                    <td className="p-3 font-mono text-slate-400">{doc.buyerNit}</td>
                                    <td className="p-3 text-slate-400 text-[11px]">{doc.issueDate}</td>
                                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                                        ${doc.totalAmount.toLocaleString()} COP
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Aceptado DIAN
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                        {doc.radianStatus ? (
                                            <span className="px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded-md text-[9.5px] font-bold">
                                                {doc.radianStatus.replace("_", " ")}
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 text-[10px] italic">N/A</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                onClick={() => handleViewInvoice(doc)}
                                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-all border border-slate-700 flex items-center gap-1 font-bold"
                                                title="Ver Factura PDF A4"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> PDF
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const xmlStr = `<?xml version="1.0" encoding="UTF-8"?><AttachedDocument xmlns="urn:oasis:names:specification:ubl:schema:xsd:AttachedDocument-2"><cbc:ID>${doc.prefix}${doc.number}</cbc:ID><cbc:UUID>${doc.cufeOrCude}</cbc:UUID></AttachedDocument>`;
                                                    const blob = new Blob([xmlStr], { type: "application/zip" });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement("a");
                                                    a.href = url;
                                                    a.download = `Paquete_DIAN_AttachedDocument_${doc.prefix}${doc.number}.zip`;
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                }}
                                                className="p-1.5 bg-teal-900/40 hover:bg-teal-900/60 text-teal-300 border border-teal-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                                title="Descargar Paquete Legal AttachedDocument (.ZIP DIAN)"
                                            >
                                                <Download className="w-3.5 h-3.5 text-emerald-400" /> ZIP
                                            </button>
                                            <button
                                                onClick={() => {
                                                    alert(`📩 Factura ${doc.prefix}-${doc.number} reenviada exitosamente por correo electrónico a ${doc.buyerName} con adjuntos PDF A4 + XML UBL 2.1.`);
                                                }}
                                                className="p-1.5 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                                title="Reenviar por Correo Electrónico al Adquirente"
                                            >
                                                <Send className="w-3.5 h-3.5 text-indigo-400" /> Correo
                                            </button>
                                            {doc.documentType === "FACTURA_ELECTRONICA" && (
                                                <button
                                                    onClick={() => {
                                                        setNcTargetDoc(doc);
                                                        setShowNcModal(true);
                                                    }}
                                                    className="p-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                                    title="Emitir Nota Crédito a esta Factura"
                                                >
                                                    <FileMinus className="w-3.5 h-3.5" /> NC
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
            </div>

            {/* MODAL: VER REPRESENTACIÓN GRÁFICA A4 DIAN */}
            {selectedDocForViewer && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                    <div className="w-full max-w-5xl my-8">
                        <DianInvoiceViewer
                            data={selectedDocForViewer}
                            onClose={() => setSelectedDocForViewer(null)}
                        />
                    </div>
                </div>
            )}

            {/* MODAL: EMITIR NOTA CRÉDITO ELECTRÓNICA (NC) */}
            {showNcModal && ncTargetDoc && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                                <FileMinus className="w-4 h-4" /> Emitir Nota Crédito Electrónica (UBL 2.1)
                            </h3>
                            <button onClick={() => setShowNcModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                                <p className="text-slate-400">Factura de Origen Vinculada:</p>
                                <p className="font-mono font-bold text-white">{ncTargetDoc.prefix}-{ncTargetDoc.number} | CUFE: {ncTargetDoc.cufeOrCude.substring(0, 30)}...</p>
                                <p className="text-slate-300">Cliente: <span className="font-bold">{ncTargetDoc.buyerName}</span></p>
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">Concepto de Corrección DIAN *</label>
                                <select
                                    value={ncReason}
                                    onChange={(e) => setNcReason(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 font-semibold"
                                >
                                    <option value="Devolución parcial de mercancía recibida">1. Devolución parcial de mercancía</option>
                                    <option value="Anulación de factura electrónica">2. Anulación total de factura</option>
                                    <option value="Rebaja o descuento parcial concedido">3. Rebaja o descuento comercial</option>
                                    <option value="Rescisión o resolución de contrato">4. Rescisión de contrato</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">Valor de la Nota Crédito (COP) *</label>
                                <input
                                    type="number"
                                    value={ncAmount}
                                    onChange={(e) => setNcAmount(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 font-mono font-bold text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                            <button onClick={() => setShowNcModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancelar</button>
                            <button onClick={handleCreateNc} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
                                <Send className="w-4 h-4" /> Firmar y Transmitir a la DIAN
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: REGISTRAR EVENTO RADIAN TÍTULO VALOR */}
            {showRadianModal && radianTargetDoc && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wide flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Registrar Evento RADIAN (Factoraje)
                            </h3>
                            <button onClick={() => setShowRadianModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                                <p className="text-slate-400">Factura Electrónica a Crédito:</p>
                                <p className="font-mono font-bold text-white">{radianTargetDoc.prefix}-{radianTargetDoc.number} | CUFE: {radianTargetDoc.cufeOrCude.substring(0, 30)}...</p>
                            </div>

                            <p className="text-slate-300">Selecciona el evento RADIAN que deseas transmitir al catálogo oficial de la DIAN:</p>

                            <div className="space-y-2">
                                <button
                                    onClick={() => handleRegisterRadianEvent("030")}
                                    className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-left flex justify-between items-center transition-all"
                                >
                                    <div>
                                        <span className="font-bold text-teal-400 block">Evento 030 - Acuse de Recibo de Factura</span>
                                        <span className="text-[10.5px] text-slate-400">Confirma que el cliente ha recibido la factura electrónica.</span>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-teal-400 shrink-0" />
                                </button>

                                <button
                                    onClick={() => handleRegisterRadianEvent("032")}
                                    className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-left flex justify-between items-center transition-all"
                                >
                                    <div>
                                        <span className="font-bold text-emerald-400 block">Evento 032 - Recibo de Bienes o Servicios</span>
                                        <span className="text-[10.5px] text-slate-400">Confirma la entrega física o prestación satisfactoria.</span>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
                                </button>

                                <button
                                    onClick={() => handleRegisterRadianEvent("033")}
                                    className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-left flex justify-between items-center transition-all"
                                >
                                    <div>
                                        <span className="font-bold text-indigo-400 block">Evento 033 - Aceptación Expresa de Factura</span>
                                        <span className="text-[10.5px] text-slate-400">Convierte formalmente la factura en Título Valor negociable.</span>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-indigo-400 shrink-0" />
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-800">
                            <button onClick={() => setShowRadianModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
