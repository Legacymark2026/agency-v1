/**
 * apps/web/lib/crm/cpq-engine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor CPQ (Configure, Price, Quote) & Creador de Cotizaciones Digitales.
 *
 * CARACTERÍSTICAS:
 * 1. Cálculo de ítems, precios unitarios y cantidades.
 * 2. Aplicación de descuentos por volumen y promocionales.
 * 3. Cálculo de IVA / Impuestos (19%).
 * 4. Generación de estructura de Cotización Digital firmable.
 */

export interface QuoteLineItem {
    id: string;
    productName: string;
    description?: string;
    unitPrice: number;
    quantity: number;
    discountPct?: number;
}

export interface QuoteCalculationResult {
    subtotal: number;
    discountTotal: number;
    taxableAmount: number;
    taxAmount: number;
    grandTotal: number;
    itemsCount: number;
}

export interface DigitalQuote {
    quoteNumber: string;
    dealId: string;
    companyName: string;
    clientEmail: string;
    items: QuoteLineItem[];
    calculation: QuoteCalculationResult;
    status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
    validUntil: string; // YYYY-MM-DD
    signatureUrl?: string;
}

export function calculateQuote(items: QuoteLineItem[], taxRatePct: number = 19): QuoteCalculationResult {
    if (!items || items.length === 0) {
        return { subtotal: 0, discountTotal: 0, taxableAmount: 0, taxAmount: 0, grandTotal: 0, itemsCount: 0 };
    }

    let subtotal = 0;
    let discountTotal = 0;

    items.forEach(item => {
        const itemGross = item.unitPrice * item.quantity;
        const discount = item.discountPct ? itemGross * (item.discountPct / 100) : 0;
        subtotal += itemGross;
        discountTotal += discount;
    });

    const taxableAmount = Math.max(0, subtotal - discountTotal);
    const taxAmount = Math.round(taxableAmount * (taxRatePct / 100));
    const grandTotal = Math.round(taxableAmount + taxAmount);

    return {
        subtotal: Math.round(subtotal),
        discountTotal: Math.round(discountTotal),
        taxableAmount: Math.round(taxableAmount),
        taxAmount,
        grandTotal,
        itemsCount: items.length,
    };
}

export function createDigitalQuote(
    dealId: string,
    companyName: string,
    clientEmail: string,
    items: QuoteLineItem[],
    taxRatePct: number = 19
): DigitalQuote {
    const calculation = calculateQuote(items, taxRatePct);
    const quoteNumber = `LMQ-${Date.now().toString().substring(5)}`;
    const validUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10); // 15 días de validez

    return {
        quoteNumber,
        dealId,
        companyName,
        clientEmail,
        items,
        calculation,
        status: 'DRAFT',
        validUntil,
    };
}
