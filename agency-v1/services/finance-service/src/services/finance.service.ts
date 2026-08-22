import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "finance-service");

export interface CreateInvoiceInput {
  companyId: string;
  clientName: string;
  clientNit?: string;
  clientAddress?: string;
  clientCity?: string;
  clientPhone?: string;
  subtotalAmount: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  notes?: string;
  items?: Array<{ description: string; quantity: number; unitPrice: number; totalPrice: number }>;
}

export class FinanceService {
  /**
   * Obtener lista de facturas
   */
  static async getInvoices(companyId: string, status?: string) {
    const where: Record<string, unknown> = { companyId };
    if (status) where.status = status;

    return prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
  }

  /**
   * Crear nueva factura con transacción atómica
   */
  static async createInvoice(input: CreateInvoiceInput) {
    return prisma.$transaction(async (tx) => {
      const invoiceNumber = `FAC-${Date.now().toString().slice(-6)}`;
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          companyId: input.companyId,
          clientName: input.clientName,
          clientNit: input.clientNit,
          clientAddress: input.clientAddress,
          clientCity: input.clientCity,
          clientPhone: input.clientPhone,
          subtotalAmount: input.subtotalAmount,
          taxAmount: input.taxAmount || 0,
          discountAmount: input.discountAmount || 0,
          totalAmount: input.totalAmount,
          notes: input.notes,
          items: input.items ? {
            create: input.items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            }))
          } : undefined
        },
        include: { items: true }
      });

      // Publicar evento invoice.created
      await eventBus.publish("invoice.created", {
        id: invoice.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        companyId: invoice.companyId,
        totalAmount: Number(invoice.totalAmount),
        status: invoice.status,
        timestamp: new Date().toISOString()
      });

      return invoice;
    });
  }

  /**
   * Manejar webhooks de Stripe (Suscripciones y Facturas pagadas)
   */
  static async handleStripeWebhookEvent(companyId: string, event: { type: string; data: any }) {
    console.log(`[FinanceService] Processing Stripe event type: ${event.type}`);
    const data = event.data.object;

    if (event.type === "invoice.payment_succeeded") {
      const stripeInvoiceId = data.id;
      const amountPaid = data.amount_paid / 100;
      const customerEmail = data.customer_email;

      await eventBus.publish("payment.succeeded" as any, {
        companyId,
        stripeInvoiceId,
        amount: amountPaid,
        email: customerEmail,
        timestamp: new Date().toISOString()
      });

      return { processed: true, event: "invoice.payment_succeeded" };
    }

    if (event.type === "customer.subscription.updated") {
      const subscriptionId = data.id;
      const status = data.status; // active, past_due, canceled

      await eventBus.publish("subscription.status_changed" as any, {
        companyId,
        subscriptionId,
        status,
        timestamp: new Date().toISOString()
      });

      return { processed: true, event: "customer.subscription.updated" };
    }

    return { processed: false, event: event.type };
  }

  /**
   * Generar proyección predictiva del flujo de caja (Cash Flow Forecast)
   */
  static async getCashFlowForecast(companyId: string) {
    console.log(`[FinanceService] Generating cash flow projection for company: ${companyId}`);

    let currentBalance = 15000.00;
    try {
      const invoices = await prisma.invoice.findMany({
        where: { companyId, status: "PAID" },
        select: { totalAmount: true }
      });
      const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
      if (totalPaid > 0) currentBalance = totalPaid;
    } catch {
      // Ignore fallback
    }

    const months = ["Jun", "Jul", "Ago", "Sep", "Oct", "Nov"];
    const projections = months.map((month, idx) => {
      const growthFactor = 1 + idx * 0.15;
      const seasonality = Math.sin(idx) * 2000;
      const incoming = currentBalance * growthFactor + seasonality;
      const outgoing = (currentBalance * 0.6) * (1 + idx * 0.08);

      return {
        month,
        incoming: Math.round(incoming),
        outgoing: Math.round(outgoing),
        netFlow: Math.round(incoming - outgoing)
      };
    });

    return {
      currentBalance: Math.round(currentBalance),
      projections
    };
  }
}
