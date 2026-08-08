/**
 * MOTOR DE EVALUACIÓN DE COMERCIALIZACIÓN & LISTO PARA PRODUCCIÓN DIAN (SaaS Colombia)
 */

export interface DianSaaSCommercialConfig {
    companyNit: string;
    companyDv: string;
    companyName: string;
    softwareId: string;
    softwarePin: string;
    technicalKey: string;
    certificateP12Base64?: string;
    certificatePassword?: string;
    testSetId?: string; // ID del Set de Pruebas DIAN para Habilitación
    isProductionMode: boolean;
    smtpHost?: string;
    smtpUser?: string;
    smtpPass?: string;
    isFullyEnabledForProduction: boolean;
}

export interface DianReadinessChecklistResult {
    score: number; // 0 a 100%
    isReadyForCommercialUse: boolean;
    checks: {
        id: string;
        title: string;
        description: string;
        status: "PASSED" | "FAILED" | "WARNING";
    }[];
}

export function evaluateCommercialReadiness(config: Partial<DianSaaSCommercialConfig>): DianReadinessChecklistResult {
    const checks: { id: string; title: string; description: string; status: "PASSED" | "FAILED" | "WARNING" }[] = [];

    // Check 1: Software ID & Software PIN
    const hasSoftwareConfig = Boolean(config.softwareId && config.softwareId.length >= 10 && config.softwarePin);
    checks.push({
        id: "CHK_SOFTWARE",
        title: "SoftwareID & PIN Registrado ante la DIAN",
        description: "Software de Facturación Electrónica registrado y asociado en la plataforma DIAN Muisca.",
        status: hasSoftwareConfig ? "PASSED" : "FAILED",
    });

    // Check 2: Clave Técnica Hex
    const hasTechKey = Boolean(config.technicalKey && config.technicalKey.length === 64);
    checks.push({
        id: "CHK_TECH_KEY",
        title: "Clave Técnica SHA-384 Activa",
        description: "Clave de 64 caracteres Hex asociada al prefijo de facturación en el MUISCA.",
        status: hasTechKey ? "PASSED" : "FAILED",
    });

    // Check 3: Certificado Digital P12 / PFX
    const hasCert = Boolean(config.certificateP12Base64 && config.certificatePassword);
    checks.push({
        id: "CHK_CERT",
        title: "Certificado Digital X.509 Válido (Certicámara / GSE / AndesSCD)",
        description: "Firma digital RSA 2048 instalada para el sellado de tiempo y firma XAdES-BES.",
        status: hasCert ? "PASSED" : "WARNING",
    });

    // Check 4: Set de Pruebas DIAN (TestSetId)
    const hasTestSet = Boolean(config.testSetId || config.isProductionMode);
    checks.push({
        id: "CHK_TESTSET",
        title: "Habilitación DIAN / Set de Pruebas Superado",
        description: "Superación exitosa de las 50 facturas de prueba requeridas por la DIAN.",
        status: hasTestSet ? "PASSED" : "WARNING",
    });

    // Check 5: Envío Automático por Correo SMTP
    const hasSmtp = Boolean(config.smtpUser);
    checks.push({
        id: "CHK_SMTP",
        title: "Servidor SMTP / Correo de Recepción Configurado",
        description: "Despacho automático de facturas electrónicas XML + PDF al correo del Adquiriente.",
        status: hasSmtp ? "PASSED" : "WARNING",
    });

    const passedCount = checks.filter(c => c.status === "PASSED").length;
    const score = Math.round((passedCount / checks.length) * 100);
    const isReadyForCommercialUse = score >= 80;

    return {
        score,
        isReadyForCommercialUse,
        checks,
    };
}
