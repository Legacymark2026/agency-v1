/**
 * DICCIONARIO MAESTRO DE PARÁMETROS TRIBUTARIOS DIAN (ANEXO TÉCNICO 1.8 / 1.9)
 * Define todos los códigos, medios de pago, tipos de operación, tributos e impuestos saludables.
 */

export interface DianOperationType {
    code: string;
    name: string;
    description: string;
    requiresAiu?: boolean;
    requiresTrm?: boolean;
    requiresConsortiumPercentage?: boolean;
}

export interface DianPaymentMethod {
    code: string;
    name: string;
    category: "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "CREDITO" | "OTRO";
}

export interface DianTaxType {
    code: string;
    name: string;
    type: "IVA" | "INC" | "RETEFUENTE" | "RETEICA" | "RETEIVA" | "ICUI" | "IBUA" | "INPP";
    rateDefault?: number;
    description: string;
}

// 1. Tipos de Operación DIAN (cbc:CustomizationID)
export const DIAN_OPERATION_TYPES: DianOperationType[] = [
    { code: "10", name: "Escribir Operación Estándar", description: "Venta directa de bienes y servicios gravados, excluidos o exentos." },
    { code: "11", name: "Operación de Mandato", description: "Facturación por cuenta de terceros (Contratos de Mandato Art. 1.2.4.11 Dreato 1625)." },
    { code: "12", name: "Operación de Transporte", description: "Facturación de transporte terrestre, aéreo o marítimo de carga/pasajeros." },
    { code: "20", name: "Operación AIU (Construcción e Ingeniería)", description: "Facturación con base gravable especial sobre Utilidad (AIU) según Art. 468-3 ET.", requiresAiu: true },
    { code: "22", name: "Factura Consorcial / Unión Temporal", description: "Facturación a nombre de consorcio indicando % de participación de consorciados.", requiresConsortiumPercentage: true },
    { code: "30", name: "Operación de Exportación de Bienes/Servicios", description: "Exportaciones a clientes del exterior exentas de IVA con TRM oficial.", requiresTrm: true },
];

// 2. Medios de Pago DIAN (cbc:PaymentMeansCode)
export const DIAN_PAYMENT_METHODS: DianPaymentMethod[] = [
    { code: "10", name: "10 - Efectivo", category: "EFECTIVO" },
    { code: "48", name: "48 - Tarjeta Débito / Débito Bancario", category: "TARJETA" },
    { code: "49", name: "49 - Tarjeta Crédito", category: "TARJETA" },
    { code: "47", name: "47 - Transferencia Débito Bancario (PSE / Nequi / Daviplata / Bre-B)", category: "TRANSFERENCIA" },
    { code: "42", name: "42 - Consignación Bancaria Directa", category: "TRANSFERENCIA" },
    { code: "20", name: "20 - Cheque Bancario", category: "OTRO" },
    { code: "1", name: "1 - Instrumento no definido / Crédito Pactado", category: "CREDITO" },
];

// 3. Tributos e Impuestos Saludables DIAN (Ley 2277 de 2022)
export const DIAN_TAX_CATALOG: DianTaxType[] = [
    { code: "01", name: "IVA (Impuesto sobre las Ventas 19% / 5%)", type: "IVA", rateDefault: 19, description: "Impuesto al valor agregado tarifa general 19% o diferencial 5%." },
    { code: "04", name: "INC (Impuesto Nacional al Consumo 8%)", type: "INC", rateDefault: 8, description: "Impuesto al consumo para restaurantes, bares y expendio de comidas." },
    { code: "06", name: "ReteFuente (Retención en la Fuente en Renta)", type: "RETEFUENTE", rateDefault: 2.5, description: "Anticipo de impuesto de renta según cuantía mínima y categoría." },
    { code: "07", name: "ReteICA (Retención de Industria y Comercio Municipal)", type: "RETEICA", rateDefault: 0.414, description: "Retención municipal aplicable según la ciudad de emisión/entrega." },
    { code: "05", name: "ReteIVA (Retención de IVA 15% del IVA)", type: "RETEIVA", rateDefault: 15, description: "Retención aplicada por Agentes de Retención en IVA." },
    { code: "33", name: "ICUI (Impuesto a Bebidas Ultraprocesadas Azucaradas)", type: "ICUI", description: "Impuesto saludable Ley 2277 calculado por mililitros de bebida con azúcar adicionada." },
    { code: "34", name: "IBUA (Impuesto a Alimentos Ultraprocesados - Comida Chatarra 20%)", type: "IBUA", rateDefault: 20, description: "Impuesto saludable Ley 2277 del 20% para alimentos procesados con alto contenido de sodio/azúcar." },
    { code: "22", name: "INPP (Impuesto Nacional a Bolsas Plásticas)", type: "INPP", description: "Impuesto ambiental por entrega de bolsas plásticas en punto de venta." },
];
