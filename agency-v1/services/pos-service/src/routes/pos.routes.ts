import { Router } from "express";
import { PosController } from "../controllers/pos.controller";
import { validateRequest } from "../middlewares/pos.middleware";
import { z } from "zod";

const openSessionSchema = z.object({
  openingBalance: z.number().min(0, "Opening balance must be non-negative"),
  registerId: z.string().optional(),
  cashierId: z.string().optional(),
});

export const posRouter = Router();

posRouter.get("/pos/sessions", PosController.getSessions);
posRouter.post("/pos/sessions/open", validateRequest(openSessionSchema), PosController.openSession);
