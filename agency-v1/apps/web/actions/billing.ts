"use server";

/**
 * actions/billing.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Lógica de conexión para la facturación.
 * Usado para emitir URLs de Checkout y Customer Portal limitadas por inquilino.
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // Aquí aún usamos el maestro para obtener records sin restriccion
import { stripe } from "@/lib/stripe";
import { fail, ok, ActionResult } from "@/types/actions";

export async function createCheckoutSession(
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

    // Si la empresa nunca ha comprado, generamos el Customer Index en Stripe
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

    // Retorna URL al portal (asume dominio base local en Dev)
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
      client_reference_id: company.id, // Marca el webhook final
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

export async function createPortalSession(): Promise<ActionResult<{ url: string }>> {
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
