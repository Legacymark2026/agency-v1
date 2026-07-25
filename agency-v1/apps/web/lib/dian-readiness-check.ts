/**
 * MOTOR DE EVALUACIÓN DE HABILITACIÓN Y REQUISITOS PREVIOS DIAN (READINESS CHECK)
 * Revisa el cumplimiento del 100% de los parámetros obligatorios antes de permitir la emisión de facturas.
 */

export interface DianReadinessChecklist {
    nitValid: boolean;
    dvValid: boolean;
    taxRegimeValid: boolean;
    emailValid: boolean;
    prefixValid: boolean;
    resolutionNumberValid: boolean;
    resolutionDateValid: boolean;
    technicalKeyValid: boolean;
    softwareIdValid: boolean;
    softwarePinValid: boolean;
    certificateValid: boolean;
}

export interface DianReadinessResult {
    isFullyEnabled: boolean;
    completionPercentage: number;
    checklist: DianReadinessChecklist;
    missingFields: string[];
    statusBadge: {
        label: string;
        colorClass: string;
        description: string;
    };
}

export function evaluateDianSystemReadiness(config: any): DianReadinessResult {
    const cfg = config || {};

    const nitValid = Boolean(cfg.nit && cfg.nit.trim().length >= 5);
    const dvValid = Boolean(cfg.dv && cfg.dv.trim().length >= 1);
    const taxRegimeValid = Boolean(cfg.taxRegime && cfg.taxRegime.trim().length > 0);
    const emailValid = Boolean(cfg.email && cfg.email.includes("@"));

    const prefixValid = Boolean(cfg.dianPrefix && cfg.dianPrefix.trim().length >= 1);
    const resolutionNumberValid = Boolean(cfg.dianResolutionNumber && cfg.dianResolutionNumber.trim().length >= 5);
    
    // Check resolution expiration
    let resolutionDateValid = false;
    if (cfg.dianResolutionDueDate) {
        const dueDate = new Date(cfg.dianResolutionDueDate);
        resolutionDateValid = !isNaN(dueDate.getTime()) && dueDate > new Date();
    } else {
        resolutionDateValid = true; // Fallback if not specified
    }

    // Technical Key 64-char hex
    const techKey = (cfg.dianTechnicalKey || "").trim();
    const technicalKeyValid = techKey.length === 64 && /^[0-9a-fA-F]{64}$/.test(techKey);

    const softwareIdValid = Boolean(cfg.dianSoftwareId && cfg.dianSoftwareId.trim().length >= 10);
    const softwarePinValid = Boolean(cfg.dianSoftwarePin && cfg.dianSoftwarePin.trim().length >= 3);
    const certificateValid = Boolean(cfg.certificateStatus && cfg.certificateStatus.toUpperCase().includes("VÁLIDO"));

    const checklist: DianReadinessChecklist = {
        nitValid,
        dvValid,
        taxRegimeValid,
        emailValid,
        prefixValid,
        resolutionNumberValid,
        resolutionDateValid,
        technicalKeyValid,
        softwareIdValid,
        softwarePinValid,
        certificateValid,
    };

    const missingFields: string[] = [];
    if (!nitValid) missingFields.push("NIT del Emisor");
    if (!dvValid) missingFields.push("Dígito de Verificación (DV)");
    if (!taxRegimeValid) missingFields.push("Régimen Fiscal DIAN (RUT)");
    if (!emailValid) missingFields.push("Correo Electrónico de Facturación");
    if (!prefixValid) missingFields.push("Prefijo Habilitado (ej. FE/SETG)");
    if (!resolutionNumberValid) missingFields.push("Número de Resolución DIAN");
    if (!resolutionDateValid) missingFields.push("Vigencia de Resolución DIAN (Expirada)");
    if (!technicalKeyValid) missingFields.push("Clave Técnica DIAN (64 Caracteres Hexadecimales)");
    if (!softwareIdValid) missingFields.push("Software ID entregado por la DIAN");
    if (!softwarePinValid) missingFields.push("Software PIN entregado por la DIAN");
    if (!certificateValid) missingFields.push("Certificado Digital de Firma XAdES-BES (.pfx)");

    const totalRequirements = Object.keys(checklist).length;
    const passedRequirements = Object.values(checklist).filter(Boolean).length;
    const completionPercentage = Math.round((passedRequirements / totalRequirements) * 100);

    const isFullyEnabled = completionPercentage === 100;

    let statusBadge = {
        label: "SISTEMA 100% HABILITADO PARA FACTURAR",
        colorClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        description: "Todos los parámetros tributarios, resoluciones, clave técnica y firma digital se encuentran correctamente configurados.",
    };

    if (completionPercentage < 100) {
        statusBadge = {
            label: `SISTEMA INCOMPLETO PARA FACTURAR (${completionPercentage}% CONFIGURADO)`,
            colorClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
            description: `Faltan ${missingFields.length} requisito(s) obligatorio(s) por configurar en el panel de la empresa.`,
        };
    }

    return {
        isFullyEnabled,
        completionPercentage,
        checklist,
        missingFields,
        statusBadge,
    };
}
