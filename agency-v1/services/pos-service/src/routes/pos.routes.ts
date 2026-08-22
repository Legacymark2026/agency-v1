import { Router } from "express";
import { PosController } from "../controllers/pos.controller.js";
import { validateRequest } from "../middlewares/pos.middleware.js";
import { z } from "zod";

const openSessionSchema = z.object({
  openingBalance: z.number().min(0, "Opening balance must be non-negative"),
  registerId: z.string().optional(),
  cashierId: z.string().optional(),
});

export const posRouter = Router();

posRouter.get("/pos/sessions", PosController.getSessions);
posRouter.post("/pos/sessions/open", validateRequest(openSessionSchema), PosController.openSession);
posRouter.post("/pos/sync-offline", PosController.syncOffline);
posRouter.get("/pos/tickets/:id/qr", PosController.getTicketQr);
