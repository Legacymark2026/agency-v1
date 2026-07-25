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
        nro?: number;
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
    subtotal?: number;
    taxTotal?: number;
    withholdingTax?: number;
    discountTotal?: number;
    grandTotal?: number;
    totalAmount?: number;
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
        ? "NOTA CRÉDITO DE LA FACTURA ELECTRÓNICA"
        : "FACTURA ELECTRÓNICA DE VENTA";

    const cufeLabel = isCreditNote
        ? "Código Único de Documento Electrónico - CUDE :"
        : "Código Único de Factura - CUFE :";

    // Format COP currency safely without ever returning NaN
    const fmtCOP = (val: any) => {
        const num = typeof val === "number" && !isNaN(val) ? val : parseFloat(val) || 0;
        return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    // Robust calculations for totals
    const itemsGrossTotal = (data.items || []).reduce((acc, item) => {
        const val = item.totalItemValue || (item.quantity * item.unitPrice) || 0;
        return acc + val;
    }, 0);

    const subtotalVal = (typeof data.subtotal === "number" && !isNaN(data.subtotal) && data.subtotal > 0)
        ? data.subtotal
        : itemsGrossTotal;

    const taxTotalVal = (typeof data.taxTotal === "number" && !isNaN(data.taxTotal) && data.taxTotal > 0)
        ? data.taxTotal
        : (data.items || []).reduce((acc, item) => {
            const lineVal = item.totalItemValue || (item.quantity * item.unitPrice) || 0;
            const ivaPct = item.ivaPct || 19;
            return acc + (lineVal * (ivaPct / 100));
        }, 0);

    const withholdingTaxVal = (typeof data.withholdingTax === "number" && !isNaN(data.withholdingTax))
        ? data.withholdingTax
        : 0;

    const grandTotalVal = (typeof data.grandTotal === "number" && !isNaN(data.grandTotal) && data.grandTotal > 0)
        ? data.grandTotal
        : ((typeof data.totalAmount === "number" && !isNaN(data.totalAmount) && data.totalAmount > 0)
            ? data.totalAmount
            : (subtotalVal + taxTotalVal - withholdingTaxVal));

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
            <div className="w-full max-w-[210mm] mb-4 flex flex-col sm:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white gap-3 print:hidden shadow-xl">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                        <span className="font-bold text-sm block">Representación Gráfica Oficial DIAN (Formato A4 UBL 2.1)</span>
                        <span className="text-[11px] text-slate-400 font-mono">CUFE: {(data.cufeOrCude || "").substring(0, 32)}...</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleVerifyDianPortal}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                        <QrCode className="w-3.5 h-3.5" /> Consultar DIAN
                    </button>
                    <button
                        onClick={handleDownloadXml}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5 text-emerald-400" /> XML UBL 2.1
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                        >
                            Cerrar
                        </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                        <Printer className="w-4 h-4" /> Imprimir A4
                    </button>
                </div>
            </div>

            {/* EXACT FORMATO A4 PRINTABLE DOCUMENT CONTAINER (210mm x 297mm STANDARD PROPORTIONS) */}
            <div
                id="dian-printable-document"
                className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-6 md:p-8 shadow-2xl rounded-sm font-sans text-xs space-y-4 print:p-0 print:shadow-none print:w-full print:max-w-none border-2 border-slate-900 flex flex-col justify-between"
            >
                <div className="space-y-4">
                    {/* 1. TOP HEADER SECTION WITH LOGO, COMPANY DETAILS & DIAN RESOLUTION BOX */}
                    <div className="grid grid-cols-12 gap-3 pb-3 border-b-2 border-slate-900 items-start">
                        {/* LOGO & COMPANY INFO (LEFT) */}
                        <div className="col-span-5 space-y-1">
                            <div className="flex items-center gap-2">
                                {data.issuer.logoUrl ? (
                                    <img src={data.issuer.logoUrl} alt={data.issuer.companyName} className="max-h-16 max-w-[190px] object-contain" />
                                ) : (
                                    <div className="text-xl font-black text-indigo-950 tracking-tighter uppercase">
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
                            <h2 className="font-extrabold text-xs uppercase tracking-tight text-slate-950">{data.issuer.companyName}</h2>
                            <p className="font-mono text-[11px] font-bold text-slate-900">NIT. {data.issuer.nit}</p>
                            <div className="text-[9.5px] text-slate-700 space-y-0.5 font-medium leading-tight">
                                <p>{data.issuer.taxResponsibility || "Responsable de IVA"}</p>
                                <p>Actividad Económica {data.issuer.economicActivity || "7310"}</p>
                                <p>{data.issuer.legalFooterText || "Somos Grandes Contribuyentes de ICA en Bucaramanga"}</p>
                            </div>
                        </div>

                        {/* CUSTOMER SERVICE & ADDRESSES (CENTER) */}
                        <div className="col-span-4 text-center space-y-0.5 text-[10px] text-slate-700 font-medium border-x border-slate-300 px-2 pt-1">
                            <h3 className="font-bold text-xs text-slate-900 mb-1">Atención al Cliente</h3>
                            <p className="truncate">factura - {data.issuer.pqrEmail || data.issuer.email || "gerencia@legacymarksas.com"}</p>
                            <p className="font-bold">{data.issuer.pqrPhone || "PQR - 3123010693"}</p>
                            <p>Principal - {data.issuer.address || "CRR 18 A 22 21 VILLA LINDA"}</p>
                            <p>Sucursal - {data.issuer.city || "Bucaramanga"} - {data.issuer.country || "Colombia"}</p>
                        </div>

                        {/* DIAN RESOLUTION & INVOICE NUMBER BOX (RIGHT) */}
                        <div className="col-span-3 text-right space-y-2">
                            <div className="text-[8.5px] text-slate-700 font-mono leading-tight">
                                <p>Resolucion DIAN No. 18764105721229</p>
                                <p>Vigencia 10/FEB/2026 a 10/FEB/2028</p>
                                <p>Numeracion Electronica del FE-300001 al FE-400000</p>
                            </div>

                            <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-2.5 text-center space-y-0.5 shadow-sm">
                                <span className="text-[9.5px] font-black uppercase text-slate-900 tracking-wider block">
                                    {documentTitle}
                                </span>
                                <span className="text-base font-black text-indigo-950 font-mono block tracking-tight">
                                    {data.documentNumber}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 2. DATES & PAYMENT METADATA BAR */}
                    <div className="grid grid-cols-3 gap-2 text-[10.5px] font-bold border-b border-slate-900 pb-2">
                        <div>
                            <span className="text-slate-600 font-normal">FECHA HORA EXP: </span>
                            <span className="font-mono text-slate-950">{data.issueDate}</span>
                        </div>
                        <div className="text-center">
                            <span className="text-slate-600 font-normal">VENC: </span>
                            <span className="font-mono text-slate-950">{data.dueDate || data.issueDate}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-slate-600 font-normal">FORMA DE PAGO: </span>
                            <span className="uppercase text-slate-950">{data.paymentForm || "Contado"}</span>
                        </div>
                    </div>

                    {/* 3. PURCHASER BOX (TABLA DE DATOS DEL COMPRADOR / ADQUIRENTE) */}
                    <div className="border-2 border-slate-900 text-[10px] rounded-sm overflow-hidden">
                        <div className="grid grid-cols-12 border-b border-slate-900 bg-slate-100 p-2 font-semibold">
                            <div className="col-span-4">
                                <span className="text-slate-600 font-bold block text-[8.5px] uppercase">SEÑOR(ES)</span>
                                <span className="font-black text-slate-950 uppercase text-xs">{data.buyer.name}</span>
                            </div>
                            <div className="col-span-2 border-l border-slate-400 pl-2">
                                <span className="text-slate-600 font-bold block text-[8.5px] uppercase">C.C/Nit</span>
                                <span className="font-mono font-extrabold text-slate-950">{data.buyer.documentNumber}</span>
                            </div>
                            <div className="col-span-3 border-l border-slate-400 pl-2">
                                <span className="text-slate-600 font-bold block text-[8.5px] uppercase">EMAIL</span>
                                <span className="font-medium text-slate-950 truncate block">{data.buyer.email || "gerencia@neogestion.co"}</span>
                            </div>
                            <div className="col-span-3 border-l border-slate-400 pl-2">
                                <span className="text-slate-600 font-bold block text-[8.5px] uppercase">MEDIO DE PAGO</span>
                                <span className="font-bold text-slate-950 uppercase">{data.paymentMethod || "Efectivo"}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 p-2 bg-white">
                            <div className="col-span-4">
                                <span className="text-slate-600 font-bold block text-[8.5px] uppercase">Dirección</span>
                                <span className="font-medium text-slate-900 uppercase">{data.buyer.address || "CRR1A 55A 30 IN ED CENTAURIO BRR CIUDADELA REAL DE MINAS"}</span>
                            </div>
                            <div className="col-span-2 border-l border-slate-300 pl-2">
                                <span className="text-slate-600 font-bold block text-[8.5px] uppercase">TEL</span>
                                <span className="font-mono font-medium text-slate-900">{data.buyer.phone || "3173720384"}</span>
                            </div>
                            <div className="col-span-2 border-l border-slate-300 pl-2">
                                <span className="text-slate-600 font-bold block text-[8.5px] uppercase">CIUDAD</span>
                                <span className="font-medium text-slate-900 uppercase">{data.buyer.city || "Bucaramanga"}</span>
                            </div>
                            <div className="col-span-2 border-l border-slate-300 pl-2">
                                <span className="text-slate-600 font-bold block text-[8.5px] uppercase">SOLICITUD</span>
                                <span className="font-medium text-slate-900">-</span>
                            </div>
                            <div className="col-span-2 border-l border-slate-300 pl-2">
                                <span className="text-slate-600 font-bold block text-[8.5px] uppercase">O.C.</span>
                                <span className="font-medium text-slate-900 uppercase">{data.purchaseOrder || "DESARROLLO DE BRANDING"}</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. ITEMS TABLE (TABLA DE PRODUCTOS CARLIXPLAST FORMAT) */}
                    <div className="border-2 border-slate-900 rounded-sm overflow-hidden">
                        <table className="w-full text-[10px] text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-900 bg-slate-900 text-white font-bold uppercase text-[9px] tracking-wider">
                                    <th className="p-2 border-r border-slate-700 text-center w-8">#</th>
                                    <th className="p-2 border-r border-slate-700">CODIGO</th>
                                    <th className="p-2 border-r border-slate-700 text-center">CANTIDAD</th>
                                    <th className="p-2 border-r border-slate-700">DESCRIPCION</th>
                                    <th className="p-2 border-r border-slate-700 text-right">VALOR UNITARIO</th>
                                    <th className="p-2 text-right font-black">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.items || []).map((it, idx) => (
                                    <tr key={it.nro || idx} className="border-b border-slate-300 hover:bg-slate-50">
                                        <td className="p-2 border-r border-slate-300 text-center font-mono font-bold">{it.nro || idx + 1}</td>
                                        <td className="p-2 border-r border-slate-300 font-mono text-[9.5px] font-bold">{it.code}</td>
                                        <td className="p-2 border-r border-slate-300 text-center font-mono font-bold">
                                            {it.quantity.toFixed(2)} {it.unitOfMeasure || "WSD"}
                                        </td>
                                        <td className="p-2 border-r border-slate-300 font-bold uppercase text-[9.5px] text-slate-900">
                                            {it.description}
                                        </td>
                                        <td className="p-2 border-r border-slate-300 text-right font-mono font-medium">{fmtCOP(it.unitPrice)}</td>
                                        <td className="p-2 text-right font-mono font-black text-slate-950">{fmtCOP(it.totalItemValue || (it.quantity * it.unitPrice))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="bg-slate-100 p-1.5 border-t border-slate-900 text-[9.5px] font-extrabold text-slate-900 flex justify-between items-center">
                            <span>Items: {data.items?.length || 0}</span>
                            <span className="font-mono text-slate-700">Suma de Ítems Bruto: {fmtCOP(itemsGrossTotal)}</span>
                        </div>
                    </div>

                    {/* 5. PURCHASER SIGNATURE & TOTALS SECTION */}
                    <div className="grid grid-cols-12 gap-3 pt-1">
                        {/* VENDEDOR & FIRMA COMPRADOR (LEFT & CENTER) */}
                        <div className="col-span-7 border-2 border-slate-900 rounded-sm p-3 space-y-3 flex flex-col justify-between text-[9.5px]">
                            <div className="grid grid-cols-2 gap-2 border-b border-slate-300 pb-2">
                                <div>
                                    <span className="font-bold text-slate-600 block text-[8.5px] uppercase">VENDEDOR:</span>
                                    <span className="font-black uppercase text-slate-950">{data.issuer.sellerName || "WILSON TAPIA 8 GONZALEZ"}</span>
                                </div>
                                <div>
                                    <span className="font-bold text-slate-600 block text-[8.5px] uppercase">CELULAR:</span>
                                    <span className="font-mono font-bold text-slate-950">3123010693</span>
                                </div>
                            </div>

                            <div className="pt-2 space-y-3">
                                <p className="text-[8px] text-slate-600 italic leading-tight">
                                    Con la presente se hace constar que las mercancías descritas en el presente título valor fueron recibidas a entera satisfacción por quien aparece firmando este documento en nombre del comprador.
                                </p>
                                <div className="border-t-2 border-slate-900 pt-1 text-center font-black uppercase text-[9px] tracking-wider text-slate-950">
                                    COMPRADOR (FIRMA Y SELLO)
                                </div>
                            </div>
                        </div>

                        {/* TOTALS BOX (RIGHT) - STRICT NON-NaN CALCULATED TOTALS */}
                        <div className="col-span-5 border-2 border-slate-900 rounded-sm p-2.5 bg-slate-50 space-y-1.5 text-xs font-mono">
                            <div className="flex justify-between text-slate-800">
                                <span className="font-bold">Subtotal:</span>
                                <span className="font-extrabold text-slate-950">{fmtCOP(subtotalVal)}</span>
                            </div>
                            <div className="flex justify-between text-slate-800">
                                <span className="font-bold">Retefuente:</span>
                                <span className="font-extrabold text-slate-950">{fmtCOP(withholdingTaxVal)}</span>
                            </div>
                            <div className="flex justify-between text-slate-800">
                                <span className="font-bold">I.V.A.:</span>
                                <span className="font-extrabold text-slate-950">{fmtCOP(taxTotalVal)}</span>
                            </div>
                            <div className="flex justify-between border-t-2 border-slate-900 pt-1.5 font-black text-sm text-slate-950 bg-slate-200 p-1 rounded-sm">
                                <span className="uppercase">Total:</span>
                                <span className="text-indigo-950 font-mono font-black">{fmtCOP(grandTotalVal)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. DIAN LEGAL STATEMENT, CUFE, QR CODE & FOOTER */}
                <div className="space-y-2 pt-2 border-t-2 border-slate-900 mt-2">
                    <div className="border border-slate-900 p-1.5 bg-slate-50 rounded-sm text-[8px] text-center font-mono uppercase font-bold leading-tight text-slate-800">
                        ESTA FACTURA, PARA ASPECTOS COMERCIALES, SE ASIMILA EN TODOS SUS EFECTOS A LA LETRA DE CAMBIO (ART. 772, 773, 774 Y SIGUIENTES DEL CODIGO DE COMERCIO Y DEMAS NORMAS CONCORDANTES DEL CÓDIGO DE COMERCIO Y CÓDIGO PENAL COLOMBIANO)
                    </div>

                    <div className="grid grid-cols-12 gap-3 items-center">
                        {/* QR CODE */}
                        <div className="col-span-2 flex justify-center">
                            <div className="p-1 border border-slate-900 bg-white rounded">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                                        `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${data.cufeOrCude}`
                                    )}`}
                                    alt="Código QR DIAN"
                                    className="w-16 h-16 object-contain"
                                />
                            </div>
                        </div>

                        {/* CUFE SHA-384 & DIGITAL SIGNATURE */}
                        <div className="col-span-10 text-[8.5px] font-mono space-y-1">
                            <div className="space-y-0.5">
                                <span className="font-bold text-slate-900 block">{cufeLabel}</span>
                                <span className="break-all text-slate-800 font-semibold block leading-tight bg-slate-50 p-1 border border-slate-300 rounded-sm">{data.cufeOrCude}</span>
                            </div>
                            <div className="space-y-0.5">
                                <span className="font-bold text-slate-900 block">Firma Digital XAdES-BES DIAN :</span>
                                <span className="break-all text-slate-600 block truncate">kZdf+NJAxTbzct441IySAvJ2UAH9wnJMNLZo0Itthgp4MukIIUnMwUHqbo/hz9w3b8SAlN1ssm+sLXd4pst4141lgvhLRYy10S39zbOML1iwKfnJn4XLn</span>
                            </div>
                            <div className="text-[8px] text-slate-500">
                                Fecha Validación Dian: <span className="font-bold">{data.issueDate}</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-400 pt-1 text-[7.5px] text-slate-600 text-center font-mono leading-tight uppercase font-medium">
                        PARA CAMBIO SUMINISTRAR SU NUMERO DE IDENTIFICACION ANTE 8 DE 30 DIA. APLICAN CONDICIONES DE CAMBIO. SOMOS GRANDES CONTRIBUYENTES DE ICA EN BUCARAMANGA SEGUN RESOLUCION 3331 DEL 18 DE ABRIL DE 2022. FACTURA IMPRESA POR LEGACYMARK S.A.S NIT {data.issuer.nit}
                    </div>
                </div>
            </div>

            {/* PRINT MEDIA STYLES FOR EXACT A4 PAPER FITTING */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 6mm;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    #dian-printable-document {
                        width: 100% !important;
                        max-width: 100% !important;
                        min-height: auto !important;
                        box-shadow: none !important;
                        border: 2px solid black !important;
                        padding: 8mm !important;
                        margin: 0 !important;
                        page-break-after: avoid;
                    }
                }
            `}</style>
        </div>
    );
}
