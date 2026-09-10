/**
 * Inventory Domain Models & Business Rules (Hexagonal 5.0 Core)
 * Pure domain models, no database or framework dependencies.
 */

export interface WarehouseProps {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  isMain: boolean;
  isActive: boolean;
}

export interface StockItemProps {
  id: string;
  warehouseId: string;
  productId: string;
  companyId: string;
  sku: string;
  productName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  averageCost: number;
  reorderPoint: number;
  lotNumber?: string;
  expiryDate?: Date;
}

export type MovementType =
  | "IN_PURCHASE"
  | "OUT_SALE"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "ADJUSTMENT_POSITIVE"
  | "ADJUSTMENT_NEGATIVE";

export interface StockMovementProps {
  id: string;
  companyId: string;
  warehouseId: string;
  productId: string;
  sku?: string;
  movementType: MovementType;
  quantity: number;
  unitCost: number;
  totalCost: number;
  balanceAfter: number;
  reference?: string;
  note?: string;
  createdById?: string;
  createdAt: Date;
}

export class KardexCalculator {
  /**
   * Calculates new Weighted Average Cost (Costo Promedio Ponderado)
   * New Avg Cost = ((Current Qty * Current Avg Cost) + (Incoming Qty * Incoming Unit Cost)) / (Current Qty + Incoming Qty)
   */
  static calculateNewAverageCost(
    currentQuantity: number,
    currentAvgCost: number,
    incomingQuantity: number,
    incomingUnitCost: number
  ): number {
    const totalQuantity = currentQuantity + incomingQuantity;
    if (totalQuantity <= 0) return 0;
    const totalValue = currentQuantity * currentAvgCost + incomingQuantity * incomingUnitCost;
    return Math.round((totalValue / totalQuantity) * 100) / 100;
  }

  /**
   * Validates if inventory can be decremented without going negative
   */
  static validateStockAvailability(currentQuantity: number, requestedQuantity: number): boolean {
    return currentQuantity >= requestedQuantity;
  }

  /**
   * Checks if stock level is below reorder point
   */
  static isReorderRequired(currentQuantity: number, reorderPoint: number): boolean {
    return currentQuantity <= reorderPoint;
  }
}
