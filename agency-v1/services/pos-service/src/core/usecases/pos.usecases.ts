/**
 * POS Service — Pure Use Cases Implementation
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  IPosUseCases,
  IPosOrderRepositoryPort,
  IPosAccountingPort,
  CreatePosOrderDTO,
  CierreZInput,
  CierreZResult,
} from "../ports/pos.ports";
import {
  PosOrderDomain,
  CartItemInput,
  evaluateCartPromotions,
} from "../domain/pos.domain";

export class PosUseCases implements IPosUseCases {
  constructor(
    private readonly repoPort: IPosOrderRepositoryPort,
    private readonly accountingPort: IPosAccountingPort
  ) {}

  public async createOrder(dto: CreatePosOrderDTO): Promise<PosOrderDomain> {
    const order = PosOrderDomain.create(dto);
    const saved = await this.repoPort.saveOrder(order);
    await this.accountingPort.recordSaleVoucher(saved);
    return saved;
  }

  public async executeCierreZ(dto: CierreZInput): Promise<CierreZResult> {
    const difference = Math.round(dto.actualCash - dto.expectedCash);
    let status: "SQUARED" | "SHORTAGE" | "SURPLUS" = "SQUARED";

    if (difference < 0) status = "SHORTAGE";
    if (difference > 0) status = "SURPLUS";

    const cierreZNumber = `Z-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

    let adjustmentVoucher: string | undefined;
    if (difference !== 0) {
      const res = await this.accountingPort.recordCierreZAdjustment(difference, dto.sessionId, dto.cashierName);
      adjustmentVoucher = res.voucherNumber;
    }

    return {
      cierreZNumber,
      sessionId: dto.sessionId,
      expectedCash: dto.expectedCash,
      closingBalance: dto.actualCash,
      difference,
      status,
      adjustmentVoucher,
    };
  }

  public async evaluateCart(items: CartItemInput[]): Promise<{ totalDiscount: number; appliedPromos: string[] }> {
    return evaluateCartPromotions(items);
  }
}
