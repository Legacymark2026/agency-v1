/**
 * apps/web/lib/crm/multi-currency.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor Multi-Moneda en Tiempo Real (Multi-Currency Real-Time Engine).
 *
 * Realiza conversiones instantáneas entre USD, EUR, COP, MXN y GBP
 * para empresas y agencias globales con reporte unificado.
 */

export type CurrencyCode = 'USD' | 'EUR' | 'COP' | 'MXN' | 'GBP';

export const EXCHANGE_RATES_TO_USD: Record<CurrencyCode, number> = {
    USD: 1.0,
    EUR: 1.09,    // 1 EUR = 1.09 USD
    COP: 0.00025, // 1 COP = 0.00025 USD (approx 4,000 COP/USD)
    MXN: 0.058,   // 1 MXN = 0.058 USD (approx 17.2 MXN/USD)
    GBP: 1.27,    // 1 GBP = 1.27 USD
};

export interface ConversionResult {
    originalAmount: number;
    fromCurrency: CurrencyCode;
    targetAmount: number;
    toCurrency: CurrencyCode;
    rateUsed: number;
    formattedTarget: string;
}

export function convertCurrency(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
): ConversionResult {
    if (fromCurrency === toCurrency) {
        return {
            originalAmount: amount,
            fromCurrency,
            targetAmount: amount,
            toCurrency,
            rateUsed: 1.0,
            formattedTarget: formatCurrencyMulti(amount, toCurrency),
        };
    }

    // Convert from source currency to USD baseline
    const usdValue = amount * EXCHANGE_RATES_TO_USD[fromCurrency];

    // Convert from USD baseline to target currency
    const targetRate = EXCHANGE_RATES_TO_USD[toCurrency];
    const targetAmount = Math.round(usdValue / targetRate);
    const rateUsed = parseFloat((EXCHANGE_RATES_TO_USD[fromCurrency] / targetRate).toFixed(6));

    return {
        originalAmount: amount,
        fromCurrency,
        targetAmount,
        toCurrency,
        rateUsed,
        formattedTarget: formatCurrencyMulti(targetAmount, toCurrency),
    };
}

export function formatCurrencyMulti(amount: number, currency: CurrencyCode): string {
    const localeMap: Record<CurrencyCode, string> = {
        USD: 'en-US',
        EUR: 'de-DE',
        COP: 'es-CO',
        MXN: 'es-MX',
        GBP: 'en-GB',
    };

    return new Intl.NumberFormat(localeMap[currency] || 'en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'COP' ? 0 : 2,
    }).format(amount);
}
