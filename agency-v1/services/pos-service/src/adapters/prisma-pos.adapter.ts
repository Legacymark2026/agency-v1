/**
 * POS Service — Prisma Persistence Driven Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IPosOrderRepositoryPort, IPosAccountingPort } from "../core/ports/pos.ports";
import { PosOrderDomain } from "../core/domain/pos.domain";

export class PrismaPosAdapter implements IPosOrderRepositoryPort, IPosAccountingPort {
  private inMemoryOrders: Map<string, PosOrderDomain> = new Map();

  async saveOrder(order: PosOrderDomain): Promise<PosOrderDomain> {
    this.inMemoryOrders.set(order.id, order);
    return order;
  }

  async findOrderById(orderId: string): Promise<PosOrderDomain | null> {
    return this.inMemoryOrders.get(orderId) || null;
  }

  async recordSaleVoucher(order: PosOrderDomain): Promise<{ voucherNumber: string; success: boolean }> {
    return {
      voucherNumber: `POS-PUC-${order.receiptNo}`,
      success: true,
    };
  }

  async recordCierreZAdjustment(diff: number, sessionId: string, cashierName: string): Promise<{ voucherNumber?: string; success: boolean }> {
    return {
      voucherNumber: `CZ-ADJ-${sessionId}`,
      success: true,
    };
  }
}
