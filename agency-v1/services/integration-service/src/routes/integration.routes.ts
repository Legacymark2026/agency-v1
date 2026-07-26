import { Router } from "express";
import { IntegrationController } from "../controllers/integration.controller";
import { validateRequest } from "../middlewares/integration.middleware";
import { z } from "zod";

const connectIntegrationSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  config: z.record(z.any()).optional(),
});

export const integrationRouter = Router();

integrationRouter.get("/integrations", IntegrationController.getIntegrations);
integrationRouter.post("/integrations", validateRequest(connectIntegrationSchema), IntegrationController.connectIntegration);
