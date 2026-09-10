/**
 * Pure Unit Tests for Inventory Service (Hexagonal 5.0)
 * Runs in memory without database dependencies.
 */
import { describe, it, expect, vi } from "vitest";
import { KardexCalculator } from "./core/domain/inventory.domain";
import { InventoryUseCases } from "./core/usecases/inventory.usecases";
import { IInventoryRepositoryPort, IInventoryEventPublisherPort } from "./core/ports/inventory.ports";

describe("Inventory Engine — Kardex & Weighted Cost Calculator", () => {
  it("calculates correct weighted average cost on incoming purchase", () => {
    // Current stock: 10 units @ $1,000 COP = $10,000
    // Incoming stock: 20 units @ $1,600 COP = $32,000
    // Total value: $42,000 / 30 units = $1,400 COP
    const newCost = KardexCalculator.calculateNewAverageCost(10, 1000, 20, 1600);
    expect(newCost).toBe(1400);
  });

  it("handles initial stock entry when current quantity is zero", () => {
    const newCost = KardexCalculator.calculateNewAverageCost(0, 0, 50, 2500);
    expect(newCost).toBe(2500);
  });

  it("validates stock availability correctly", () => {
    expect(KardexCalculator.validateStockAvailability(15, 10)).toBe(true);
    expect(KardexCalculator.validateStockAvailability(15, 15)).toBe(true);
    expect(KardexCalculator.validateStockAvailability(10, 15)).toBe(false);
  });

  it("triggers reorder alert when current quantity falls below threshold", () => {
    expect(KardexCalculator.isReorderRequired(5, 10)).toBe(true);
    expect(KardexCalculator.isReorderRequired(10, 10)).toBe(true);
    expect(KardexCalculator.isReorderRequired(11, 10)).toBe(false);
  });
});

describe("Inventory UseCases — Hexagonal Inbound & Outbound Ports", () => {
  const stockStore = new Map<string, any>();
  const publishedEvents: any[] = [];

  const mockRepo: IInventoryRepositoryPort = {
    createWarehouse: vi.fn(),
    findWarehouses: vi.fn(),
    findWarehouseById: vi.fn(),
    getStockItem: async (warehouseId, productId) => {
      return stockStore.get(`${warehouseId}_${productId}`) || null;
    },
    listStockByWarehouse: vi.fn(),
    upsertStockItem: async (stock) => {
      stockStore.set(`${stock.warehouseId}_${stock.productId}`, stock);
      return stock;
    },
    recordMovement: async (mov) => ({
      id: "mov-test-1",
      createdAt: new Date(),
      ...mov,
    }),
    getKardexHistory: vi.fn(),
    createPurchaseOrder: vi.fn(),
    listPurchaseOrders: vi.fn(),
    createTransferOrder: vi.fn(),
    listTransferOrders: vi.fn(),
    updateTransferStatus: vi.fn(),
  };

  const mockPublisher: IInventoryEventPublisherPort = {
    publishStockLow: async (payload) => {
      publishedEvents.push({ topic: "inventory.stock.low", payload });
    },
    publishMovementRecorded: async (payload) => {
      publishedEvents.push({ topic: "inventory.movement.recorded", payload });
    },
  };

  const useCases = new InventoryUseCases(mockRepo, mockPublisher);

  it("registers stock entry and updates weighted cost in memory", async () => {
    const res = await useCases.registerStockEntry({
      companyId: "comp-1",
      warehouseId: "wh-principal",
      productId: "prod-harina",
      sku: "HAR-001",
      productName: "Harina de Trigo 1Kg",
      quantity: 100,
      unitCost: 3500,
      reference: "FACT-PROV-102",
    });

    expect(res.stock.quantity).toBe(100);
    expect(res.stock.averageCost).toBe(3500);
    expect(res.movement.movementType).toBe("IN_PURCHASE");
  });

  it("registers stock exit, validates balance and raises reorder event if below threshold", async () => {
    // Current is 100. Let's sell 95 units (leaving 5, which is <= reorderPoint 10)
    const res = await useCases.registerStockExit({
      companyId: "comp-1",
      warehouseId: "wh-principal",
      productId: "prod-harina",
      quantity: 95,
      reference: "POS-VENTA-001",
    });

    expect(res.stock.quantity).toBe(5);
    const lowStockAlert = publishedEvents.find(e => e.topic === "inventory.stock.low");
    expect(lowStockAlert).toBeDefined();
    expect(lowStockAlert?.payload.currentQuantity).toBe(5);
  });

  it("throws error when trying to exit more stock than available", async () => {
    await expect(
      useCases.registerStockExit({
        companyId: "comp-1",
        warehouseId: "wh-principal",
        productId: "prod-harina",
        quantity: 20, // Only 5 available
      })
    ).rejects.toThrow("Stock insuficiente");
  });
});
