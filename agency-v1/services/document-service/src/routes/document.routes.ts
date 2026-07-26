import { Router } from "express";
import { DocumentController } from "../controllers/document.controller";
import { validateRequest } from "../middlewares/document.middleware";
import { z } from "zod";

const createProposalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  clientName: z.string().optional(),
  totalAmount: z.number().optional(),
  content: z.string().optional(),
});

export const documentRouter = Router();

documentRouter.get("/proposals", DocumentController.getProposals);
documentRouter.post("/proposals", validateRequest(createProposalSchema), DocumentController.createProposal);
