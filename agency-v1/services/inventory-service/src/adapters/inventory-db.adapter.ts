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
}
