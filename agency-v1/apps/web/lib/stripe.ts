import Stripe from "stripe";

/**
 * lib/stripe.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Inicialización única del SDK de Stripe para Billing SaaS B2B.
 */

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "[Stripe] STRIPE_SECRET_KEY no configurado en entorno de producción. " +
    "El web/billing fallará temporalmente hasta agregar la key."
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_FALLBACK", {
  apiVersion: "2024-11-20.acacia", // Usa la última versión actual
  appInfo: {
    name: "LegacyMark SaaS",
    version: "2.0.0",
  },
});


export async function getStripeSession(companyId: string, amount: number, currency: string, name: string, metadata: any, successUrl: string, cancelUrl: string) {
  return await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency,
        product_data: { name },
        unit_amount: Math.round(amount * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });
}
