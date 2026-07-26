import { Router } from "express";
import { AutomationController } from "../controllers/automation.controller";
import { validateRequest } from "../middlewares/automation.middleware";
import { z } from "zod";

const createWorkflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  triggerType: z.string().min(1, "Trigger type is required"),
  triggerConfig: z.record(z.any()).optional(),
  steps: z.array(z.any()).optional(),
});

export const automationRouter = Router();

automationRouter.get("/workflows", AutomationController.getWorkflows);
automationRouter.post("/workflows", validateRequest(createWorkflowSchema), AutomationController.createWorkflow);
