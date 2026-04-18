import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

// Instancia global por defecto (Opcional, si hay un default por .env para cuentas legacy)
export const defaultStripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as any,
  typescript: true,
}) : null;

/**
 * Función asíncrona que recupera las llaves de Stripe desde la base de datos (SaaS)
 * O hace fallback a las variables del archivo .env
 */
export async function getStripeInstance(companyId: string) {
    const config = await prisma.integrationConfig.findUnique({
        where: {
            companyId_provider: {
                companyId,
                provider: 'stripe'
            }
        }
    });

    if (config && config.config && config.isEnabled) {
        const secretKey = (config.config as any).secretKey;
        if (secretKey) {
            return new Stripe(secretKey, {
                apiVersion: '2023-10-16' as any,
                typescript: true,
            });
        }
    }

    if (!defaultStripe) {
        throw new Error("Stripe secret key is not configured for this company nor globally.");
    }

    return defaultStripe;
}

export async function getStripeWebhookSecret(companyId: string) {
     const config = await prisma.integrationConfig.findUnique({
        where: {
            companyId_provider: {
                companyId,
                provider: 'stripe'
            }
        }
    });

    if (config && config.config && config.isEnabled) {
        const webhookSecret = (config.config as any).webhookSecret;
        if (webhookSecret) return webhookSecret;
    }

    return process.env.STRIPE_WEBHOOK_SECRET;
}

export const getStripeSession = async (
  companyId: string, // Se añadió parameter
  amount: number,
  currency: string,
  productName: string,
  metadata: Record<string, string>,
  successUrl: string,
  cancelUrl: string,
  customerEmail?: string
) => {
  const stripe = await getStripeInstance(companyId);
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: productName,
          },
          unit_amount: Math.round(amount * 100), // Stripe expects amounts in cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    customer_email: customerEmail,
  });

  return session;
};
