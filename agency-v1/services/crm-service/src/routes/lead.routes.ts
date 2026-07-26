import { Router } from "express";
import { z } from "zod";
import { LeadController } from "../controllers/lead.controller";
import { validateRequest } from "../middlewares/crm.middleware";

export const leadRouter = Router();

const createLeadSchema = z.object({
  companyId: z.string().min(1, "companyId is required").optional(),
  name: z.string().min(1, "name is required"),
  email: z.string().email("invalid email format"),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  score: z.number().int().optional()
});

leadRouter.get("/leads", LeadController.getLeads);
leadRouter.get("/leads/:id", LeadController.getLeadById);
leadRouter.post("/leads", validateRequest(createLeadSchema, "body"), LeadController.createLead);
