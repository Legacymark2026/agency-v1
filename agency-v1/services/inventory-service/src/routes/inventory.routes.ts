/**
 * Inventory Express Routes & Controllers
 */
import { Router, Request, Response } from "express";
import { IInventoryUseCases, IInventoryRepositoryPort } from "../core/ports/inventory.ports";

export function createInventoryRouter(
  useCases: IInventoryUseCases,
  repo: IInventoryRepositoryPort
): Router {
  const router = Router();

  // Warehouses
  router.get("/warehouses", async (req: Request, res: Response) => {
    try {
      const companyId = (req.query.companyId as string) || "default";
      const warehouses = await repo.findWarehouses(companyId);
      res.json({ success: true, data: warehouses });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post("/warehouses", async (req: Request, res: Response) => {
    try {
      const warehouse = await repo.createWarehouse(req.body);
      res.status(201).json({ success: true, data: warehouse });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Stock
  router.get("/stock", async (req: Request, res: Response) => {
    try {
      const companyId = (req.query.companyId as string) || "default";
      const warehouseId = req.query.warehouseId as string | undefined;
      const stock = await repo.listStockByWarehouse(companyId, warehouseId);
      res.json({ success: true, data: stock });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Entries & Exits
  router.post("/entries", async (req: Request, res: Response) => {
    try {
      const result = await useCases.registerStockEntry(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post("/exits", async (req: Request, res: Response) => {
    try {
      const result = await useCases.registerStockExit(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Transfers
  router.get("/transfers", async (req: Request, res: Response) => {
    try {
      const companyId = (req.query.companyId as string) || "default";
      const transfers = await repo.listTransferOrders(companyId);
      res.json({ success: true, data: transfers });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post("/transfers", async (req: Request, res: Response) => {
    try {
      const result = await useCases.executeTransfer(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Kardex
  router.get("/kardex", async (req: Request, res: Response) => {
    try {
      const companyId = req.query.companyId as string;
      const productId = req.query.productId as string;
      const warehouseId = req.query.warehouseId as string | undefined;
      if (!companyId || !productId) {
        return res.status(400).json({ success: false, error: "companyId and productId are required" });
      }
      const history = await repo.getKardexHistory(companyId, productId, warehouseId);
      res.json({ success: true, data: history });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Purchase Orders
  router.get("/purchase-orders", async (req: Request, res: Response) => {
    try {
      const companyId = (req.query.companyId as string) || "default";
      const orders = await repo.listPurchaseOrders(companyId);
      res.json({ success: true, data: orders });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post("/purchase-orders", async (req: Request, res: Response) => {
    try {
      const order = await repo.createPurchaseOrder(req.body);
      res.status(201).json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  return router;
}
