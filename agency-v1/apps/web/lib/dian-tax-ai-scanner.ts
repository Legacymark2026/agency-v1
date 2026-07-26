/**
 * MOTOR AI DE ESCANEO DE RIESGO TRIBUTARIO & AUDITORÍA PREVENTIVA DIAN (COLOMBIA 2026)
 */

export interface TaxAuditCheckResult {
    score: number; // 0 a 100
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    warnings: string[];
    recommendations: string[];
    taxSavingsEstimate: number;
}

export function runDianTaxAuditScan(data: {
    totalInvoicedMonth: number;
    totalPurchasesMonth: number;
    totalPayrollMonth: number;
    hasActiveCertificate: boolean;
    technicalKeyLength: number;
    uvtValue: number;
}): TaxAuditCheckResult {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let score = 100;
    let taxSavingsEstimate = 0;

    // 1. Verificación Certificado Digital XAdES-BES
    if (!data.hasActiveCertificate) {
        score -= 40;
        warnings.push("No se detectó Firma Digital XAdES-BES activa. Las facturas transmitidas serán rechazadas por la DIAN (Error 99).");
        recommendations.push("Cargue su Certificado Digital (.pfx / .p12) en Configuración DIAN.");
    }

    // 2. Verificación Clave Técnica (64 Caracteres Hex)
    if (data.technicalKeyLength !== 64) {
        score -= 30;
        warnings.push("La Clave Técnica de Facturación no cumple con la longitud de 64 caracteres Hex (SHA-384).");
        recommendations.push("Copie la Clave Técnica exacta desde la plataforma Muisca de la DIAN.");
    }

    // 3. Verificación de Límite UVT de Compras (Base Retefuente Compras = 27 UVT = $1.344.573 COP)
    const baseComprasUvt = 27 * data.uvtValue;
    if (data.totalPurchasesMonth > baseComprasUvt) {
        taxSavingsEstimate += data.totalPurchasesMonth * 0.025; // 2.5% de Retefuente legal
        recommendations.push(`Aplica Retención en la Fuente del 2.5% sobre compras superiores a 27 UVT ($${baseComprasUvt.toLocaleString("es-CO")}).`);
    }

    // 4. Verificación de Margen Operativo & IVA
    const estimacionIvaAPagar = (data.totalInvoicedMonth - data.totalPurchasesMonth) * 0.19;
    if (estimacionIvaAPagar > 0) {
        recommendations.push(`Proyección estimada de saldo a pagar de IVA 19%: $${estimacionIvaAPagar.toLocaleString("es-CO")} COP.`);
    }

    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    if (score < 60) riskLevel = "HIGH";
    else if (score < 85) riskLevel = "MEDIUM";

    return {
        score,
        riskLevel,
        warnings,
        recommendations,
        taxSavingsEstimate,
    };
}
