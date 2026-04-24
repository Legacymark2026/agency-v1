import { getStripeSession } from "./stripe";
import { createPayPalOrder, capturePayPalOrder, getPayPalAccessToken } from "./paypal";
import { createPSEPayment, getPSEBankList, getPSETransactionStatus } from "./pse";

export type PaymentGateway = "stripe" | "paypal" | "pse";
export type BillingCycle = "monthly" | "yearly";

export interface PaymentRequest {
  companyId: string;
  gateway: PaymentGateway;
  amount: number;
  currency: "COP" | "USD" | "EUR";
  description: string;
  tierName?: string;
  priceId?: string;
  billingCycle?: BillingCycle;
  bankCode?: string;
  successUrl?: string;
  cancelUrl?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  document?: string;
}

export interface PaymentResponse {
  success: boolean;
  gateway: PaymentGateway;
  url?: string;
  transactionId?: string;
  error?: string;
}

const PRICE_MAP: Record<string, string> = {
  "pro-monthly": process.env.STRIPE_PRICE_PRO_MONTHLY || "",
  "pro-yearly": process.env.STRIPE_PRICE_PRO_YEARLY || "",
  "agency-monthly": process.env.STRIPE_PRICE_AGENCY_MONTHLY || "",
  "agency-yearly": process.env.STRIPE_PRICE_AGENCY_YEARLY || "",
};

const ANNUAL_DISCOUNT_PERCENT = parseInt(process.env.STRIPE_AGENCY_DISCOUNT_PERCENT || "20", 10);

export function getPriceIdForTier(tier: string, cycle: BillingCycle): string | null {
  const key = `${tier.toLowerCase()}-${cycle}`;
  return PRICE_MAP[key] || null;
}

export function calculateAnnualPrice(monthlyPrice: number): number {
  const discount = monthlyPrice * ANNUAL_DISCOUNT_PERCENT / 100;
  const annualPrice = monthlyPrice * 12 - discount;
  return Math.round(annualPrice);
}

export async function createPaymentSession(
  req: PaymentRequest
): Promise<PaymentResponse> {
  const {
    companyId,
    gateway,
    amount,
    currency,
    description,
    tierName,
    priceId,
    billingCycle = "monthly",
    bankCode,
    successUrl,
    cancelUrl,
    firstName,
    lastName,
    email,
    document,
  } = req;

  const billingCycleValue = billingCycle || "monthly";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const finalSuccessUrl = successUrl || `${baseUrl}/dashboard/admin/settings?billing_success=true`;
  const finalCancelUrl = cancelUrl || `${baseUrl}/dashboard/admin/settings?billing_canceled=true`;

  try {
    switch (gateway) {
      case "stripe": {
        const amountToCharge = billingCycleValue === "yearly" ? calculateAnnualPrice(amount) : amount;
        const descWithCycle = `${description} (${billingCycleValue === "yearly" ? "Annual" : "Monthly"})`;
        const metadata = { companyId, tier: tierName || "", cycle: billingCycleValue };
        const stripeUrl = await getStripeSession(
          companyId,
          amountToCharge,
          currency,
          descWithCycle,
          metadata,
          finalSuccessUrl,
          finalCancelUrl
        );
        return { success: true, gateway: "stripe", url: stripeUrl.url || "" };
      }

      case "paypal": {
        const order = await createPayPalOrder(amount, currency, description, {
          companyId,
          tier: tierName || "free",
        });
        if (order.status === "CREATED" && order.links) {
          const approveLink = order.links.find(
            (l: { rel: string; href: string }) => l.rel === "approve"
          );
          return {
            success: true,
            gateway: "paypal",
            url: approveLink?.href || "",
            transactionId: order.id,
          };
        }
        return { success: false, gateway: "paypal", error: "Failed to create PayPal order" };
      }

      case "pse": {
        if (!bankCode) {
          return { success: false, gateway: "pse", error: "Bank code required for PSE" };
        }
        const userDocument = document || "0";
        const userFirstName = firstName || "User";
        const userLastName = lastName || "Customer";
        const userEmail = email || "user@example.com";
        const result = await createPSEPayment({
          amount,
          currency,
          documentType: "CC",
          document: userDocument,
          firstName: userFirstName,
          lastName: userLastName,
          email: userEmail,
          bankCode,
          merchantInteractionId: `${companyId}-${Date.now()}`,
        });

        if (result.action && result.action.url) {
          return {
            success: true,
            gateway: "pse",
            url: result.action.url,
            transactionId: result.metadataOut?.transactionId,
          };
        }
        return { success: false, gateway: "pse", error: "Failed to create PSE payment" };
      }

      default:
        return { success: false, gateway, error: `Unsupported gateway: ${gateway}` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Payment Gateway] Error:", message);
    return { success: false, gateway, error: message };
  }
}

export async function verifyPayment(
  gateway: PaymentGateway,
  transactionId: string
): Promise<{ verified: boolean; status: string }> {
  try {
    switch (gateway) {
      case "stripe": {
        const { stripe } = await import("./stripe");
        const session = await stripe.checkout.sessions.retrieve(transactionId);
        return {
          verified: session.payment_status === "paid",
          status: session.payment_status,
        };
      }

      case "paypal": {
        const captured = await capturePayPalOrder(transactionId);
        return {
          verified: captured.status === "COMPLETED",
          status: captured.status,
        };
      }

      case "pse": {
        const status = await getPSETransactionStatus(transactionId);
        return {
          verified: status.statusCode === "4" || status.statusCode === "APPROVED",
          status: status.statusMessage || status.statusCode,
        };
      }

      default:
        return { verified: false, status: "unknown" };
    }
  } catch (error) {
    console.error("[Payment Gateway] Verify error:", error);
    return { verified: false, status: "error" };
  }
}

export { getPayPalAccessToken, getPSEBankList };