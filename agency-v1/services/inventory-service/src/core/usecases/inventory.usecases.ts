import {
  KardexCalculator,
  FEFOEngine,
  DemandForecastingEngine,
  StockItemProps,
  StockMovementProps,
  ProductLotProps,
  DemandForecastResult
} from "../domain/inventory.domain";
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
    lotNumber?: string;
    expiryDate?: Date;
  }): Promise<{ stock: StockItemProps; movement: StockMovementProps; lot?: ProductLotProps }> {
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

    // Si viene información de lote y vencimiento, registrar en tbl_inventory_lots
    let createdLot: ProductLotProps | undefined;
    if (params.lotNumber && params.expiryDate) {
      createdLot = await this.repo.createProductLot({
        companyId: params.companyId,
        warehouseId: params.warehouseId,
        productId: params.productId,
        sku: params.sku,
        lotNumber: params.lotNumber,
        quantity: params.quantity,
        initialQuantity: params.quantity,
        unitCost: params.unitCost,
        expiryDate: params.expiryDate,
        status: "ACTIVE",
        notes: params.note,
      });
    }

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

    return { stock: savedStock, movement, lot: createdLot };
  }

  async registerStockExit(params: {
    companyId: string;
    warehouseId: string;
    productId: string;
    quantity: number;
    reference?: string;
    note?: string;
    useFefo?: boolean;
  }): Promise<{ stock: StockItemProps; movement: StockMovementProps; allocatedLots?: { lotId: string; lotNumber: string; quantityToDeduct: number }[] }> {
    if (params.quantity <= 0) {
      throw new Error("La cantidad de salida debe ser superior a 0.");
    }

    const stock = await this.repo.getStockItem(params.warehouseId, params.productId);
    if (!stock || !KardexCalculator.validateStockAvailability(stock.quantity, params.quantity)) {
      throw new Error(
        `Stock insuficiente en bodega. Disponible: ${stock ? stock.quantity : 0}, Solicitado: ${params.quantity}`
      );
    }

    // FEFO (First-Expired, First-Out) inteligente si está activado
    let allocatedLots: { lotId: string; lotNumber: string; quantityToDeduct: number }[] | undefined;
    if (params.useFefo !== false) {
      const activeLots = await this.repo.listLotsByProduct(params.companyId, params.warehouseId, params.productId);
      if (activeLots.length > 0) {
        try {
          allocatedLots = FEFOEngine.allocateLotsFEFO(activeLots, params.quantity);
          for (const alloc of allocatedLots) {
            await this.repo.deductFromLot(alloc.lotId, alloc.quantityToDeduct);
          }
        } catch {
          // Si no alcanzan los lotes trazados, procede con la salida regular
        }
      }
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

    // Validar punto de reorden
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

    return { stock: savedStock, movement, allocatedLots };
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

  /**
   * BOM (Bill of Materials): Descompone un producto compuesto y descuenta ingredientes/insumos
   */
  async decomposeAndDeductBom(params: {
    companyId: string;
    warehouseId: string;
    parentProductId: string;
    parentQuantity: number;
    reference?: string;
  }): Promise<{ componentsDeducted: number }> {
    const components = await this.repo.getBomForProduct(params.companyId, params.parentProductId);
    if (components.length === 0) {
      return { componentsDeducted: 0 };
    }

    for (const comp of components) {
      const wasteMultiplier = 1 + (comp.wasteFactorPct || 0) / 100;
      const totalRequired = comp.quantityRequired * params.parentQuantity * wasteMultiplier;

      await this.registerStockExit({
        companyId: params.companyId,
        warehouseId: params.warehouseId,
        productId: comp.childProductId,
        quantity: totalRequired,
        reference: params.reference || `BOM-${comp.parentSku}`,
        note: `Consumo automático por ensamble de ${params.parentQuantity}x ${comp.parentName}`,
      });
    }

    return { componentsDeducted: components.length };
  }

  /**
   * Genera reporte de DOH (Days on Hand) y sugerencias de reabastecimiento con IA
   */
  async generateDemandForecast(companyId: string, warehouseId?: string): Promise<DemandForecastResult[]> {
    const stockItems = await this.repo.listStockByWarehouse(companyId, warehouseId);
    const forecasts: DemandForecastResult[] = [];

    for (const item of stockItems) {
      const sales30Days = await this.repo.getSalesVolumeLast30Days(companyId, item.productId);
      const forecast = DemandForecastingEngine.calculateForecast(
        item.productId,
        item.sku,
        item.quantity,
        sales30Days
      );

      if (forecast.isReorderSuggested) {
        await this.eventPublisher.publishReorderSuggested({
          companyId,
          productId: item.productId,
          sku: item.sku,
          suggestedQuantity: forecast.suggestedReorderQuantity,
        });
      }

      forecasts.push(forecast);
    }

    return forecasts;
  }

  /**
   * Alertas automáticas de lotes próximos a vencer
   */
  async checkExpiringLotsAlerts(companyId: string, withinDays: number = 30): Promise<ProductLotProps[]> {
    const lots = await this.repo.listExpiringLots(companyId, withinDays);
    const now = Date.now();

    for (const lot of lots) {
      const daysRemaining = Math.max(0, Math.ceil((new Date(lot.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24)));
      await this.eventPublisher.publishLotExpiringSoon({
        companyId,
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        sku: lot.sku,
        daysRemaining,
      });
    }

    return lots;
  }
}
