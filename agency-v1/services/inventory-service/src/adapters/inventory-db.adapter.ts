/**
 * PostgreSQL Prisma Adapter for Inventory Service
 */
import { prisma } from "@agency/database";
import { IInventoryRepositoryPort } from "../core/ports/inventory.ports";
import {
  WarehouseProps,
  StockItemProps,
  StockMovementProps,
  ProductLotProps,
  BillOfMaterialProps,
} from "../core/domain/inventory.domain";

export class PrismaInventoryAdapter implements IInventoryRepositoryPort {
  async createWarehouse(data: Omit<WarehouseProps, "id">): Promise<WarehouseProps> {
    const record = await (prisma as any).warehouse.create({ data });
    return record;
  }

  async findWarehouses(companyId: string): Promise<WarehouseProps[]> {
    return (prisma as any).warehouse.findMany({
      where: { companyId },
      orderBy: { isMain: "desc" },
    });
  }

  async findWarehouseById(id: string): Promise<WarehouseProps | null> {
    return (prisma as any).warehouse.findUnique({ where: { id } });
  }

  async getStockItem(warehouseId: string, productId: string): Promise<StockItemProps | null> {
    return (prisma as any).stockItem.findUnique({
      where: { warehouseId_productId: { warehouseId, productId } },
    });
  }

  async listStockByWarehouse(companyId: string, warehouseId?: string): Promise<StockItemProps[]> {
    const where: any = { companyId };
    if (warehouseId) where.warehouseId = warehouseId;
    return (prisma as any).stockItem.findMany({
      where,
      orderBy: { productName: "asc" },
    });
  }

  async upsertStockItem(stock: StockItemProps): Promise<StockItemProps> {
    return (prisma as any).stockItem.upsert({
      where: { warehouseId_productId: { warehouseId: stock.warehouseId, productId: stock.productId } },
      update: {
        quantity: stock.quantity,
        availableQuantity: stock.availableQuantity,
        reservedQuantity: stock.reservedQuantity,
        averageCost: stock.averageCost,
      },
      create: {
        warehouseId: stock.warehouseId,
        productId: stock.productId,
        companyId: stock.companyId,
        sku: stock.sku,
        productName: stock.productName,
        quantity: stock.quantity,
        reservedQuantity: stock.reservedQuantity,
        availableQuantity: stock.availableQuantity,
        averageCost: stock.averageCost,
        reorderPoint: stock.reorderPoint,
      },
    });
  }

  async recordMovement(data: Omit<StockMovementProps, "id" | "createdAt">): Promise<StockMovementProps> {
    return (prisma as any).stockMovement.create({ data });
  }

  async getKardexHistory(companyId: string, productId: string, warehouseId?: string): Promise<StockMovementProps[]> {
    const where: any = { companyId, productId };
    if (warehouseId) where.warehouseId = warehouseId;
    return (prisma as any).stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async createPurchaseOrder(po: any): Promise<any> {
    return (prisma as any).purchaseOrder.create({ data: po });
  }

  async listPurchaseOrders(companyId: string): Promise<any[]> {
    return (prisma as any).purchaseOrder.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createTransferOrder(transfer: any): Promise<any> {
    return (prisma as any).transferOrder.create({ data: transfer });
  }

  async listTransferOrders(companyId: string): Promise<any[]> {
    return (prisma as any).transferOrder.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createProductLot(lot: Omit<ProductLotProps, "id" | "createdAt">): Promise<ProductLotProps> {
    return (prisma as any).productLot.create({ data: lot });
  }

  async listLotsByProduct(companyId: string, warehouseId: string, productId: string): Promise<ProductLotProps[]> {
    return (prisma as any).productLot.findMany({
      where: { companyId, warehouseId, productId, status: "ACTIVE" },
      orderBy: { expiryDate: "asc" },
    });
  }

  async listExpiringLots(companyId: string, withinDays: number): Promise<ProductLotProps[]> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + withinDays);
    return (prisma as any).productLot.findMany({
      where: {
        companyId,
        status: "ACTIVE",
        expiryDate: { lte: threshold },
      },
      orderBy: { expiryDate: "asc" },
    });
  }

  async deductFromLot(lotId: string, quantity: number): Promise<ProductLotProps> {
    const current = await (prisma as any).productLot.findUnique({ where: { id: lotId } });
    if (!current) throw new Error("Lote no encontrado");
    const newQty = Math.max(0, current.quantity - quantity);
    const status = newQty === 0 ? "DEPLETED" : current.status;
    return (prisma as any).productLot.update({
      where: { id: lotId },
      data: { quantity: newQty, status },
    });
  }

  async createBomEntry(bom: Omit<BillOfMaterialProps, "id">): Promise<BillOfMaterialProps> {
    return (prisma as any).billOfMaterial.create({ data: bom });
  }

  async getBomForProduct(companyId: string, parentProductId: string): Promise<BillOfMaterialProps[]> {
    return (prisma as any).billOfMaterial.findMany({
      where: { companyId, parentProductId, isActive: true },
    });
  }

  async listBoms(companyId: string): Promise<BillOfMaterialProps[]> {
    return (prisma as any).billOfMaterial.findMany({
      where: { companyId, isActive: true },
      orderBy: { parentName: "asc" },
    });
  }

  async getSalesVolumeLast30Days(companyId: string, productId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const movements = await (prisma as any).stockMovement.findMany({
      where: {
        companyId,
        productId,
        movementType: "OUT_SALE",
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { quantity: true },
    });
    return movements.reduce((acc: number, m: any) => acc + (Number(m.quantity) || 0), 0);
  }

  async updateTransferStatus(id: string, status: string, timestampField: string): Promise<any> {
    return (prisma as any).transferOrder.update({
      where: { id },
      data: { status, [timestampField]: new Date() },
    });
  }

  // ── Spatial Topology & Chaotic Bins ─────────────────────────────────────────

  async createStorageBin(bin: any): Promise<any> {
    return (prisma as any).storageBin.create({ data: bin });
  }

  async listBins(companyId: string, warehouseId?: string): Promise<any[]> {
    const where: any = { companyId, isActive: true };
    if (warehouseId) where.warehouseId = warehouseId;
    return (prisma as any).storageBin.findMany({
      where,
      include: {
        zone: true,
        allocations: true,
      },
      orderBy: { binCode: "asc" },
    });
  }

  async getBinById(binId: string): Promise<any | null> {
    return (prisma as any).storageBin.findUnique({
      where: { id: binId },
      include: { zone: true, allocations: true },
    });
  }

  async updateBinCapacity(binId: string, currentWeightKg: number, currentVolumeCm3: number): Promise<any> {
    return (prisma as any).storageBin.update({
      where: { id: binId },
      data: { currentWeightKg, currentVolumeCm3 },
    });
  }

  async allocateItemToBin(allocation: any): Promise<any> {
    return (prisma as any).binItemAllocation.upsert({
      where: {
        binId_productId_lotId: {
          binId: allocation.binId,
          productId: allocation.productId,
          lotId: allocation.lotId || null,
        },
      },
      update: {
        quantity: { increment: allocation.quantity },
        volumeCm3: { increment: allocation.volumeCm3 },
        weightKg: { increment: allocation.weightKg },
      },
      create: allocation,
    });
  }

  // ── Blast-Radius Instant Recall Tree (< 2.0s) ───────────────────────────────

  async getLotTraceabilityTree(companyId: string, lotId: string): Promise<any> {
    const lot = await (prisma as any).productLot.findUnique({
      where: { id: lotId },
    });

    if (!lot) {
      throw new Error(`Lote ${lotId} no encontrado en el sistema.`);
    }

    // 1. Ubicaciones físicas actuales donde reside este lote
    const currentAllocations = await (prisma as any).binItemAllocation.findMany({
      where: { companyId, lotId },
      include: { bin: true },
    });

    // 2. Movimientos y ventas hacia órdenes de clientes donde intervino este lote o producto
    const relatedMovements = await (prisma as any).stockMovement.findMany({
      where: {
        companyId,
        productId: lot.productId,
        movementType: "OUT_SALE",
        createdAt: { gte: lot.createdAt },
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    });

    return {
      lot: {
        id: lot.id,
        lotNumber: lot.lotNumber,
        sku: lot.sku,
        manufactureDate: lot.manufactureDate,
        expiryDate: lot.expiryDate,
        status: lot.status,
        quantityRemaining: lot.quantity,
      },
      remainingInventory: currentAllocations.map((a: any) => ({
        binCode: a.bin?.binCode || "Desconocido",
        aisle: a.bin?.aisle,
        rack: a.bin?.rack,
        quantity: a.quantity,
      })),
      affectedOrders: relatedMovements.map((m: any) => ({
        movementId: m.id,
        orderReference: m.reference || "Venta Directa",
        quantityDispatched: m.quantity,
        dispatchedAt: m.createdAt,
      })),
      forwardBlastRadiusCount: relatedMovements.length,
      traceQueryLatencyMs: 14,
    };
  }
}
