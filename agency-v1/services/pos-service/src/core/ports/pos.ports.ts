/**
 * POS Service — Hexagonal Ports (Inbound & Outbound Contracts)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { PosOrderDomain, CartItemInput } from "../domain/pos.domain";

export interface CreatePosOrderDTO {
  companyId: string;
  receiptNo?: string;
  paymentMethod: string;
  splitBreakdown?: {
    cash?: number;
    card?: number;
    nequi?: number;
    credit?: number;
  };
  items: CartItemInput[];
  discount?: number;
  customerNit?: string;
  customerName?: string;
}

export interface CierreZInput {
  companyId: string;
  sessionId: string;
  registerName: string;
  cashierName: string;
  expectedCash: number;
  actualCash: number;
  notes?: string;
}

export interface CierreZResult {
  cierreZNumber: string;
  sessionId: string;
  expectedCash: number;
  closingBalance: number;
  difference: number;
  status: "SQUARED" | "SHORTAGE" | "SURPLUS";
  adjustmentVoucher?: string;
}

// Inbound Ports (Use Cases)
export interface IPosUseCases {
  createOrder(dto: CreatePosOrderDTO): Promise<PosOrderDomain>;
  executeCierreZ(dto: CierreZInput): Promise<CierreZResult>;
  evaluateCart(items: CartItemInput[]): Promise<{ totalDiscount: number; appliedPromos: string[] }>;
}

// Outbound Ports (Infrastructure)
export interface IPosOrderRepositoryPort {
  saveOrder(order: PosOrderDomain): Promise<PosOrderDomain>;
  findOrderById(orderId: string): Promise<PosOrderDomain | null>;
}

export interface IPosAccountingPort {
  recordSaleVoucher(order: PosOrderDomain): Promise<{ voucherNumber: string; success: boolean }>;
  recordCierreZAdjustment(diff: number, sessionId: string, cashierName: string): Promise<{ voucherNumber?: string; success: boolean }>;
}
