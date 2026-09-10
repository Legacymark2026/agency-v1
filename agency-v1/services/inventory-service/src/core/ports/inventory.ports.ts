/**
 * Inbound and Outbound Ports for Inventory Service (Hexagonal 5.0)
 */
import { WarehouseProps, StockItemProps, StockMovementProps, MovementType } from "../domain/inventory.domain";

export interface IInventoryRepositoryPort {
  // Warehouse
  createWarehouse(warehouse: Omit<WarehouseProps, "id">): Promise<WarehouseProps>;
  findWarehouses(companyId: string): Promise<WarehouseProps[]>;
  findWarehouseById(id: string): Promise<WarehouseProps | null>;

  // Stock
  getStockItem(warehouseId: string, productId: string): Promise<StockItemProps | null>;
  listStockByWarehouse(companyId: string, warehouseId?: string): Promise<StockItemProps[]>;
  upsertStockItem(stock: StockItemProps): Promise<StockItemProps>;

  // Movements & Kardex
  recordMovement(movement: Omit<StockMovementProps, "id" | "createdAt">): Promise<StockMovementProps>;
  getKardexHistory(companyId: string, productId: string, warehouseId?: string): Promise<StockMovementProps[]>;

  // Purchase & Transfer Orders
  createPurchaseOrder(po: any): Promise<any>;
  listPurchaseOrders(companyId: string): Promise<any[]>;
  createTransferOrder(transfer: any): Promise<any>;
  listTransferOrders(companyId: string): Promise<any[]>;
  updateTransferStatus(id: string, status: string, timestampField: string): Promise<any>;
}

export interface IInventoryEventPublisherPort {
  publishStockLow(payload: { companyId: string; warehouseId: string; productId: string; sku: string; currentQuantity: number; reorderPoint: number }): Promise<void>;
  publishMovementRecorded(payload: { movementId: string; companyId: string; movementType: MovementType; quantity: number }): Promise<void>;
}

export interface IInventoryUseCases {
  registerStockEntry(params: { companyId: string; warehouseId: string; productId: string; sku: string; productName: string; quantity: number; unitCost: number; reference?: string; note?: string }): Promise<{ stock: StockItemProps; movement: StockMovementProps }>;
  registerStockExit(params: { companyId: string; warehouseId: string; productId: string; quantity: number; reference?: string; note?: string }): Promise<{ stock: StockItemProps; movement: StockMovementProps }>;
  executeTransfer(params: { companyId: string; originWarehouseId: string; destinationWarehouseId: string; productId: string; quantity: number; notes?: string }): Promise<{ success: boolean; transferNumber: string }>;
}
