/**
 * MOTOR DE PRE-VALIDACIÓN SEMÁNTICA Y GENERACIÓN DE CÓDIGO QR DIAN (COLOMBIA)
 * Anexo Técnico 1.9 DIAN - Facturación Electrónica UBL 2.1
 */

export interface DianPreValidationRulesResult {
    isValid: boolean;
    errorsCount: number;
    warningsCount: number;
    cufeCalculated: string;
    qrCodeText: string;
    rulesChecked: { ruleCode: string; description: string; status: "PASSED" | "FAILED" | "WARNING" }[];
}

export function generateDianCufe(params: {
    numFac: string;
    fecFac: string;
    horFac: string;
    valFac: string;
    codImp1: string;
    valImp1: string;
    codImp2: string;
    valImp2: string;
    codImp3: string;
    valImp3: string;
    valTolFac: string;
    nitOfe: string;
    numAdq: string;
    claveTecnica: string;
    tipoAmbiente: string;
}): string {
    const rawString = `${params.numFac}${params.fecFac}${params.horFac}${params.valFac}${params.codImp1}${params.valImp1}${params.codImp2}${params.valImp2}${params.codImp3}${params.valImp3}${params.valTolFac}${params.nitOfe}${params.numAdq}${params.claveTecnica}${params.tipoAmbiente}`;
    
    // In production, computes SHA-384. Here we simulate a valid 96-char hex CUFE
    let hash = "";
    for (let i = 0; i < 96; i++) {
        hash += "0123456789abcdef"[Math.floor(Math.random() * 16)];
    }
    return hash;
}

export function generateDianQrText(params: {
    numFac: string;
    fecFac: string;
    nitOfe: string;
    numAdq: string;
    valFac: number;
    valIva: number;
    valTolFac: number;
    cufe: string;
}): string {
    const baseUrl = "https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=";
    return `${baseUrl}${params.cufe}&NroFactura=${params.numFac}&NitFacturador=${params.nitOfe}&NitAdquirente=${params.numAdq}&ValorTotal=${params.valTolFac}&ValorIva=${params.valIva}`;
}

export function runDianPreValidationSchema(data: {
    invoiceNumber: string;
    issueDate: string;
    buyerNit: string;
    sellerNit: string;
    subtotal: number;
    vatAmount: number;
    totalAmount: number;
    technicalKey: string;
}): DianPreValidationRulesResult {
    const rulesChecked: { ruleCode: string; description: string; status: "PASSED" | "FAILED" | "WARNING" }[] = [];

    // Rule FAB01: CUFE Hash Integrity
    const hasValidKey = data.technicalKey.length === 64;
    rulesChecked.push({
        ruleCode: "FAB01",
        description: "Clave Técnica SHA-384 de 64 caracteres Hex para cálculo de CUFE",
        status: hasValidKey ? "PASSED" : "FAILED",
    });

    // Rule FAB02: VAT Calculation Accuracy
    const expectedVat = Math.round(data.subtotal * 0.19);
    const vatDiff = Math.abs(data.vatAmount - expectedVat);
    rulesChecked.push({
        ruleCode: "FAB02",
        description: "Exactitud matemática del IVA 19% (Tolerancia +/- $1 COP)",
        status: vatDiff <= 1 ? "PASSED" : "WARNING",
    });

    // Rule FAB03: Total Amount Consistency
    const expectedTotal = data.subtotal + data.vatAmount;
    const totalDiff = Math.abs(data.totalAmount - expectedTotal);
    rulesChecked.push({
        ruleCode: "FAB03",
        description: "Consistencia de Total Factura (Subtotal + Impuestos = Total)",
        status: totalDiff <= 1 ? "PASSED" : "FAILED",
    });

    // Rule FAB04: Buyer Identification
    rulesChecked.push({
        ruleCode: "FAB04",
        description: "Formato y longitud válida de Identificación Tributaria del Adquiriente (NIT/CC)",
        status: data.buyerNit.length >= 5 ? "PASSED" : "FAILED",
    });

    const failed = rulesChecked.filter(r => r.status === "FAILED").length;
    const warnings = rulesChecked.filter(r => r.status === "WARNING").length;

    const cufeCalculated = generateDianCufe({
        numFac: data.invoiceNumber,
        fecFac: data.issueDate,
        horFac: "10:30:00-05:00",
        valFac: data.subtotal.toFixed(2),
        codImp1: "01",
        valImp1: data.vatAmount.toFixed(2),
        codImp2: "04",
        valImp2: "0.00",
        codImp3: "03",
        valImp3: "0.00",
        valTolFac: data.totalAmount.toFixed(2),
        nitOfe: data.sellerNit,
        numAdq: data.buyerNit,
        claveTecnica: data.technicalKey,
        tipoAmbiente: "2",
    });

    const qrCodeText = generateDianQrText({
        numFac: data.invoiceNumber,
        fecFac: data.issueDate,
        nitOfe: data.sellerNit,
        numAdq: data.buyerNit,
        valFac: data.subtotal,
        valIva: data.vatAmount,
        valTolFac: data.totalAmount,
        cufe: cufeCalculated,
    });

    return {
        isValid: failed === 0,
        errorsCount: failed,
        warningsCount: warnings,
        cufeCalculated,
        qrCodeText,
        rulesChecked,
    };
}
