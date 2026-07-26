import { Router } from "express";
import { GatewayController } from "../controllers/gateway.controller";

export const gatewayRouter = Router();

gatewayRouter.post("/gateway/verify-token", GatewayController.verifyToken);
gatewayRouter.get("/gateway/services", GatewayController.listServices);
