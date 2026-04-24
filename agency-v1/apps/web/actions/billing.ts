"use server";

/**
 * actions/billing.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Lógica de conexión para la facturación multi-gateway.
 * Soporta Stripe, PayPal y PSE (Colombia)
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createPaymentSession, PaymentGateway, BillingCycle, getPriceIdForTier } from "@/lib/payment-gateway";
import { fail, ok, ActionResult } from "@/types/actions";
import { getPSEBankList, PSEBank } from "@/lib/pse";

export type { PaymentGateway, BillingCycle };

export async function getAvailableGateways(): Promise<string[]> {
  const gateways: string[] = ["stripe"];
  
  if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
    gateways.push("paypal");
  }
  
  if (process.env.PSE_MERCHANT_ID && process.env.PSE_MERCHANT_KEY) {
    gateways.push("pse");
  }
  
  return gateways;
}

export async function getPSEBanks(): Promise<ActionResult<PSEBank[]>> {
  try {
    const banks = await getPSEBankList();
    return ok(banks);
  } catch (error: any) {
    return fail("Error obteniendo bancos: " + error.message);
  }
}

export async function createStripeCheckoutSession(
  priceId: string,
  tierName: string
): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user?.companyId || !session?.user?.id) {
    return fail("No estás autenticado.", 401);
  }

  const { companyId, id: userId, email } = session.user;

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, stripeCustomerId: true },
    });

    if (!company) return fail("Compañía no encontrada.", 404);

    let customerId = company.stripeCustomerId;

    if (!customerId) {
      if (!process.env.STRIPE_SECRET_KEY) return fail("Pasarela de pagos en mantenimiento", 500);
      
      const customer = await stripe.customers.create({
        email: email || undefined,
        name: company.name,
        metadata: {
          companyId: company.id,
          createdBy: userId,
        }
      });
      customerId = customer.id;
      
      await prisma.company.update({
        where: { id: company.id },
        data: { stripeCustomerId: customer.id }
      });
    }

    const baseDomain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      billing_address_collection: "auto",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: company.id,
      metadata: {
        companyId: company.id,
        tierName: tierName
      },
      success_url: `${baseDomain}/dashboard/admin/settings?billing_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseDomain}/dashboard/admin/settings?billing_canceled=true`,
    });

    if (!checkoutSession.url) {
      return fail("No se pudo generar la sesión de pago.", 500);
    }

    return ok({ url: checkoutSession.url });

  } catch (error: any) {
    console.error("[Billing Action Error]", error);
    return fail(error.message || "Error procesando el pago.", 500);
  }
}

export async function createPaymentSessionWithGateway(
  gateway: PaymentGateway,
  tierName: string,
  billingCycle: BillingCycle = "monthly",
  bankCode?: string
): Promise<ActionResult<{ url: string; transactionId?: string }>> {
  const session = await auth();
  if (!session?.user?.companyId || !session?.user?.id) {
    return fail("No estás autenticado.", 401);
  }

  const { companyId, id: userId, email, name } = session.user;

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, stripeCustomerId: true, subscriptionTier: true },
    });

    if (!company) return fail("Compañía no encontrada.", 404);

    const baseDomain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const tier = tierName.toLowerCase();

    const PRICES: Record<string, number> = {
      "pro": 2900000,
      "agency": 9900000,
    };
    
    const amount = PRICES[tier] || PRICES["pro"];
    const currency = "COP";

    if (gateway === "stripe") {
      let priceId = getPriceIdForTier(tier, billingCycle);
      
      if (!priceId) {
        priceId = billingCycle === "monthly" 
          ? (process.env.STRIPE_PRICE_PRO_MONTHLY || null)
          : (process.env.STRIPE_PRICE_PRO_YEARLY || null);
      }

      if (!priceId) {
        return fail("Price ID no configurado para Stripe", 500);
      }

      return createStripeCheckoutSession(priceId, tierName);
    }

    if (gateway === "paypal") {
      if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        return fail("PayPal no está configurado", 500);
      }

      const result = await createPaymentSession({
        companyId,
        gateway: "paypal",
        amount,
        currency,
        description: `LegacyMark ${tierName} - ${billingCycle === "yearly" ? "Annual" : "Monthly"}`,
        tierName,
        billingCycle,
        successUrl: `${baseDomain}/dashboard/admin/settings?billing_success=true`,
        cancelUrl: `${baseDomain}/dashboard/admin/settings?billing_canceled=true`,
      });

      if (!result.success || !result.url) {
        return fail(result.error || "Error creando sesión PayPal");
      }

      return ok({ url: result.url, transactionId: result.transactionId });
    }

    if (gateway === "pse") {
      if (!process.env.PSE_MERCHANT_ID || !process.env.PSE_MERCHANT_KEY) {
        return fail("PSE no está configurado", 500);
      }

      if (!bankCode) {
        return fail("Código de banco requerido para PSE");
      }

      const result = await createPaymentSession({
        companyId,
        gateway: "pse",
        amount,
        currency,
        description: `LegacyMark ${tierName}`,
        tierName,
        bankCode,
        successUrl: `${baseDomain}/dashboard/admin/settings?billing_success=true`,
        cancelUrl: `${baseDomain}/dashboard/admin/settings?billing_canceled=true`,
      });

      if (!result.success || !result.url) {
        return fail(result.error || "Error creando pago PSE");
      }

      return ok({ url: result.url, transactionId: result.transactionId });
    }

    return fail(`Gateway no soportado: ${gateway}`);

  } catch (error: any) {
    console.error("[Billing Action Error]", error);
    return fail(error.message || "Error procesando el pago.", 500);
  }
}

export async function createBillingPortalSession(): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user?.companyId) return fail("No authentication", 401);

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { stripeCustomerId: true },
  });

  if (!company?.stripeCustomerId) {
    return fail("No tienes una subscripción activa.");
  }

  try {
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: `${redirectUrl}/dashboard/admin/settings`,
    });

    return ok({ url: portalSession.url });
  } catch(e: any) {
    return fail("Error conectando con pasarela: " + e.message);
  }
}

export { createStripeCheckoutSession as createCheckoutSession, createBillingPortalSession as createPortalSession };