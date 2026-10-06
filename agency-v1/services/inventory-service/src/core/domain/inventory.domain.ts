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

export interface StorageBinProps {
  id: string;
  companyId: string;
  warehouseId: string;
  zoneId: string;
  binCode: string;
  aisle: string;
  rack: string;
  shelfLevel: number;
  maxWeightKg: number;
  currentWeightKg: number;
  maxVolumeCm3: number;
  currentVolumeCm3: number;
  velocityTier: "FAST" | "MEDIUM" | "SLOW";
  isActive: boolean;
}

export interface BinAllocationProps {
  id: string;
  companyId: string;
  binId: string;
  productId: string;
  sku: string;
  lotId?: string;
  quantity: number;
  volumeCm3: number;
  weightKg: number;
}

export interface StockMovementProps {
  id: string;
  companyId: string;
  warehouseId: string;
  productId: string;
  sku?: string;
  sourceBinId?: string;
  destinationBinId?: string;
  movementType: MovementType;
  quantity: number;
  unitCost: number;
  totalCost: number;
  balanceAfter: number;
  reference?: string;
  note?: string;
  createdById?: string;
  operatorBadgeId?: string;
  signatureHash?: string;
  createdAt: Date;
}

export interface ProductLotProps {
  id: string;
  companyId: string;
  warehouseId: string;
  productId: string;
  sku: string;
  lotNumber: string;
  quantity: number;
  initialQuantity: number;
  unitCost: number;
  manufactureDate?: Date;
  expiryDate: Date;
  status: "ACTIVE" | "EXPIRED" | "DEPLETED" | "QUARANTINE";
  notes?: string;
  createdAt: Date;
}

export interface BillOfMaterialProps {
  id: string;
  companyId: string;
  parentProductId: string;
  parentSku: string;
  parentName: string;
  childProductId: string;
  childSku: string;
  childName: string;
  quantityRequired: number;
  unit: string;
  wasteFactorPct: number;
  isActive: boolean;
}

export interface DemandForecastResult {
  productId: string;
  sku: string;
  currentStock: number;
  averageDailySales: number;
  daysOnHand: number;
  reorderPoint: number;
  isReorderSuggested: boolean;
  suggestedReorderQuantity: number;
  riskLevel: "CRITICAL" | "LOW_STOCK" | "OPTIMAL" | "OVERSTOCKED";
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

export class FEFOEngine {
  /**
   * Dispatches quantity across lots ordered by expiration date (Earliest Expiry First)
   */
  static allocateLotsFEFO(
    lots: ProductLotProps[],
    requestedQuantity: number
  ): { lotId: string; lotNumber: string; quantityToDeduct: number }[] {
    const activeLots = [...lots]
      .filter((l) => l.status === "ACTIVE" && l.quantity > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    let remaining = requestedQuantity;
    const allocations: { lotId: string; lotNumber: string; quantityToDeduct: number }[] = [];

    for (const lot of activeLots) {
      if (remaining <= 0) break;
      const deduct = Math.min(lot.quantity, remaining);
      allocations.push({
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        quantityToDeduct: deduct,
      });
      remaining -= deduct;
    }

    if (remaining > 0) {
      throw new Error(`Stock en lotes activos insuficiente. Faltan ${remaining} unidades.`);
    }

    return allocations;
  }
}

export class DemandForecastingEngine {
  /**
   * Computes Days On Hand and suggested replenishment quantity
   */
  static calculateForecast(
    productId: string,
    sku: string,
    currentStock: number,
    totalSalesLast30Days: number,
    leadTimeDays: number = 7,
    targetSafetyStockDays: number = 14
  ): DemandForecastResult {
    const averageDailySales = Math.max(0.01, Math.round((totalSalesLast30Days / 30) * 100) / 100);
    const daysOnHand = Math.round((currentStock / averageDailySales) * 10) / 10;
    const reorderPoint = Math.ceil(averageDailySales * (leadTimeDays + targetSafetyStockDays));
    const isReorderSuggested = currentStock <= reorderPoint;
    
    let suggestedReorderQuantity = 0;
    if (isReorderSuggested) {
      const optimalStock = Math.ceil(averageDailySales * 30); // 30 days buffer
      suggestedReorderQuantity = Math.max(0, optimalStock - currentStock);
    }

    let riskLevel: "CRITICAL" | "LOW_STOCK" | "OPTIMAL" | "OVERSTOCKED" = "OPTIMAL";
    if (daysOnHand <= 3) {
      riskLevel = "CRITICAL";
    } else if (daysOnHand <= leadTimeDays + 3) {
      riskLevel = "LOW_STOCK";
    } else if (daysOnHand > 60) {
      riskLevel = "OVERSTOCKED";
    }

    return {
      productId,
      sku,
      currentStock,
      averageDailySales,
      daysOnHand,
      reorderPoint,
      isReorderSuggested,
      suggestedReorderQuantity,
      riskLevel,
    };
  }
}

export class VolumetricFitEngine {
  /**
   * Amazon-Grade Chaotic Storage Volumetric & Weight Calculation
   * Checks if an incoming item fits within bin's dimensional constraints without exceeding weight or safety cube threshold.
   */
  static evaluateBinFit(
    bin: StorageBinProps,
    incomingVolumeCm3: number,
    incomingWeightKg: number,
    safetyThresholdPct: number = 0.85
  ): { canFit: boolean; projectedVolumeUtilPct: number; projectedWeightKg: number; reason?: string } {
    const projectedWeight = bin.currentWeightKg + incomingWeightKg;
    const projectedVolume = bin.currentVolumeCm3 + incomingVolumeCm3;
    const maxAllowedVolume = bin.maxVolumeCm3 * safetyThresholdPct;

    const projectedVolumeUtilPct = Math.round((projectedVolume / bin.maxVolumeCm3) * 1000) / 10;

    if (projectedWeight > bin.maxWeightKg) {
      return {
        canFit: false,
        projectedVolumeUtilPct,
        projectedWeightKg: projectedWeight,
        reason: `Exceso de peso estructural: proyectado ${projectedWeight}kg excede capacidad máxima de ${bin.maxWeightKg}kg.`,
      };
    }

    if (projectedVolume > maxAllowedVolume) {
      return {
        canFit: false,
        projectedVolumeUtilPct,
        projectedWeightKg: projectedWeight,
        reason: `Exceso de volumen espacial: ocupación proyectada de ${projectedVolumeUtilPct}% excede el umbral seguro de ${safetyThresholdPct * 100}%.`,
      };
    }

    return {
      canFit: true,
      projectedVolumeUtilPct,
      projectedWeightKg: projectedWeight,
    };
  }
}

export class CryptographicLedgerSigner {
  /**
   * Generates a tamper-evident SHA-256 hash for immutable audit compliance (FDA 21 CFR Part 11)
   */
  static generateSignatureHash(payload: {
    previousHash?: string;
    transactionUuid: string;
    companyId: string;
    warehouseId: string;
    productId: string;
    quantity: number;
    movementType: string;
    balanceAfter: number;
    timestamp: Date;
    operatorBadgeId?: string;
  }): string {
    const crypto = require("crypto");
    const dataString = `${payload.previousHash || "GENESIS"}|${payload.transactionUuid}|${payload.companyId}|${payload.warehouseId}|${payload.productId}|${payload.quantity}|${payload.movementType}|${payload.balanceAfter}|${payload.timestamp.toISOString()}|${payload.operatorBadgeId || "SYSTEM"}`;
    return crypto.createHash("sha256").update(dataString).digest("hex");
  }

  /**
   * Verifies if a ledger entry's hash matches its calculated content
   */
  static verifyIntegrity(
    signatureHash: string,
    payload: {
      previousHash?: string;
      transactionUuid: string;
      companyId: string;
      warehouseId: string;
      productId: string;
      quantity: number;
      movementType: string;
      balanceAfter: number;
      timestamp: Date;
      operatorBadgeId?: string;
    }
  ): boolean {
    const expectedHash = this.generateSignatureHash(payload);
    return signatureHash === expectedHash;
  }
}

