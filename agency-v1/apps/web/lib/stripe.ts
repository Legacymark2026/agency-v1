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
