import { Router } from "express";
import { MarketingController } from "../controllers/marketing.controller";
import { validateRequest } from "../middlewares/marketing.middleware";
import { z } from "zod";

const createEmailBlastSchema = z.object({
  name: z.string().min(1, "Blast name is required"),
  subject: z.string().min(1, "Subject is required"),
  htmlBody: z.string().min(1, "HTML body is required"),
  fromName: z.string().optional(),
  fromEmail: z.string().email("Invalid from email").optional(),
});

export const marketingRouter = Router();

marketingRouter.get("/email-blast", MarketingController.getEmailBlasts);
marketingRouter.post("/email-blast", validateRequest(createEmailBlastSchema), MarketingController.createEmailBlast);
