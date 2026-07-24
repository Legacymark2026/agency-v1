"use client";

import React from "react";
import { Printer, ShieldCheck, QrCode, Download } from "lucide-react";

export interface DianInvoiceData {
    documentType?: "FACTURA_ELECTRONICA" | "NOTA_CREDITO" | "NOTA_DEBITO";
    documentNumber: string;
    cufeOrCude: string;
    issueDate: string;
    dueDate?: string;
    paymentForm?: string; // Contado / Crédito
    paymentMethod?: string; // Transferencia Débito Bancaria, Efectivo
    operationType?: string; // 10 - Estándar, 20 - Nota Crédito
    purchaseOrder?: string; // DESARROLLO DE BRANDING
    purchaseOrderDate?: string; // 22/05/2026

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
        logoUrl?: string;
        slogan?: string;
        certifications?: string;
        pqrPhone?: string;
        pqrEmail?: string;
        sellerName?: string;
        legalFooterText?: string;
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
    businessLine?: string;
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
        : "FACTURA ELECTRÓNICA DE VENTA";

    const cufeLabel = isCreditNote
        ? "Código Único de documento electrónico - CUDE :"
        : "Código Único de Factura - CUFE :";

    const fmtCOP = (num: number) => {
        return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 2 }).format(num);
    };

    const handleDownloadXml = () => {
        const xmlStr = `<?xml version="1.0" encoding="UTF-8"?><Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"><cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID><cbc:ID>${data.documentNumber}</cbc:ID><cbc:UUID>${data.cufeOrCude}</cbc:UUID><cbc:IssueDate>${data.issueDate}</cbc:IssueDate></Invoice>`;
        const blob = new Blob([xmlStr], { type: "application/xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Factura_DIAN_${data.documentNumber}_UBL21.xml`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleVerifyDianPortal = () => {
        window.open(`https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${data.cufeOrCude}`, "_blank");
    };

    return (
        <div className="bg-slate-950 text-slate-900 font-sans p-2 md:p-6 min-h-screen flex flex-col items-center">
            {/* ACTION BAR (HIDDEN IN PRINT) */}
            <div className="w-full max-w-4xl mb-4 flex flex-col sm:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl text-white gap-3 print:hidden">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                        <span className="font-bold text-sm block">Representación Gráfica Oficial DIAN (Anexo 1.8)</span>
                        <span className="text-[11px] text-slate-400 font-mono">CUFE: {data.cufeOrCude.substring(0, 32)}...</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleVerifyDianPortal}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                        <QrCode className="w-3.5 h-3.5" /> Consultar DIAN
                    </button>
                    <button
                        onClick={handleDownloadXml}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5 text-emerald-400" /> XML UBL 2.1
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all"
                        >
                            Cerrar
                        </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                        <Printer className="w-4 h-4" /> Imprimir A4
                    </button>
                </div>
            </div>

            {/* A4 PRINTABLE DOCUMENT CONTAINER (EXACT DIAN FORMAT MATCHING CARLIXPLAST SAMPLE) */}
            <div
                id="dian-printable-document"
                className="w-full max-w-4xl bg-white text-slate-900 p-6 md:p-8 shadow-2xl rounded-sm font-sans text-xs space-y-4 print:p-0 print:shadow-none print:w-full print:max-w-none border border-slate-300"
            >
                {/* 1. TOP HEADER SECTION WITH LOGO, CERTIFICATIONS, ADDRESS & DIAN RESOLUTION BOX */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-3 border-b-2 border-slate-800 items-start">
                    {/* LOGO & COMPANY INFO (LEFT) */}
                    <div className="md:col-span-5 space-y-1">
                        <div className="flex items-center gap-3">
                            {data.issuer.logoUrl ? (
                                <img src={data.issuer.logoUrl} alt={data.issuer.companyName} className="max-h-16 max-w-[180px] object-contain" />
                            ) : (
                                <div className="text-xl font-black text-indigo-900 tracking-tighter uppercase">
                                    {data.issuer.companyName}
                                </div>
                            )}
                            {data.issuer.certifications && (
                                <div className="text-[8px] bg-slate-100 p-1 border rounded border-slate-300 font-mono text-slate-600">
                                    {data.issuer.certifications}
                                </div>
                            )}
                        </div>
                        {data.issuer.slogan && (
                            <p className="text-[10px] text-teal-700 font-bold italic">{data.issuer.slogan}</p>
                        )}
                        <h2 className="font-extrabold text-xs uppercase tracking-tight">{data.issuer.companyName}</h2>
                        <p className="font-mono text-[10.5px] font-bold text-slate-800">NIT. {data.issuer.nit}</p>
                        <div className="text-[9.5px] text-slate-600 space-y-0.5 font-medium leading-tight">
                            <p>{data.issuer.taxResponsibility || "Responsable de IVA"}</p>
                            <p>Actividad Económica {data.issuer.economicActivity || "2221"}</p>
                            <p>{data.issuer.legalFooterText || "Somos Grandes Contribuyentes de ICA en Bucaramanga"}</p>
                        </div>
                    </div>

                    {/* CUSTOMER SERVICE & ADDRESSES (CENTER) */}
                    <div className="md:col-span-4 text-center space-y-0.5 text-[10px] text-slate-700 font-medium border-x md:border-slate-200 md:px-2 pt-1">
                        <h3 className="font-bold text-xs text-slate-900 mb-1">Atención al Cliente</h3>
                        <p>factura - {data.issuer.pqrEmail || data.issuer.email || "facturacion@carlixplast.com"}</p>
                        <p className="font-bold">{data.issuer.pqrPhone || "PQR - 3123010693"}</p>
                        <p>Principal - {data.issuer.address || "Calle 33 No. 11-83 - 3102305941"}</p>
                        <p>Sucursal - {data.issuer.city || "Bucaramanga"} - {data.issuer.country || "Colombia"}</p>
                    </div>

                    {/* DIAN RESOLUTION & INVOICE NUMBER BOX (RIGHT) */}
                    <div className="md:col-span-3 text-right space-y-2">
                        <div className="text-[8.5px] text-slate-600 font-mono leading-tight">
                            <p>Resolucion DIAN No. 18764105721229 Vigencia 10/FEB/2026 a 10/FEB/2028</p>
                            <p>Numeracion Electronica del FE-300001 al FE-400000</p>
                        </div>

                        <div className="bg-slate-50 border-2 border-indigo-900 rounded-xl p-2.5 text-center space-y-0.5 shadow-sm">
                            <span className="text-[10px] font-extrabold uppercase text-slate-800 tracking-wider block">
                                FACTURA ELECTRÓNICA DE VENTA
                            </span>
                            <span className="text-base font-black text-indigo-950 font-mono block tracking-tight">
                                {data.documentNumber}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. DATES & PAYMENT METADATA BAR */}
                <div className="grid grid-cols-3 gap-2 text-[10.5px] font-bold border-b border-slate-300 pb-2">
                    <div>
                        <span className="text-slate-500 font-normal">FECHA HORA EXP: </span>
                        <span>{data.issueDate}</span>
                    </div>
                    <div className="text-center">
                        <span className="text-slate-500 font-normal">VENC: </span>
                        <span>{data.dueDate || data.issueDate}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-slate-500 font-normal">FORMA DE PAGO: </span>
                        <span>{data.paymentForm || "Contado"}</span>
                    </div>
                </div>

                {/* 3. PURCHASER BOX (TABLA DE DATOS DEL COMPRADOR / ADQUIRENTE) */}
                <div className="border border-slate-800 text-[10px]">
                    <div className="grid grid-cols-12 border-b border-slate-800 bg-slate-50 p-1.5 font-semibold">
                        <div className="col-span-4">
                            <span className="text-slate-500 font-bold block text-[9px]">SEÑOR(ES)</span>
                            <span className="font-extrabold text-slate-900 uppercase">{data.buyer.name}</span>
                        </div>
                        <div className="col-span-2 border-l border-slate-300 pl-2">
                            <span className="text-slate-500 font-bold block text-[9px]">C.C/Nit</span>
                            <span className="font-mono font-bold text-slate-900">{data.buyer.documentNumber}</span>
                        </div>
                        <div className="col-span-3 border-l border-slate-300 pl-2">
                            <span className="text-slate-500 font-bold block text-[9px]">EMAIL</span>
                            <span className="font-medium text-slate-900">{data.buyer.email || "gerencia@neogestion.co"}</span>
                        </div>
                        <div className="col-span-3 border-l border-slate-300 pl-2">
                            <span className="text-slate-500 font-bold block text-[9px]">MEDIO DE PAGO</span>
                            <span className="font-bold text-slate-900">{data.paymentMethod || "CONSIGNACIÓN"}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 p-1.5">
                        <div className="col-span-4">
                            <span className="text-slate-500 font-bold block text-[9px]">Dirección</span>
                            <span>{data.buyer.address || "CALLE 15 3 4-47"}</span>
                        </div>
                        <div className="col-span-2 border-l border-slate-300 pl-2">
                            <span className="text-slate-500 font-bold block text-[9px]">TEL</span>
                            <span className="font-mono">{data.buyer.phone || "3124272175"}</span>
                        </div>
                        <div className="col-span-2 border-l border-slate-300 pl-2">
                            <span className="text-slate-500 font-bold block text-[9px]">CIUDAD</span>
                            <span>{data.buyer.city || "TOLEDO"}</span>
                        </div>
                        <div className="col-span-2 border-l border-slate-300 pl-2">
                            <span className="text-slate-500 font-bold block text-[9px]">SOLICITUD</span>
                            <span>-</span>
                        </div>
                        <div className="col-span-2 border-l border-slate-300 pl-2">
                            <span className="text-slate-500 font-bold block text-[9px]">O.C.</span>
                            <span>{data.purchaseOrder || "-"}</span>
                        </div>
                    </div>
                </div>

                {/* 4. ITEMS TABLE (TABLA DE PRODUCTOS CARLIXPLAST FORMAT) */}
                <div className="border border-slate-800">
                    <table className="w-full text-[10px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-100 font-bold text-slate-900 uppercase">
                                <th className="p-1.5 border-r border-slate-300 text-center w-8">#</th>
                                <th className="p-1.5 border-r border-slate-300">CODIGO</th>
                                <th className="p-1.5 border-r border-slate-300 text-center">CANTIDAD</th>
                                <th className="p-1.5 border-r border-slate-300">DESCRIPCION</th>
                                <th className="p-1.5 border-r border-slate-300 text-right">VALOR UNITARIO</th>
                                <th className="p-1.5 text-right font-black">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((it, idx) => (
                                <tr key={it.nro || idx} className="border-b border-slate-200">
                                    <td className="p-1.5 border-r border-slate-200 text-center font-mono">{it.nro || idx + 1}</td>
                                    <td className="p-1.5 border-r border-slate-200 font-mono text-[9.5px] font-bold">{it.code}</td>
                                    <td className="p-1.5 border-r border-slate-200 text-center font-mono font-bold">
                                        {it.quantity.toFixed(2)} {it.unitOfMeasure || "UND"}
                                    </td>
                                    <td className="p-1.5 border-r border-slate-200 font-medium uppercase text-[9.5px]">
                                        {it.description}
                                    </td>
                                    <td className="p-1.5 border-r border-slate-200 text-right font-mono">{fmtCOP(it.unitPrice)}</td>
                                    <td className="p-1.5 text-right font-mono font-bold">{fmtCOP(it.totalItemValue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="bg-slate-50 p-1 border-t border-slate-800 text-[9.5px] font-bold text-slate-700">
                        Items: {data.items.length}
                    </div>
                </div>

                {/* 5. PURCHASER SIGNATURE & TOTALS SECTION */}
                <div className="grid grid-cols-12 gap-3 pt-1">
                    {/* VENDEDOR & FIRMA COMPRADOR (LEFT & CENTER) */}
                    <div className="col-span-8 border border-slate-800 rounded p-2.5 space-y-3 flex flex-col justify-between text-[9.5px]">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="font-bold text-slate-700">VENDEDOR: </span>
                                <span className="font-extrabold">{data.issuer.sellerName || "WILSON TAPIA 8 GONZALEZ"}</span>
                            </div>
                            <div>
                                <span className="font-bold text-slate-700">Celular: </span>
                                <span>3123010693</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-300">
                            <p className="text-[8px] text-slate-600 italic leading-tight mb-3">
                                Con la presente se hace constar que las mercancías descritas en el presente título valor fueron recibidas a entera satisfacción por quien aparece firmando este documento en nombre del comprador.
                            </p>
                            <div className="border-t border-slate-900 pt-0.5 text-center font-bold uppercase text-[9px] tracking-wider text-slate-800">
                                COMPRADOR (FIRMA Y SELLO)
                            </div>
                        </div>
                    </div>

                    {/* TOTALS BOX (RIGHT) */}
                    <div className="col-span-4 border border-slate-800 rounded p-2 bg-slate-50 space-y-1 text-xs font-mono">
                        <div className="flex justify-between text-slate-700">
                            <span>Subtotal:</span>
                            <span className="font-bold text-slate-900">{fmtCOP(data.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                            <span>Retefuente:</span>
                            <span className="font-bold text-slate-900">{fmtCOP(data.withholdingTax || 0)}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                            <span>I.V.A.:</span>
                            <span className="font-bold text-slate-900">{fmtCOP(data.taxTotal)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-800 pt-1 font-extrabold text-sm text-slate-950">
                            <span>Total:</span>
                            <span>{fmtCOP(data.grandTotal || data.totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* 6. DIAN LEGAL STATEMENT, CUFE, QR CODE & FOOTER */}
                <div className="space-y-2 pt-1 border-t border-slate-800">
                    <div className="border border-slate-800 p-1.5 rounded text-[8px] text-center font-mono uppercase font-semibold leading-tight text-slate-700">
                        ESTA FACTURA, PARA ASPECTOS COMERCIALES, SE ASIMILA EN TODOS SUS EFECTOS A LA LETRA DE CAMBIO (ART. 772, 773, 774 Y SIGUIENTES DEL CODIGO DE COMERCIO Y DEMAS NORMAS CONCORDANTES DEL CÓDIGO DE COMERCIO Y CÓDIGO PENAL COLOMBIANO)
                    </div>

                    <div className="grid grid-cols-12 gap-3 items-center">
                        {/* QR CODE */}
                        <div className="col-span-2 flex justify-center">
                            <QrCode className="w-16 h-16 text-slate-950" />
                        </div>

                        {/* CUFE & FIRMA DIGITAL */}
                        <div className="col-span-10 space-y-1 text-[9px] font-mono leading-tight">
                            <div>
                                <span className="font-bold text-slate-900 block">{cufeLabel}:</span>
                                <span className="break-all text-[8.5px] font-bold text-slate-800 block">
                                    {data.cufeOrCude}
                                </span>
                            </div>
                            <div>
                                <span className="font-bold text-slate-900 block">Firma Digital:</span>
                                <span className="break-all text-[7.5px] text-slate-600 block">
                                    kZdF+NJAXTbzct44lIy5AvJ2UAH9wnJMNLZo0Itthgp4MukIIUnMWuHqbo/hz9w3bB5AlN1ssm+sLXd4pst4I4llgvhLRYy1O539zbOMLl1wvKfnJn4XLn
                                </span>
                            </div>
                            <div className="flex justify-between text-[9px] font-sans font-bold text-slate-800 pt-0.5">
                                <span>Fecha Validación Dian: {data.issueDate}</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-center text-[8.5px] font-bold uppercase tracking-tight text-slate-700 border-t border-slate-300 pt-1">
                        PARA CAMBIO SUMINISTRAR SU NUMERO DE IDENTIFICACION ANTE 8 DE 30 DIA. Aplican condiciones de cambio. SOMOS GRANDES CONTRIBUYENTES DE ICA EN BUCARAMANGA SEGUN RESOLUCION 3331 DEL 18 DE ABRIL DE 2022. FACTURA IMPRESA POR {data.issuer.companyName} NIT {data.issuer.nit}
                    </div>
                </div>
            </div>
        </div>
    );
}
