"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "finance-service");
class FinanceService {
    /**
     * Obtener lista de facturas
     */
    static async getInvoices(companyId, status) {
        const where = { companyId };
        if (status)
            where.status = status;
        return database_1.prisma.invoice.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: { items: true },
        });
    }
    /**
     * Crear nueva factura con transacción atómica
     */
    static async createInvoice(input) {
        return database_1.prisma.$transaction(async (tx) => {
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
    static async handleStripeWebhookEvent(companyId, event) {
        console.log(`[FinanceService] Processing Stripe event type: ${event.type}`);
        const data = event.data.object;
        if (event.type === "invoice.payment_succeeded") {
            const stripeInvoiceId = data.id;
            const amountPaid = data.amount_paid / 100;
            const customerEmail = data.customer_email;
            await eventBus.publish("payment.succeeded", {
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
            await eventBus.publish("subscription.status_changed", {
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
    static async getCashFlowForecast(companyId) {
        console.log(`[FinanceService] Generating cash flow projection for company: ${companyId}`);
        let currentBalance = 15000.00;
        try {
            const invoices = await database_1.prisma.invoice.findMany({
                where: { companyId, status: "PAID" },
                select: { totalAmount: true }
            });
            const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
            if (totalPaid > 0)
                currentBalance = totalPaid;
        }
        catch {
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
exports.FinanceService = FinanceService;
//# sourceMappingURL=finance.service.js.map