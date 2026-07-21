"use client";

import React from "react";
import { Printer, Download, ShieldCheck, QrCode } from "lucide-react";

export interface DianInvoiceData {
    documentType?: "FACTURA_ELECTRONICA" | "NOTA_CREDITO" | "NOTA_DEBITO";
    documentNumber: string;
    cufeOrCude: string;
    issueDate: string;
    dueDate?: string;
    paymentForm?: string; // Contado / Crédito
    paymentMethod?: string; // Instrumento no definido, Transferencia, Efectivo
    operationType?: string; // 10 - Específica, 20 - Nota Crédito

    // Emisor
    issuer: {
        companyName: string;
        tradeName?: string;
        nit: string;
        taxpayerType?: string; // Persona Jurídica / Persona Natural
        taxRegime?: string; // R-99-PN / O-48
        taxResponsibility?: string; // 01 - IVA / ZZ - No aplica
        economicActivity?: string; // CIIU 7310
        country?: string;
        department?: string;
        city?: string;
        address?: string;
        phone?: string;
        email?: string;
    };

    // Adquiriente
    buyer: {
        name: string;
        documentType?: string; // NIT / CC / Pasaporte
        documentNumber: string;
        taxpayerType?: string;
        taxRegime?: string;
        taxResponsibility?: string;
        country?: string;
        department?: string;
        city?: string;
        address?: string;
        phone?: string;
        email?: string;
    };

    // Detalle de Productos
    items: Array<{
        nro: number;
        code: string;
        description: string;
        unitOfMeasure?: string; // WSD, EA, KGM
        quantity: number;
        unitPrice: number;
        discountDetail?: number;
        surchargeDetail?: number;
        ivaPct?: number;
        incPct?: number;
        totalItemValue: number;
    }>;

    // Referencias
    references?: Array<{
        type: string;
        number: string;
        date: string;
        reason?: string;
        referencedCufe?: string;
    }>;

    notes?: string;
    subtotal: number;
    taxTotal: number;
    discountTotal: number;
    grandTotal: number;
}

interface DianInvoiceViewerProps {
    data: DianInvoiceData;
    onClose?: () => void;
}

export function DianInvoiceViewer({ data, onClose }: DianInvoiceViewerProps) {
    const handlePrint = () => {
        window.print();
    };

    const isCreditNote = data.documentType === "NOTA_CREDITO";
    const documentTitle = isCreditNote
        ? "Nota Crédito de la Factura Electrónica de Venta"
        : "Factura Electrónica de Venta";

    const cufeLabel = isCreditNote ? "Código Único de documento electrónico - CUDE" : "Código Único de Factura Electrónica - CUFE";

    const fmtCOP = (num: number) => {
        return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 2 }).format(num);
    };

    return (
        <div className="bg-slate-950 text-slate-900 font-sans p-4 md:p-8 min-h-screen flex flex-col items-center">
            {/* ACTION BAR (HIDDEN IN PRINT) */}
            <div className="w-full max-w-4xl mb-6 flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl text-white print:hidden">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-sm">Representación Gráfica Oficial DIAN (Anexo 1.8)</span>
                </div>
                <div className="flex gap-2">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all"
                        >
                            Cerrar
                        </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                        <Printer className="w-4 h-4" /> Imprimir Documento A4
                    </button>
                </div>
            </div>

            {/* A4 PRINTABLE DOCUMENT CONTAINER */}
            <div
                id="dian-printable-document"
                className="w-full max-w-4xl bg-white text-slate-900 p-8 md:p-10 shadow-2xl rounded-sm font-sans text-xs space-y-6 print:p-0 print:shadow-none print:w-full print:max-w-none"
            >
                {/* BRAND HEADER & DIAN TITLE */}
                <div className="text-center space-y-1 relative pb-4 border-b-4 border-emerald-400">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-2xl font-black text-slate-800 tracking-tighter uppercase">DIAN</span>
                        <span className="text-xs text-slate-500 font-mono">Formato Oficial Anexo Técnico 1.8</span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">{documentTitle}</h1>
                    <h2 className="text-base font-semibold text-emerald-600">Representación Gráfica</h2>
                </div>

                {/* 1. DATOS DEL DOCUMENTO */}
                <div className="space-y-2">
                    <h3 className="font-bold text-sm text-emerald-700 border-b border-emerald-400 pb-1">
                        Datos del Documento
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1.5 gap-x-6 text-[11px] leading-relaxed">
                        <div className="md:col-span-2 bg-slate-50 p-2 rounded border border-slate-200">
                            <span className="font-bold text-slate-700 block">{cufeLabel}:</span>
                            <span className="font-mono text-[10px] break-all text-slate-800 font-semibold">
                                {data.cufeOrCude}
                            </span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Número de Factura: </span>
                            <span className="font-mono font-bold text-slate-900">{data.documentNumber}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Forma de Pago: </span>
                            <span>{data.paymentForm || "Contado"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Fecha de Emisión: </span>
                            <span>{data.issueDate}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Medio de Pago: </span>
                            <span>{data.paymentMethod || "Instrumento no definido"}</span>
                        </div>
                        {data.dueDate && (
                            <div>
                                <span className="font-bold text-slate-700">Fecha de Vencimiento: </span>
                                <span>{data.dueDate}</span>
                            </div>
                        )}
                        <div>
                            <span className="font-bold text-slate-700">Tipo de Operación: </span>
                            <span>{data.operationType || (isCreditNote ? "20 - Nota Crédito" : "10 - Específica")}</span>
                        </div>
                    </div>
                </div>

                {/* 2. DATOS DEL EMISOR / VENDEDOR */}
                <div className="space-y-2">
                    <h3 className="font-bold text-sm text-emerald-700 border-b border-emerald-400 pb-1">
                        Datos del emisor / vendedor
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-6 text-[11px]">
                        <div>
                            <span className="font-bold text-slate-700">Razón Social: </span>
                            <span className="font-semibold">{data.issuer.companyName}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">País: </span>
                            <span>{data.issuer.country || "Colombia"}</span>
                        </div>
                        {data.issuer.tradeName && (
                            <div>
                                <span className="font-bold text-slate-700">Nombre Comercial: </span>
                                <span>{data.issuer.tradeName}</span>
                            </div>
                        )}
                        <div>
                            <span className="font-bold text-slate-700">Departamento: </span>
                            <span>{data.issuer.department || "Santander"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">NIT del Emisor: </span>
                            <span className="font-mono font-semibold">{data.issuer.nit}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Municipio / Ciudad: </span>
                            <span>{data.issuer.city || "Bucaramanga"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Tipo de Contribuyente: </span>
                            <span>{data.issuer.taxpayerType || "Persona Natural"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Dirección: </span>
                            <span>{data.issuer.address || "CL 12 # 19 - 18"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Régimen Fiscal: </span>
                            <span>{data.issuer.taxRegime || "R-99-PN"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Teléfono / Móvil: </span>
                            <span>{data.issuer.phone || "3153981340"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Responsabilidad tributaria: </span>
                            <span>{data.issuer.taxResponsibility || "ZZ - No aplica"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Correo: </span>
                            <span>{data.issuer.email || "contacto@legacymarksas.com"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Actividad Económica: </span>
                            <span>{data.issuer.economicActivity || "7310"}</span>
                        </div>
                    </div>
                </div>

                {/* 3. DATOS DEL ADQUIRIENTE / COMPRADOR */}
                <div className="space-y-2">
                    <h3 className="font-bold text-sm text-emerald-700 border-b border-emerald-400 pb-1">
                        Datos del Adquiriente / Comprador
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-6 text-[11px]">
                        <div>
                            <span className="font-bold text-slate-700">Nombre o Razón Social: </span>
                            <span className="font-semibold">{data.buyer.name}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">País: </span>
                            <span>{data.buyer.country || "Colombia"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Tipo de Documento: </span>
                            <span>{data.buyer.documentType || "NIT"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Departamento: </span>
                            <span>{data.buyer.department || "Bogotá"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Número Documento: </span>
                            <span className="font-mono font-semibold">{data.buyer.documentNumber}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Municipio / Ciudad: </span>
                            <span>{data.buyer.city || "Bogotá, D.C."}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Tipo de Contribuyente: </span>
                            <span>{data.buyer.taxpayerType || "Persona Jurídica"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Dirección: </span>
                            <span>{data.buyer.address || "CRRA 55A 30 IN ED CENTAURIO"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Régimen fiscal: </span>
                            <span>{data.buyer.taxRegime || "O-47;R-99-PN"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Teléfono / Móvil: </span>
                            <span>{data.buyer.phone || "3173720384"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Responsabilidad tributaria: </span>
                            <span>{data.buyer.taxResponsibility || "01 - IVA"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Correo: </span>
                            <span>{data.buyer.email || "gerencia@neogestion.co"}</span>
                        </div>
                    </div>
                </div>

                {/* 4. DETALLES DE PRODUCTOS (TABLA DE ÍTEMS CON ESTILO DIAN) */}
                <div className="space-y-2">
                    <h3 className="font-bold text-sm text-emerald-700 border-b border-emerald-400 pb-1">
                        Detalles de Productos
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[10px] text-left border-collapse border border-emerald-300">
                            <thead>
                                <tr className="bg-emerald-50 text-slate-800 font-bold border-b border-emerald-300">
                                    <th className="p-1.5 border-r border-emerald-300 text-center">Nro.</th>
                                    <th className="p-1.5 border-r border-emerald-300 text-center">Código</th>
                                    <th className="p-1.5 border-r border-emerald-300">Descripción</th>
                                    <th className="p-1.5 border-r border-emerald-300 text-center">U/M</th>
                                    <th className="p-1.5 border-r border-emerald-300 text-center">Cantidad</th>
                                    <th className="p-1.5 border-r border-emerald-300 text-right">Precio unitario</th>
                                    <th className="p-1.5 border-r border-emerald-300 text-right">Descuento detalle</th>
                                    <th className="p-1.5 border-r border-emerald-300 text-right">Recargo detalle</th>
                                    <th className="p-1.5 border-r border-emerald-300 text-center bg-emerald-100/60">IVA %</th>
                                    <th className="p-1.5 border-r border-emerald-300 text-center bg-emerald-100/60">INC %</th>
                                    <th className="p-1.5 text-right font-black bg-emerald-100/80">Valor de Venta por Item</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((it) => (
                                    <tr key={it.nro} className="border-b border-slate-200">
                                        <td className="p-1.5 border-r border-emerald-200 text-center font-mono">{it.nro}</td>
                                        <td className="p-1.5 border-r border-emerald-200 text-center font-mono">{it.code}</td>
                                        <td className="p-1.5 border-r border-emerald-200 font-medium uppercase">{it.description}</td>
                                        <td className="p-1.5 border-r border-emerald-200 text-center font-mono">{it.unitOfMeasure || "WSD"}</td>
                                        <td className="p-1.5 border-r border-emerald-200 text-center font-mono">{it.quantity.toFixed(2)}</td>
                                        <td className="p-1.5 border-r border-emerald-200 text-right font-mono">{fmtCOP(it.unitPrice)}</td>
                                        <td className="p-1.5 border-r border-emerald-200 text-right font-mono">{fmtCOP(it.discountDetail || 0)}</td>
                                        <td className="p-1.5 border-r border-emerald-200 text-right font-mono">{fmtCOP(it.surchargeDetail || 0)}</td>
                                        <td className="p-1.5 border-r border-emerald-200 text-center font-mono">{it.ivaPct ? `${it.ivaPct}%` : ""}</td>
                                        <td className="p-1.5 border-r border-emerald-200 text-center font-mono">{it.incPct ? `${it.incPct}%` : ""}</td>
                                        <td className="p-1.5 text-right font-mono font-bold">{fmtCOP(it.totalItemValue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 5. REFERENCIAS (NOTAS CRÉDITO O FACTURA PREVIA) */}
                {data.references && data.references.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="font-bold text-sm text-emerald-700 border-b border-emerald-400 pb-1">
                            Referencias
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-[10px] text-left border-collapse border border-emerald-200">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-800 font-bold border-b border-emerald-200">
                                        <th className="p-1.5 border-r border-emerald-200">Tipo de Documento Referencia</th>
                                        <th className="p-1.5 border-r border-emerald-200">Número Referencia</th>
                                        <th className="p-1.5 border-r border-emerald-200">Fecha Referencia</th>
                                        <th className="p-1.5">Razón de Referencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.references.map((ref, idx) => (
                                        <tr key={idx} className="border-b border-slate-200">
                                            <td className="p-1.5 border-r border-emerald-200">{ref.type}</td>
                                            <td className="p-1.5 border-r border-emerald-200 font-mono font-semibold">{ref.number}</td>
                                            <td className="p-1.5 border-r border-emerald-200">{ref.date}</td>
                                            <td className="p-1.5 uppercase font-medium">{ref.reason || "N/A"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 6. NOTAS FINALES Y TOTALES */}
                <div className="space-y-2 pt-2">
                    <h3 className="font-bold text-sm text-emerald-700 border-b border-emerald-400 pb-1">
                        Notas Finales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="text-[10px] text-slate-600 space-y-1">
                            <p><span className="font-bold">Linea de negocio:</span> {data.notes || "Venta Directa de Servicios & Productos LegacyMark"}</p>
                            <div className="p-2 border border-slate-200 rounded bg-slate-50 flex items-center gap-3">
                                <QrCode className="w-12 h-12 text-slate-800 shrink-0" />
                                <div className="space-y-0.5">
                                    <p className="font-bold text-[9px] text-slate-800">Documento Firmado Digitalmente por la DIAN</p>
                                    <p className="text-[8px] font-mono break-all text-slate-500">{data.cufeOrCude.substring(0, 48)}...</p>
                                </div>
                            </div>
                        </div>

                        <div className="border border-emerald-300 rounded p-3 bg-emerald-50/50 space-y-1.5 text-xs text-right font-mono">
                            <div className="flex justify-between">
                                <span className="text-slate-600 font-sans">Subtotal</span>
                                <span>{fmtCOP(data.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 font-sans">Impuestos (IVA 19%)</span>
                                <span>{fmtCOP(data.taxTotal)}</span>
                            </div>
                            {data.discountTotal > 0 && (
                                <div className="flex justify-between text-emerald-700 font-sans">
                                    <span>Descuento Aplicado</span>
                                    <span>-{fmtCOP(data.discountTotal)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-emerald-300">
                                <span className="font-sans">VALOR TOTAL</span>
                                <span className="text-emerald-700">{fmtCOP(data.grandTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
