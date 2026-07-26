import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

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
      await EventBus.publish("invoice.created", {
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
}
