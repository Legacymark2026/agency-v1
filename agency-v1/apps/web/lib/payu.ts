import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export interface PayuConfigData {
    apiKey: string;
    merchantId: string;
    accountId: string;
    test: number;
    checkoutUrl: string;
}

export async function getPayuConfig(companyId?: string): Promise<PayuConfigData | null> {
    // If we have a company ID, fetch from DB
    if (companyId) {
        try {
            const integration = await prisma.integrationConfig.findUnique({
                where: {
                    companyId_provider: {
                        companyId,
                        provider: 'payu'
                    }
                }
            });

            if (integration && integration.isEnabled && integration.config) {
                const config = integration.config as any;
                if (config.apiKey && config.merchantId && config.accountId) {
                    const isTest = config.isTest === true;
                    return {
                        apiKey: config.apiKey,
                        merchantId: config.merchantId,
                        accountId: config.accountId,
                        test: isTest ? 1 : 0,
                        checkoutUrl: isTest 
                            ? "https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/"
                            : "https://checkout.payulatam.com/ppp-web-gateway-payu/"
                    };
                }
            }
        } catch (error) {
            console.error("[PayU Config] Error fetching from DB", error);
        }
    }

    // Fallback to Env variables if DB is not configured
    if (process.env.PAYU_API_KEY && process.env.NEXT_PUBLIC_PAYU_MERCHANT_ID && process.env.NEXT_PUBLIC_PAYU_ACCOUNT_ID) {
        const isTestEnv = process.env.NEXT_PUBLIC_PAYU_TEST === "true";
        return {
            apiKey: process.env.PAYU_API_KEY,
            merchantId: process.env.NEXT_PUBLIC_PAYU_MERCHANT_ID,
            accountId: process.env.NEXT_PUBLIC_PAYU_ACCOUNT_ID,
            test: isTestEnv ? 1 : 0,
            checkoutUrl: isTestEnv
                ? "https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/"
                : "https://checkout.payulatam.com/ppp-web-gateway-payu/"
        };
    }

    return null;
}

export function generatePayuSignature(config: PayuConfigData, referenceCode: string, amount: number, currency: string = "COP") {
    // PayU Signature: md5(ApiKey~merchantId~referenceCode~amount~currency)
    const amountStr = amount.toString(); 
    const str = `${config.apiKey}~${config.merchantId}~${referenceCode}~${amountStr}~${currency}`;
    return crypto.createHash("md5").update(str).digest("hex");
}

export function validatePayuConfirmationSignature(
    config: PayuConfigData,
    referenceCode: string,
    amount: string | number,
    currency: string,
    statePol: string,
    sign: string
) {
    // PayU Confirmation: md5(ApiKey~merchantId~reference_sale~new_value~currency~state_pol)
    // El "new_value" se aproxima a un decimal si el segundo es cero (p.ej 150.00 -> 150.0)
    let formattedAmount = Number(amount).toFixed(1);
    const parts = formattedAmount.split('.');
    if (parts[1] === '0') {
      formattedAmount = parts[0] + '.0';
    }

    const str = `${config.apiKey}~${config.merchantId}~${referenceCode}~${formattedAmount}~${currency}~${statePol}`;
    const calculatedSign = crypto.createHash("md5").update(str).digest("hex");
    
    // Convert signs to lowercase for safe comparison
    return calculatedSign.toLowerCase() === sign.toLowerCase();
}
