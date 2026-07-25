/**
 * MOTOR DE RETENCIÓN EN LA FUENTE Y RETENCIONES TRIBUTARIAS COLOMBIA (DIAN 2026)
 * Basado en el Estatuto Tributario (Art. 368, 383, 392, 401, 437-2, 911 ET)
 */

// Valor oficial de la Unidad de Valor Tributario (UVT) para Colombia
export const UVT_VALUE_2026 = 49799;

export type ColombianTransactionType =
    | "COMPRAS_GENERALES_DECLARANTE"
    | "COMPRAS_GENERALES_NO_DECLARANTE"
    | "SERVICIOS_GENERALES_DECLARANTE"
    | "SERVICIOS_GENERALES_NO_DECLARANTE"
    | "HONORARIOS_Y_COMISIONES_DECLARANTE"
    | "HONORARIOS_Y_COMISIONES_NO_DECLARANTE"
    | "ARRENDAMIENTO_BIENES_INMUEBLES"
    | "ARRENDAMIENTO_BIENES_MUEBLES"
    | "TRANSPORTE_CARGA_Y_PASAJEROS"
    | "HOTELES_Y_RESTAURANTES"
    | "CONTRATOS_CONSTRUCCION";

export type ColombianTaxRegime =
    | "PERSONA_JURIDICA_DECLARANTE"
    | "PERSONA_NATURAL_DECLARANTE"
    | "PERSONA_NATURAL_NO_DECLARANTE"
    | "GRAN_CONTRIBUYENTE"
    | "AUTORRETENEDOR"
    | "REGIMEN_SIMPLE_RST";

export interface WithholdingConfigRule {
    code: ColombianTransactionType;
    label: string;
    description: string;
    minBaseUvt: number;
    declaranteRatePct: number;
    noDeclaranteRatePct: number;
}

export const COLOMBIAN_WITHHOLDING_RULES: Record<ColombianTransactionType, WithholdingConfigRule> = {
    COMPRAS_GENERALES_DECLARANTE: {
        code: "COMPRAS_GENERALES_DECLARANTE",
        label: "Compras Generales (Declarantes)",
        description: "Adquisición de bienes, productos o mercancías a contribuyentes declarantes de renta.",
        minBaseUvt: 27, // 27 UVT = $1.344.573 COP
        declaranteRatePct: 2.5,
        noDeclaranteRatePct: 3.5,
    },
    COMPRAS_GENERALES_NO_DECLARANTE: {
        code: "COMPRAS_GENERALES_NO_DECLARANTE",
        label: "Compras Generales (No Declarantes)",
        description: "Adquisición de mercancías a personas naturales no declarantes de renta.",
        minBaseUvt: 27,
        declaranteRatePct: 2.5,
        noDeclaranteRatePct: 3.5,
    },
    SERVICIOS_GENERALES_DECLARANTE: {
        code: "SERVICIOS_GENERALES_DECLARANTE",
        label: "Servicios Generales (Declarantes)",
        description: "Prestación de servicios operacionales o técnicos por personas jurídicas o declarantes.",
        minBaseUvt: 4, // 4 UVT = $199.196 COP
        declaranteRatePct: 4.0,
        noDeclaranteRatePct: 6.0,
    },
    SERVICIOS_GENERALES_NO_DECLARANTE: {
        code: "SERVICIOS_GENERALES_NO_DECLARANTE",
        label: "Servicios Generales (No Declarantes)",
        description: "Servicios prestados por personas naturales no declarantes.",
        minBaseUvt: 4,
        declaranteRatePct: 4.0,
        noDeclaranteRatePct: 6.0,
    },
    HONORARIOS_Y_COMISIONES_DECLARANTE: {
        code: "HONORARIOS_Y_COMISIONES_DECLARANTE",
        label: "Honorarios y Comisiones (Declarantes / PJ)",
        description: "Servicios profesionales calificados con predominio del factor intelectual.",
        minBaseUvt: 0, // Sin cuantía mínima (Aplica desde $1 COP)
        declaranteRatePct: 11.0,
        noDeclaranteRatePct: 10.0,
    },
    HONORARIOS_Y_COMISIONES_NO_DECLARANTE: {
        code: "HONORARIOS_Y_COMISIONES_NO_DECLARANTE",
        label: "Honorarios y Comisiones (No Declarantes)",
        description: "Honorarios percibidos por personas naturales no declarantes de renta.",
        minBaseUvt: 0,
        declaranteRatePct: 11.0,
        noDeclaranteRatePct: 10.0,
    },
    ARRENDAMIENTO_BIENES_INMUEBLES: {
        code: "ARRENDAMIENTO_BIENES_INMUEBLES",
        label: "Arrendamiento de Bienes Inmuebles",
        description: "Alquiler de locales comerciales, oficinas o bodegas.",
        minBaseUvt: 27,
        declaranteRatePct: 3.5,
        noDeclaranteRatePct: 3.5,
    },
    ARRENDAMIENTO_BIENES_MUEBLES: {
        code: "ARRENDAMIENTO_BIENES_MUEBLES",
        label: "Arrendamiento de Bienes Muebles / Maquinaria",
        description: "Alquiler de equipos, vehículos, maquinaria o herramientas.",
        minBaseUvt: 0,
        declaranteRatePct: 4.0,
        noDeclaranteRatePct: 4.0,
    },
    TRANSPORTE_CARGA_Y_PASAJEROS: {
        code: "TRANSPORTE_CARGA_Y_PASAJEROS",
        label: "Transporte de Carga y Pasajeros",
        description: "Servicios de flete, carga terrestre o transporte nacional.",
        minBaseUvt: 4,
        declaranteRatePct: 1.0,
        noDeclaranteRatePct: 1.0,
    },
    HOTELES_Y_RESTAURANTES: {
        code: "HOTELES_Y_RESTAURANTES",
        label: "Servicios de Hoteles, Alojamiento y Restaurantes",
        description: "Servicios de hospedaje o consumo en establecimientos gastronómicos.",
        minBaseUvt: 4,
        declaranteRatePct: 3.5,
        noDeclaranteRatePct: 3.5,
    },
    CONTRATOS_CONSTRUCCION: {
        code: "CONTRATOS_CONSTRUCCION",
        label: "Contratos de Construcción y Urbanización",
        description: "Ejecución de obras civiles, infraestructura o remodelaciones.",
        minBaseUvt: 27,
        declaranteRatePct: 2.0,
        noDeclaranteRatePct: 2.0,
    },
};

export interface CompanyAgentStatus {
    isWithholdingAgent: boolean; // ¿Es Agente de Retención? (ET Art. 368)
    isGranContribuyente: boolean; // O-13
    isAutorretenedor: boolean; // O-15
    isRegimenSimple: boolean; // RST (No practica retenciones a terceros)
}

export interface BuyerTaxStatus {
    taxRegime: ColombianTaxRegime;
    isDeclarante: boolean;
    isAutorretenedor: boolean;
    isRegimenSimple: boolean;
}

export interface WithholdingCalculationResult {
    isWithholdingAgent: boolean;
    transactionType: ColombianTransactionType;
    buyerTaxRegime: ColombianTaxRegime;
    baseSubtotal: number;
    uvtBaseThresholdCop: number;
    meetsMinThreshold: boolean;
    appliedRatePct: number;
    withholdingAmount: number;
    reteIcaAmount: number;
    reteIvaAmount: number;
    totalRetenciones: number;
    netPayableAmount: number;
    exemptionReason?: string;
}

/**
 * MOTOR PRINCIPAL DE CÁLCULO DE RETENCIÓN EN LA FUENTE COLOMBIANA
 */
export function calculateColombianWithholding(
    baseSubtotal: number,
    ivaAmount: number,
    companyStatus: CompanyAgentStatus,
    buyerStatus: BuyerTaxStatus,
    transactionType: ColombianTransactionType,
    reteIcaRatePerThousand = 4.14
): WithholdingCalculationResult {
    const rule = COLOMBIAN_WITHHOLDING_RULES[transactionType] || COLOMBIAN_WITHHOLDING_RULES.COMPRAS_GENERALES_DECLARANTE;
    const minThresholdCop = rule.minBaseUvt * UVT_VALUE_2026;

    // 1. VALIDAR SI LA EMPRESA ES AGENTE DE RETENCIÓN
    if (!companyStatus.isWithholdingAgent && !companyStatus.isGranContribuyente) {
        return {
            isWithholdingAgent: false,
            transactionType,
            buyerTaxRegime: buyerStatus.taxRegime,
            baseSubtotal,
            uvtBaseThresholdCop: minThresholdCop,
            meetsMinThreshold: false,
            appliedRatePct: 0,
            withholdingAmount: 0,
            reteIcaAmount: 0,
            reteIvaAmount: 0,
            totalRetenciones: 0,
            netPayableAmount: baseSubtotal + ivaAmount,
            exemptionReason: "La empresa emisora NO está configurada como Agente Retenedor del Impuesto sobre la Renta (ET Art. 368).",
        };
    }

    // 2. EXENCIÓN POR RÉGIMEN SIMPLE DE TRIBUTACIÓN (RST - Ley 2277 / Art. 911 ET)
    if (buyerStatus.isRegimenSimple || buyerStatus.taxRegime === "REGIMEN_SIMPLE_RST") {
        return {
            isWithholdingAgent: true,
            transactionType,
            buyerTaxRegime: buyerStatus.taxRegime,
            baseSubtotal,
            uvtBaseThresholdCop: minThresholdCop,
            meetsMinThreshold: false,
            appliedRatePct: 0,
            withholdingAmount: 0,
            reteIcaAmount: 0,
            reteIvaAmount: 0,
            totalRetenciones: 0,
            netPayableAmount: baseSubtotal + ivaAmount,
            exemptionReason: "Exento: El cliente pertenece al Régimen Simple de Tributación (RST). No se practica Retefuente a contribuyentes del RST (Ley 2277 de 2022).",
        };
    }

    // 3. EXENCIÓN POR CLIENTE AUTORRETENEDOR (O-15)
    if (buyerStatus.isAutorretenedor || buyerStatus.taxRegime === "AUTORRETENEDOR") {
        return {
            isWithholdingAgent: true,
            transactionType,
            buyerTaxRegime: buyerStatus.taxRegime,
            baseSubtotal,
            uvtBaseThresholdCop: minThresholdCop,
            meetsMinThreshold: false,
            appliedRatePct: 0,
            withholdingAmount: 0,
            reteIcaAmount: 0,
            reteIvaAmount: 0,
            totalRetenciones: 0,
            netPayableAmount: baseSubtotal + ivaAmount,
            exemptionReason: "Exento: El cliente posee la calidad de Autorretenedor autorizado por la DIAN (Resolución O-15).",
        };
    }

    // 4. VALIDAR BASE MÍNIMA DE RETENCIÓN (UVT 2026)
    const meetsThreshold = baseSubtotal >= minThresholdCop;
    if (!meetsThreshold) {
        return {
            isWithholdingAgent: true,
            transactionType,
            buyerTaxRegime: buyerStatus.taxRegime,
            baseSubtotal,
            uvtBaseThresholdCop: minThresholdCop,
            meetsMinThreshold: false,
            appliedRatePct: 0,
            withholdingAmount: 0,
            reteIcaAmount: 0,
            reteIvaAmount: 0,
            totalRetenciones: 0,
            netPayableAmount: baseSubtotal + ivaAmount,
            exemptionReason: `No alcanza cuantía mínima: La base de compra (${formatCOP(baseSubtotal)}) es inferior al límite de ${rule.minBaseUvt} UVT (${formatCOP(minThresholdCop)}).`,
        };
    }

    // 5. DETERMINAR TARIFA SEGÚN CONDICIÓN DE DECLARANTE
    const ratePct = buyerStatus.isDeclarante ? rule.declaranteRatePct : rule.noDeclaranteRatePct;
    const withholdingAmount = Number((baseSubtotal * (ratePct / 100)).toFixed(2));

    // 6. CÁLCULO DE RETEICA (Impuesto de Industria y Comercio Municipal)
    const reteIcaAmount = Number((baseSubtotal * (reteIcaRatePerThousand / 1000)).toFixed(2));

    // 7. CÁLCULO DE RETEIVA (15% del valor total del IVA discriminado - Gran Contribuyente / Agente ReteIVA)
    const reteIvaAmount = companyStatus.isGranContribuyente ? Number((ivaAmount * 0.15).toFixed(2)) : 0;

    const totalRetenciones = withholdingAmount + reteIcaAmount + reteIvaAmount;
    const netPayableAmount = (baseSubtotal + ivaAmount) - totalRetenciones;

    return {
        isWithholdingAgent: true,
        transactionType,
        buyerTaxRegime: buyerStatus.taxRegime,
        baseSubtotal,
        uvtBaseThresholdCop: minThresholdCop,
        meetsMinThreshold: true,
        appliedRatePct: ratePct,
        withholdingAmount,
        reteIcaAmount,
        reteIvaAmount,
        totalRetenciones: Number(totalRetenciones.toFixed(2)),
        netPayableAmount: Number(netPayableAmount.toFixed(2)),
    };
}

function formatCOP(amount: number): string {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount);
}
