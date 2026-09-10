/**
 * Inventory Core UseCases Orchestrator (Hexagonal 5.0)
 */
import { KardexCalculator, StockItemProps, StockMovementProps } from "../domain/inventory.domain";
import { IInventoryRepositoryPort, IInventoryEventPublisherPort, IInventoryUseCases } from "../ports/inventory.ports";

export class InventoryUseCases implements IInventoryUseCases {
  constructor(
    private readonly repo: IInventoryRepositoryPort,
    private readonly eventPublisher: IInventoryEventPublisherPort
  ) {}

  async registerStockEntry(params: {
    companyId: string;
    warehouseId: string;
    productId: string;
    sku: string;
    productName: string;
    quantity: number;
    unitCost: number;
    reference?: string;
    note?: string;
  }): Promise<{ stock: StockItemProps; movement: StockMovementProps }> {
    if (params.quantity <= 0) {
      throw new Error("La cantidad de entrada debe ser superior a 0.");
    }

    const existingStock = await this.repo.getStockItem(params.warehouseId, params.productId);
    const currentQty = existingStock ? existingStock.quantity : 0;
    const currentAvgCost = existingStock ? existingStock.averageCost : 0;

    const newAvgCost = KardexCalculator.calculateNewAverageCost(
      currentQty,
      currentAvgCost,
      params.quantity,
      params.unitCost
    );
    const newQty = currentQty + params.quantity;

    const updatedStock: StockItemProps = {
      id: existingStock ? existingStock.id : `stk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      warehouseId: params.warehouseId,
      productId: params.productId,
      companyId: params.companyId,
      sku: params.sku,
      productName: params.productName,
      quantity: newQty,
      reservedQuantity: existingStock ? existingStock.reservedQuantity : 0,
      availableQuantity: newQty - (existingStock ? existingStock.reservedQuantity : 0),
      averageCost: newAvgCost,
      reorderPoint: existingStock ? existingStock.reorderPoint : 10,
    };

    const savedStock = await this.repo.upsertStockItem(updatedStock);

    const movement = await this.repo.recordMovement({
      companyId: params.companyId,
      warehouseId: params.warehouseId,
      productId: params.productId,
      sku: params.sku,
      movementType: "IN_PURCHASE",
      quantity: params.quantity,
      unitCost: params.unitCost,
      totalCost: params.quantity * params.unitCost,
      balanceAfter: newQty,
      reference: params.reference,
      note: params.note,
    });

    await this.eventPublisher.publishMovementRecorded({
      movementId: movement.id,
      companyId: params.companyId,
      movementType: "IN_PURCHASE",
      quantity: params.quantity,
    });

    return { stock: savedStock, movement };
  }

  async registerStockExit(params: {
    companyId: string;
    warehouseId: string;
    productId: string;
    quantity: number;
    reference?: string;
    note?: string;
  }): Promise<{ stock: StockItemProps; movement: StockMovementProps }> {
    if (params.quantity <= 0) {
      throw new Error("La cantidad de salida debe ser superior a 0.");
    }

    const stock = await this.repo.getStockItem(params.warehouseId, params.productId);
    if (!stock || !KardexCalculator.validateStockAvailability(stock.quantity, params.quantity)) {
      throw new Error(
        `Stock insuficiente en bodega. Disponible: ${stock ? stock.quantity : 0}, Solicitado: ${params.quantity}`
      );
    }

    const newQty = stock.quantity - params.quantity;
    const updatedStock: StockItemProps = {
      ...stock,
      quantity: newQty,
      availableQuantity: newQty - stock.reservedQuantity,
    };

    const savedStock = await this.repo.upsertStockItem(updatedStock);

    const movement = await this.repo.recordMovement({
      companyId: params.companyId,
      warehouseId: params.warehouseId,
      productId: params.productId,
      sku: stock.sku,
      movementType: "OUT_SALE",
      quantity: params.quantity,
      unitCost: stock.averageCost,
      totalCost: params.quantity * stock.averageCost,
      balanceAfter: newQty,
      reference: params.reference,
      note: params.note,
    });

    // Check reorder point
    if (KardexCalculator.isReorderRequired(newQty, stock.reorderPoint)) {
      await this.eventPublisher.publishStockLow({
        companyId: params.companyId,
        warehouseId: params.warehouseId,
        productId: params.productId,
        sku: stock.sku,
        currentQuantity: newQty,
        reorderPoint: stock.reorderPoint,
      });
    }

    await this.eventPublisher.publishMovementRecorded({
      movementId: movement.id,
      companyId: params.companyId,
      movementType: "OUT_SALE",
      quantity: params.quantity,
    });

    return { stock: savedStock, movement };
  }

  async executeTransfer(params: {
    companyId: string;
    originWarehouseId: string;
    destinationWarehouseId: string;
    productId: string;
    quantity: number;
    notes?: string;
  }): Promise<{ success: boolean; transferNumber: string }> {
    if (params.originWarehouseId === params.destinationWarehouseId) {
      throw new Error("La bodega de origen y destino no pueden ser la misma.");
    }

    // Decrement origin
    const exitResult = await this.registerStockExit({
      companyId: params.companyId,
      warehouseId: params.originWarehouseId,
      productId: params.productId,
      quantity: params.quantity,
      note: `Traslado a bodega ${params.destinationWarehouseId}. ${params.notes || ""}`,
    });

    // Increment destination with origin unit cost
    await this.registerStockEntry({
      companyId: params.companyId,
      warehouseId: params.destinationWarehouseId,
      productId: params.productId,
      sku: exitResult.stock.sku,
      productName: exitResult.stock.productName,
      quantity: params.quantity,
      unitCost: exitResult.stock.averageCost,
      note: `Recepción desde bodega ${params.originWarehouseId}. ${params.notes || ""}`,
    });

    const transferNumber = `TRF-${Date.now().toString().slice(-6)}`;
    await this.repo.createTransferOrder({
      transferNumber,
      companyId: params.companyId,
      originWarehouseId: params.originWarehouseId,
      destinationWarehouseId: params.destinationWarehouseId,
      status: "RECEIVED",
      items: [{ productId: params.productId, sku: exitResult.stock.sku, quantity: params.quantity }],
      notes: params.notes,
      dispatchedAt: new Date(),
      receivedAt: new Date(),
    });

    return { success: true, transferNumber };
  }
}
