import { prisma } from "@agency/database";
import { eventBus } from "../lib/event-bus.singleton";

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
  static async getInvoices(companyId: string, status?: string) {
    const where: Record<string, unknown> = { companyId };
    if (status) where.status = status;
    return prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
  }

  static async createInvoice(input: CreateInvoiceInput) {
    return prisma.$transaction(async (tx) => {
      const invoiceNumber = `FAC-${Date.now().toString().slice(-8)}`;
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
          items: input.items
            ? {
                create: input.items.map((item) => ({
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice,
                })),
              }
            : undefined,
        },
        include: { items: true },
      });

      await eventBus.publish("invoice.created", {
        id: invoice.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        companyId: invoice.companyId,
        totalAmount: Number(invoice.totalAmount),
        status: invoice.status,
        timestamp: new Date().toISOString(),
      });

      return invoice;
    });
  }

  static async handleStripeWebhookEvent(companyId: string, event: { type: string; data: any }) {
    const data = event.data.object;

    if (event.type === "invoice.payment_succeeded") {
      await eventBus.publish("payment.succeeded" as any, {
        companyId,
        stripeInvoiceId: data.id,
        amount: data.amount_paid / 100,
        email: data.customer_email,
        timestamp: new Date().toISOString(),
      });
      return { processed: true, event: "invoice.payment_succeeded" };
    }

    if (event.type === "customer.subscription.updated") {
      await eventBus.publish("subscription.status_changed" as any, {
        companyId,
        subscriptionId: data.id,
        status: data.status,
        timestamp: new Date().toISOString(),
      });
      return { processed: true, event: "customer.subscription.updated" };
    }

    return { processed: false, event: event.type };
  }

  /**
   * Fix C-5: Real cash flow forecast from actual DB data.
   * Calculates rolling 6-month average of incoming (paid invoices) and
   * outgoing (paid expenses), then projects forward with trend.
   */
  static async getCashFlowForecast(companyId: string) {
    const now = new Date();
    const months: Array<{ label: string; start: Date; end: Date }> = [];

    // Build last 6 months date ranges for historical context
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = start.toLocaleString("es-CO", { month: "short", year: "2-digit" });
      months.push({ label, start, end });
    }

    // Fetch real paid invoices and expenses per month in parallel
    const [invoicesByMonth, expensesByMonth] = await Promise.all([
      Promise.all(
        months.map((m) =>
          prisma.invoice.aggregate({
            where: { companyId, status: "PAID", paidAt: { gte: m.start, lte: m.end } },
            _sum: { totalAmount: true },
          })
        )
      ),
      Promise.all(
        months.map((m) =>
          prisma.expense.aggregate({
            where: { companyId, status: "PAID", paidAt: { gte: m.start, lte: m.end } },
            _sum: { amount: true },
          })
        )
      ),
    ]);

    const historical = months.map((m, i) => ({
      month: m.label,
      incoming: Number(invoicesByMonth[i]._sum.totalAmount) || 0,
      outgoing: Number(expensesByMonth[i]._sum.amount) || 0,
      netFlow: (Number(invoicesByMonth[i]._sum.totalAmount) || 0) - (Number(expensesByMonth[i]._sum.amount) || 0),
    }));

    // Calculate weighted moving average (more recent months weighted higher)
    const weights = [1, 1.5, 2, 2.5, 3, 3.5]; // ascending weight for recency
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    const avgIncoming = historical.reduce((s, h, i) => s + h.incoming * weights[i], 0) / totalWeight;
    const avgOutgoing = historical.reduce((s, h, i) => s + h.outgoing * weights[i], 0) / totalWeight;

    // Simple linear trend: slope from first to last month
    const incomingTrend = historical.length >= 2
      ? (historical[historical.length - 1].incoming - historical[0].incoming) / historical.length
      : 0;
    const outgoingTrend = historical.length >= 2
      ? (historical[historical.length - 1].outgoing - historical[0].outgoing) / historical.length
      : 0;

    // Project next 6 months
    const projections = Array.from({ length: 6 }, (_, idx) => {
      const projDate = new Date(now.getFullYear(), now.getMonth() + idx + 1, 1);
      const label = projDate.toLocaleString("es-CO", { month: "short", year: "2-digit" });
      const incoming = Math.max(0, Math.round(avgIncoming + incomingTrend * (idx + 1)));
      const outgoing = Math.max(0, Math.round(avgOutgoing + outgoingTrend * (idx + 1)));

      return { month: label, incoming, outgoing, netFlow: incoming - outgoing, projected: true };
    });

    const currentBalance = historical[historical.length - 1]?.netFlow ?? 0;

    return {
      currentBalance,
      currency: "COP",
      historical,
      projections,
      dataSource: "real",
    };
  }
}
