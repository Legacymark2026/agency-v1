import {
  WarehouseProps,
  StockItemProps,
  StockMovementProps,
  MovementType,
  ProductLotProps,
  BillOfMaterialProps,
  DemandForecastResult
} from "../domain/inventory.domain";

export interface IInventoryRepositoryPort {
  // Warehouse
  createWarehouse(warehouse: Omit<WarehouseProps, "id">): Promise<WarehouseProps>;
  findWarehouses(companyId: string): Promise<WarehouseProps[]>;
  findWarehouseById(id: string): Promise<WarehouseProps | null>;

  // Stock
  getStockItem(warehouseId: string, productId: string): Promise<StockItemProps | null>;
  listStockByWarehouse(companyId: string, warehouseId?: string): Promise<StockItemProps[]>;
  upsertStockItem(stock: StockItemProps): Promise<StockItemProps>;

  // Lots & FEFO
  createProductLot(lot: Omit<ProductLotProps, "id" | "createdAt">): Promise<ProductLotProps>;
  listLotsByProduct(companyId: string, warehouseId: string, productId: string): Promise<ProductLotProps[]>;
  listExpiringLots(companyId: string, withinDays: number): Promise<ProductLotProps[]>;
  deductFromLot(lotId: string, quantity: number): Promise<ProductLotProps>;

  // Bill of Materials (BOM / Recipes)
  createBomEntry(bom: Omit<BillOfMaterialProps, "id">): Promise<BillOfMaterialProps>;
  getBomForProduct(companyId: string, parentProductId: string): Promise<BillOfMaterialProps[]>;
  listBoms(companyId: string): Promise<BillOfMaterialProps[]>;

  // Movements & Kardex
  recordMovement(movement: Omit<StockMovementProps, "id" | "createdAt">): Promise<StockMovementProps>;
  getKardexHistory(companyId: string, productId: string, warehouseId?: string): Promise<StockMovementProps[]>;
  getSalesVolumeLast30Days(companyId: string, productId: string): Promise<number>;

  // Purchase & Transfer Orders
  createPurchaseOrder(po: any): Promise<any>;
  listPurchaseOrders(companyId: string): Promise<any[]>;
  createTransferOrder(transfer: any): Promise<any>;
  listTransferOrders(companyId: string): Promise<any[]>;
  updateTransferStatus(id: string, status: string, timestampField: string): Promise<any>;

  // Spatial Topology & Chaotic Bins
  createStorageBin(bin: any): Promise<any>;
  listBins(companyId: string, warehouseId?: string): Promise<any[]>;
  getBinById(binId: string): Promise<any | null>;
  updateBinCapacity(binId: string, currentWeightKg: number, currentVolumeCm3: number): Promise<any>;
  allocateItemToBin(allocation: any): Promise<any>;

  // Blast-Radius Recall Queries
  getLotTraceabilityTree(companyId: string, lotId: string): Promise<any>;
}

export interface IInventoryEventPublisherPort {
  publishStockLow(payload: { companyId: string; warehouseId: string; productId: string; sku: string; currentQuantity: number; reorderPoint: number }): Promise<void>;
  publishMovementRecorded(payload: { movementId: string; companyId: string; movementType: MovementType; quantity: number }): Promise<void>;
  publishLotExpiringSoon(payload: { companyId: string; lotId: string; lotNumber: string; sku: string; daysRemaining: number }): Promise<void>;
  publishReorderSuggested(payload: { companyId: string; productId: string; sku: string; suggestedQuantity: number }): Promise<void>;
}

export interface IInventoryUseCases {
  registerStockEntry(params: { companyId: string; warehouseId: string; productId: string; sku: string; productName: string; quantity: number; unitCost: number; reference?: string; note?: string; lotNumber?: string; expiryDate?: Date; destinationBinId?: string; operatorBadgeId?: string }): Promise<{ stock: StockItemProps; movement: StockMovementProps; lot?: ProductLotProps }>;
  registerStockExit(params: { companyId: string; warehouseId: string; productId: string; quantity: number; reference?: string; note?: string; useFefo?: boolean; sourceBinId?: string; operatorBadgeId?: string }): Promise<{ stock: StockItemProps; movement: StockMovementProps; allocatedLots?: { lotId: string; lotNumber: string; quantityToDeduct: number }[] }>;
  executeTransfer(params: { companyId: string; originWarehouseId: string; destinationWarehouseId: string; productId: string; quantity: number; notes?: string }): Promise<{ success: boolean; transferNumber: string }>;
  decomposeAndDeductBom(params: { companyId: string; warehouseId: string; parentProductId: string; parentQuantity: number; reference?: string }): Promise<{ componentsDeducted: number }>;
  generateDemandForecast(companyId: string, warehouseId?: string): Promise<DemandForecastResult[]>;
  checkExpiringLotsAlerts(companyId: string, withinDays?: number): Promise<ProductLotProps[]>;
  stowItemChaoticBin(params: { companyId: string; warehouseId: string; binId: string; productId: string; sku: string; quantity: number; itemVolumeCm3: number; itemWeightKg: number; lotId?: string }): Promise<{ success: boolean; binId: string; projectedVolumePct: number }>;
  traceRecallBlastRadius(companyId: string, lotId: string): Promise<{ lot: any; affectedOrders: any[]; remainingInventory: any[]; forwardBlastRadiusCount: number }>;
}
