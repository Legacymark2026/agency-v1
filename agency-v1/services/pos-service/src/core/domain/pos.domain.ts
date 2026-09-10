/**
 * POS Service — Pure Domain Entities & Calculations (Zero Framework Dependencies)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface CartItemInput {
  sku: string;
  quantity: number;
  unitPrice: number;
  title: string;
  taxRate?: number;
  costPrice?: number;
}

export interface PromotionRule {
  id: string;
  name: string;
  type: "BUY_N_GET_M" | "BUNDLE";
  targetSku?: string;
  requiredQty?: number;
  discountPct?: number;
  bundleSkus?: string[];
  bundleFixedPrice?: number;
}

export const ACTIVE_PROMOTIONS: PromotionRule[] = [
  {
    id: "promo_3x2_hardware",
    name: "Promoción 3x2 en Accesorios POS",
    type: "BUY_N_GET_M",
    targetSku: "HW-006",
    requiredQty: 3,
    discountPct: 100,
  },
  {
    id: "promo_starter_bundle",
    name: "Combo Super Kit Inicial POS (Impresora + Lector)",
    type: "BUNDLE",
    bundleSkus: ["HW-005", "HW-006"],
    bundleFixedPrice: 500000,
  },
];

export function evaluateCartPromotions(items: CartItemInput[]) {
  let totalDiscount = 0;
  const appliedPromos: string[] = [];

  const bundlePromo = ACTIVE_PROMOTIONS.find((p) => p.type === "BUNDLE" && p.bundleSkus);
  if (bundlePromo && bundlePromo.bundleSkus && bundlePromo.bundleFixedPrice) {
    const hasAllSkus = bundlePromo.bundleSkus.every((sku) =>
      items.some((item) => item.sku === sku && item.quantity >= 1)
    );

    if (hasAllSkus) {
      const regularBundleSum = items
        .filter((item) => bundlePromo.bundleSkus!.includes(item.sku))
        .reduce((sum, item) => sum + item.unitPrice, 0);

      const bundleSavings = regularBundleSum - bundlePromo.bundleFixedPrice;
      if (bundleSavings > 0) {
        totalDiscount += bundleSavings;
        appliedPromos.push(`${bundlePromo.name} (-$${bundleSavings.toLocaleString("es-CO")})`);
      }
    }
  }

  items.forEach((item) => {
    const promo = ACTIVE_PROMOTIONS.find((p) => p.type === "BUY_N_GET_M" && p.targetSku === item.sku);
    if (promo && promo.requiredQty && item.quantity >= promo.requiredQty) {
      const freeItemsCount = Math.floor(item.quantity / promo.requiredQty);
      const promoDiscount = freeItemsCount * item.unitPrice;
      totalDiscount += promoDiscount;
      appliedPromos.push(`${promo.name}: ${freeItemsCount} unidad(es) gratis (-$${promoDiscount.toLocaleString("es-CO")})`);
    }
  });

  return { totalDiscount, appliedPromos };
}

export function calculatePosCart(items: Array<{ quantity: number; unitPrice: number; taxRate: number }>, discount = 0) {
  let subtotal = 0;
  let tax = 0;

  items.forEach((item) => {
    const lineSub = item.quantity * item.unitPrice;
    const lineTax = lineSub * item.taxRate;
    subtotal += lineSub;
    tax += lineTax;
  });

  const totalGross = subtotal + tax;
  const finalTotal = Math.max(0, totalGross - discount);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(finalTotal * 100) / 100,
  };
}

export function calculateCashChange(total: number, cashReceived: number) {
  return Math.max(0, cashReceived - total);
}

export class PosOrderDomain {
  constructor(
    public readonly id: string,
    public readonly receiptNo: string,
    public readonly companyId: string,
    public readonly paymentMethod: string,
    public readonly subtotal: number,
    public readonly tax: number,
    public readonly total: number,
    public readonly items: CartItemInput[],
    public readonly createdAt: Date = new Date()
  ) {}

  public static create(dto: {
    companyId: string;
    receiptNo?: string;
    paymentMethod: string;
    items: CartItemInput[];
    discount?: number;
  }): PosOrderDomain {
    const promo = evaluateCartPromotions(dto.items);
    const totalDiscount = (dto.discount || 0) + promo.totalDiscount;
    const itemsWithTax = dto.items.map(i => ({ ...i, taxRate: i.taxRate ?? 0.19 }));
    const totals = calculatePosCart(itemsWithTax, totalDiscount);

    const receiptNo = dto.receiptNo || `POS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return new PosOrderDomain(
      "ord_" + Math.random().toString(36).substring(2, 9),
      receiptNo,
      dto.companyId,
      dto.paymentMethod,
      totals.subtotal,
      totals.tax,
      totals.total,
      dto.items
    );
  }
}
